/**
 * Importación idempotente de contenido externo al modelo local.
 *
 * Reglas:
 *  - No duplica animes: busca mapeo por (sourceId, externalId), luego por nombre.
 *  - No pisa datos manuales: solo completa campos vacíos.
 *  - Los episodios se hacen upsert por (animeId, episodeNumber).
 *  - Los enlaces de video se guardan como embeds; nunca se rehostean.
 */

import { ObjectId } from "mongodb";
import dbClient from "../libs/dbClient";
import { Anime } from "../classes/animes";
import type { Anime_ } from "../libs/types/Anime";
import type { Episode as IEpisode, EpisodeServer } from "../classes/interfaces/Episodes";
import { getSource } from "./registry";
import {
  SourceDisabledError,
  SourceInvalidRequestError,
  SourceNotFoundError,
  SourceUnavailableError,
} from "./errors";
import { isSourcesEnabled } from "../libs/features";
import type { SourceAnimeDetails, SourceEpisode, SourceServer } from "./types";
import { selectEpisodes } from "./selection";

const animeCollection = dbClient.collection<Anime_>("anime");
const episodeCollection = dbClient.collection<IEpisode>("episodes");

interface SourceMapping {
  _id?: ObjectId;
  sourceId: string;
  externalId: string;
  localAnimeId: ObjectId;
  sourceUrl: string;
  createdAt: number;
  updatedAt: number;
}

const mappingCollection = dbClient.collection<SourceMapping>("sourceMappings");

const MAX_SERVER_LOOKUPS = 30;
const SERVER_CONCURRENCY = 2;

let indexesReady = false;
let pendingImports = 0;
const MAX_PENDING_IMPORTS = 4;
let importQueue: Promise<void> = Promise.resolve();

async function ensureIndexes(): Promise<void> {
  if (indexesReady) return;
  let allOk = true;
  try {
    await mappingCollection.createIndex(
      { sourceId: 1, externalId: 1 },
      { unique: true },
    );
    await mappingCollection.createIndex({ localAnimeId: 1 });
  } catch (error) {
    allOk = false;
    console.warn("No se pudieron crear los índices de sourceMappings:", error);
  }
  // Solo se marca listo si todo salió bien; así se reintenta en la próxima importación.
  if (allOk) indexesReady = true;
}

export interface ImportRequest {
  sourceId: string;
  externalId: string;
  importEpisodes?: boolean;
  episodeNumbers?: number[];
  /** Vincula la fuente a un anime local existente en lugar de crear uno. */
  attachToAnimeId?: string;
}

export interface ImportResult {
  message: string;
  animeId: string;
  createdAnime: boolean;
  episodesImported: number;
  episodesUpdated: number;
  episodesSkipped: number;
  sourceId: string;
  externalId: string;
  warnings: string[];
}

/** Filtra y ordena episodios según la selección del usuario. */
export { selectEpisodes };

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toObjectId(value: string, sourceId: string, label: string): ObjectId {
  try {
    return new ObjectId(value);
  } catch {
    throw new SourceInvalidRequestError(sourceId, `${label} inválido`);
  }
}

async function resolveLocalAnime(
  details: SourceAnimeDetails,
  attachToAnimeId?: string,
): Promise<{ anime: Anime_; created: boolean }> {
  if (attachToAnimeId) {
    const existing = await animeCollection.findOne({
      _id: toObjectId(attachToAnimeId, details.sourceId, "animeId"),
    });
    if (!existing) {
      throw new SourceNotFoundError(
        details.sourceId,
        "El anime local indicado no existe",
      );
    }
    return { anime: existing, created: false };
  }

  const mapping = await mappingCollection.findOne({
    sourceId: details.sourceId,
    externalId: details.externalId,
  });

  if (mapping) {
    const mapped = await animeCollection.findOne({ _id: mapping.localAnimeId });
    if (mapped) return { anime: mapped, created: false };
  }

  const byName = await animeCollection.findOne({
    name: { $regex: `^${escapeRegex(details.title)}$`, $options: "i" },
  });
  if (byName) return { anime: byName, created: false };

  const poster = details.poster ?? "";
  const banner = details.banner ?? details.poster ?? "";

  await new Anime(
    "",
    details.title,
    details.altTitle ?? "",
    details.synopsis ?? "",
    details.year ?? "",
    details.studio ?? "",
    poster,
    banner,
    details.status === "ongoing" ? 1 : 0,
    banner,
    details.genres,
  ).new();

  const created = await animeCollection.findOne({
    name: { $regex: `^${escapeRegex(details.title)}$`, $options: "i" },
  });

  if (!created) {
    throw new SourceNotFoundError(
      details.sourceId,
      "No se pudo crear el anime local a partir de la fuente",
    );
  }

  return { anime: created, created: true };
}

async function attachSource(
  anime: Anime_,
  details: SourceAnimeDetails,
): Promise<void> {
  const existingExternal = anime.externalIds ?? [];
  const alreadyLinked = existingExternal.some(
    (item) =>
      item.sourceId === details.sourceId && item.externalId === details.externalId,
  );

  const update: Partial<Anime_> = {
    lastSyncedAt: Date.now(),
  };

  if (!anime.sourceId) update.sourceId = details.sourceId;
  if (!anime.sourceUrl) update.sourceUrl = details.url;

  if (!alreadyLinked) {
    update.externalIds = [
      ...existingExternal,
      {
        sourceId: details.sourceId,
        externalId: details.externalId,
        url: details.url,
      },
    ];
  }

  // Solo completamos campos vacíos para no pisar ediciones manuales.
  if (!anime.japaneseName && details.altTitle) update.japaneseName = details.altTitle;
  if (!anime.synopsis && details.synopsis) update.synopsis = details.synopsis;
  if (!anime.releaseYear && details.year) update.releaseYear = details.year;
  if (!anime.studio && details.studio) update.studio = details.studio;
  if (!anime.cover && details.poster) update.cover = details.poster;
  if (!anime.image && (details.banner || details.poster)) {
    update.image = details.banner ?? details.poster;
  }
  if (!anime.horizontalImage && (details.banner || details.poster)) {
    update.horizontalImage = details.banner ?? details.poster;
  }
  if ((!anime.genres || anime.genres.length === 0) && details.genres.length > 0) {
    update.genres = details.genres;
  }

  await animeCollection.updateOne({ _id: anime._id }, { $set: update });
}

function primaryServer(servers: SourceServer[]): SourceServer | undefined {
  return (
    servers.find((server) => server.kind === "hls") ??
    servers.find((server) => server.kind === "mp4") ??
    servers[0]
  );
}

async function fetchServersFor(
  sourceId: string,
  animeExternalId: string,
  episode: SourceEpisode,
): Promise<SourceServer[]> {
  try {
    const source = getSource(sourceId);
    if (!source.getServers) return [];
    return await source.getServers(animeExternalId, episode.externalId);
  } catch (error) {
    console.warn(
      `No se pudieron obtener servidores de ${sourceId} para el episodio ${episode.number}:`,
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

async function importEpisodes(
  anime: Anime_,
  details: SourceAnimeDetails,
  episodes: SourceEpisode[],
  warnings: string[],
): Promise<{ imported: number; updated: number }> {
  let imported = 0;
  let updated = 0;

  const canLookupServers = episodes.length <= MAX_SERVER_LOOKUPS;
  if (!canLookupServers) {
    warnings.push(
      `Se importaron ${episodes.length} episodios sin resolver servidores (límite ${MAX_SERVER_LOOKUPS}). Puedes refrescarlos individualmente.`,
    );
  }

  let cursor = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      const episode = episodes[index];
      if (!episode) return;

      const servers = canLookupServers
        ? await fetchServersFor(details.sourceId, details.externalId, episode)
        : [];

      const primary = primaryServer(servers);
      const existing = await episodeCollection.findOne({
        animeId: anime._id,
        episodeNumber: episode.number,
      });

      if (existing) {
        const isExternal = existing.sourceId === details.sourceId;
        const update: Partial<IEpisode> = {
          external: true,
          sourceId: details.sourceId,
          externalId: episode.externalId,
          animeExternalId: details.externalId,
          servers: servers as EpisodeServer[],
          updatedAt: Date.now(),
        };

        if (!existing.link || isExternal) {
          update.link = primary?.url ?? episode.url ?? existing.link ?? "";
        }
        if (!existing.name && episode.title) update.name = episode.title;
        if (!existing.synopsis && episode.synopsis) update.synopsis = episode.synopsis;
        if (!existing.thumbnail && episode.thumbnail) update.thumbnail = episode.thumbnail;

        await episodeCollection.updateOne(
          { _id: existing._id },
          { $set: update },
        );
        updated += 1;
        continue;
      }

      await episodeCollection.insertOne({
        name: episode.title || `Episodio ${episode.number}`,
        synopsis: episode.synopsis ?? "",
        thumbnail: episode.thumbnail ?? "",
        link: primary?.url ?? episode.url ?? "",
        animeId: anime._id as ObjectId,
        episodeNumber: episode.number,
        profileId: "",
        isGlobal: true,
        external: true,
        sourceId: details.sourceId,
        externalId: episode.externalId,
        animeExternalId: details.externalId,
        servers: servers as EpisodeServer[],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      imported += 1;
    }
  };

  const workers = Array.from(
    { length: Math.min(SERVER_CONCURRENCY, Math.max(1, episodes.length)) },
    () => worker(),
  );
  await Promise.all(workers);

  return { imported, updated };
}

export async function importFromSource(
  request: ImportRequest,
): Promise<ImportResult> {
  if (!isSourcesEnabled()) {
    throw new SourceDisabledError();
  }

  // Cola en proceso: evita que varias importaciones simultáneas saturen las
  // fuentes externas y la base de datos.
  if (pendingImports >= MAX_PENDING_IMPORTS) {
    throw new SourceUnavailableError(
      request.sourceId,
      "Hay demasiadas importaciones en curso, intenta de nuevo en unos segundos",
      429,
    );
  }

  pendingImports += 1;
  const run = importQueue.then(() => runImport(request));
  importQueue = run.then(
    () => undefined,
    () => undefined,
  );

  try {
    return await run;
  } finally {
    pendingImports -= 1;
  }
}

async function runImport(request: ImportRequest): Promise<ImportResult> {
  await ensureIndexes();

  const source = getSource(request.sourceId);
  const externalId = request.externalId.trim();
  if (!externalId) {
    throw new SourceInvalidRequestError(source.id, "externalId es obligatorio");
  }

  const details = await source.getAnime(externalId);
  const { anime, created } = await resolveLocalAnime(details, request.attachToAnimeId);

  await mappingCollection.updateOne(
    { sourceId: source.id, externalId },
    {
      $set: {
        sourceId: source.id,
        externalId,
        localAnimeId: anime._id as ObjectId,
        sourceUrl: details.url,
        updatedAt: Date.now(),
      },
      $setOnInsert: { createdAt: Date.now() },
    },
    { upsert: true },
  );

  await attachSource(anime, details);

  const warnings: string[] = [];
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  if (request.importEpisodes !== false) {
    const allEpisodes = await source.getEpisodes(externalId);
    const selection = selectEpisodes(allEpisodes, request.episodeNumbers);
    skipped = selection.skipped;

    if (selection.selected.length === 0) {
      warnings.push(
        request.episodeNumbers?.length === 0
          ? "No se seleccionaron episodios; solo se importó la ficha del anime."
          : "La fuente no devolvió episodios para importar.",
      );
    } else {
      const result = await importEpisodes(anime, details, selection.selected, warnings);
      imported = result.imported;
      updated = result.updated;
    }
  }

  return {
    message: created
      ? "Anime importado correctamente"
      : "Anime actualizado desde la fuente",
    animeId: String(anime._id),
    createdAnime: created,
    episodesImported: imported,
    episodesUpdated: updated,
    episodesSkipped: skipped,
    sourceId: source.id,
    externalId,
    warnings,
  };
}

export interface AnimeSourceMapping {
  sourceId: string;
  externalId: string;
  sourceUrl: string;
  updatedAt: number;
}

export async function getAnimeSourceMappings(
  animeId: string,
): Promise<AnimeSourceMapping[]> {
  if (!isSourcesEnabled()) {
    throw new SourceDisabledError();
  }

  await ensureIndexes();
  const id = toObjectId(animeId, "local", "animeId");
  const mappings = await mappingCollection
    .find({ localAnimeId: id })
    .sort({ updatedAt: -1 })
    .toArray();

  return mappings.map((mapping) => ({
    sourceId: mapping.sourceId,
    externalId: mapping.externalId,
    sourceUrl: mapping.sourceUrl,
    updatedAt: mapping.updatedAt,
  }));
}

export async function refreshEpisodeServers(
  episodeId: string,
): Promise<{ servers: SourceServer[]; link: string }> {
  if (!isSourcesEnabled()) {
    throw new SourceDisabledError();
  }

  const id = toObjectId(episodeId, "local", "episodeId");
  const episode = await episodeCollection.findOne({ _id: id });

  if (!episode) {
    throw new SourceNotFoundError("local", "El episodio no existe");
  }
  if (!episode.sourceId || !episode.externalId || !episode.animeExternalId) {
    throw new SourceInvalidRequestError(
      "local",
      "El episodio no está vinculado a una fuente externa",
    );
  }

  const source = getSource(episode.sourceId);
  if (!source.getServers) {
    throw new SourceInvalidRequestError(
      source.id,
      "La fuente no soporta listado de servidores",
    );
  }

  const servers = await source.getServers(
    episode.animeExternalId,
    episode.externalId,
  );
  const primary = primaryServer(servers);
  const link = primary?.url ?? episode.link ?? "";

  await episodeCollection.updateOne(
    { _id: id },
    {
      $set: {
        servers: servers as EpisodeServer[],
        link,
        external: true,
        updatedAt: Date.now(),
      },
    },
  );

  return { servers, link };
}
