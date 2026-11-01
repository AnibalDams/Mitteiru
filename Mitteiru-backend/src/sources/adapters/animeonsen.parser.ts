/**
 * Parsers puros de AnimeOnsen. No hacen red: reciben JSON/HTML y devuelven
 * DTOs normalizados.
 *
 * La API v4 exige un JWT de cliente que se deriva de la cookie `ao.session`:
 *   base64(cookie) -> string -> cada carácter +1 -> JWT
 * Es una ofuscación reversible del sitio, no un secreto de usuario.
 */

import { load } from "cheerio";
import type {
  SourceAnimeDetails,
  SourceAnimeSummary,
  SourceEpisode,
  SourcePage,
  SourceStatus,
} from "../types";
import {
  cleanText,
  parseNumber,
  sanitizeUrl,
  uniqueBy,
} from "../utils";

interface ParserContext {
  sourceId: string;
  baseUrl: string;
}

const API_ORIGIN = "https://api.animeonsen.xyz";
const SITE_ORIGIN = "https://www.animeonsen.xyz";
const ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return parseNumber(value);
  return undefined;
}

function mapStatus(value: string | undefined): SourceStatus {
  if (!value) return "unknown";
  const normalized = value.toLowerCase().replace(/[_-]+/g, " ");
  if (/(currently airing|airing|ongoing)/.test(normalized)) return "ongoing";
  if (/(finished|completed|concluded)/.test(normalized)) return "finished";
  return "unknown";
}

export function normalizeAnimeOnsenId(input: string): string {
  const value = input.trim();
  const fromUrl = value.match(/\/(?:details|watch)\/([A-Za-z0-9_-]+)/);
  const candidate = (fromUrl?.[1] ?? value).replace(/^\/+|\/+$/g, "");
  if (!ID_PATTERN.test(candidate)) {
    throw new Error(`Identificador inválido de AnimeOnsen: ${input}`);
  }
  return candidate;
}

export function normalizeAnimeOnsenEpisodeNumber(input: string): number {
  const value = input.trim();
  const parsed = parseNumber(value);
  if (parsed === undefined || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Número de episodio inválido de AnimeOnsen: ${input}`);
  }
  return parsed;
}

export function animeOnsenPoster(contentId: string): string {
  return `${API_ORIGIN}/v4/image/210x300/${contentId}`;
}

export function animeOnsenBanner(contentId: string): string {
  return `${API_ORIGIN}/v4/image/1200x360/${contentId}`;
}

export function animeOnsenDetailsUrl(contentId: string): string {
  return `${SITE_ORIGIN}/details/${contentId}`;
}

export function animeOnsenWatchUrl(contentId: string, episode: number): string {
  return `${SITE_ORIGIN}/watch/${contentId}?episode=${episode}`;
}

/**
 * Deriva la base del CDN a partir del manifiesto.
 * Solo acepta `cdn.animeonsen.xyz/video/.../` para evitar SSRF en el proxy.
 */
export function animeOnsenCdnBase(stream: string | undefined): string | undefined {
  if (!stream) return undefined;

  try {
    const url = new URL(stream);
    if (url.protocol !== "https:") return undefined;
    if (url.hostname !== "cdn.animeonsen.xyz") return undefined;
    if (!url.pathname.startsWith("/video/")) return undefined;
    if (!url.pathname.endsWith("/manifest.mpd")) return undefined;

    const basePath = url.pathname.replace(/manifest\.mpd$/, "");
    return `${url.origin}${basePath}`;
  } catch {
    return undefined;
  }
}

export interface AnimeOnsenVideo {
  stream?: string;
  subtitles: Record<string, string>;
}

/** Parsea `/v4/content/{id}/video/{n}`. */
export function parseAnimeOnsenVideo(payload: unknown): AnimeOnsenVideo {
  const root = asRecord(payload);
  const uri = asRecord(root?.uri);

  const stream = sanitizeUrl(asString(uri?.stream));
  const subtitles: Record<string, string> = {};
  const rawSubtitles = asRecord(uri?.subtitles);

  if (rawSubtitles) {
    for (const [language, rawUrl] of Object.entries(rawSubtitles)) {
      const safe = sanitizeUrl(asString(rawUrl));
      if (safe) subtitles[language] = safe;
    }
  }

  return { stream, subtitles };
}

/** Deriva el JWT de la cookie `ao.session`. */
export function parseAnimeOnsenSessionToken(cookieValue: string): string {
  if (!cookieValue || typeof cookieValue !== "string") {
    throw new Error("Cookie ao.session vacía");
  }

  let decoded: string;
  try {
    decoded = Buffer.from(decodeURIComponent(cookieValue), "base64").toString("utf8");
  } catch {
    throw new Error("No se pudo decodificar la cookie ao.session");
  }

  if (!decoded) throw new Error("La cookie ao.session no contiene datos");

  const token = decoded
    .split("")
    .map((char) => String.fromCharCode(char.charCodeAt(0) + 1))
    .join("");

  if (!token.startsWith("eyJ")) {
    throw new Error("La cookie ao.session no produjo un JWT válido");
  }

  return token;
}

/** Extrae `exp` (segundos) del JWT sin validar la firma. */
export function parseAnimeOnsenJwtExp(token: string): number | undefined {
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as Record<string, unknown>;
    return typeof payload.exp === "number" ? payload.exp : undefined;
  } catch {
    return undefined;
  }
}

export interface AnimeOnsenSearchMeta {
  origin: string;
  token: string;
}

export function parseAnimeOnsenSearchMeta(
  html: string,
): AnimeOnsenSearchMeta | undefined {
  const $ = load(html);
  const origin = sanitizeUrl(
    $('meta[name="ao-search-origin"]').attr("content"),
  )?.replace(/\/+$/, "");
  const token = $('meta[name="ao-search-token"]').attr("content")?.trim();

  if (!origin || !token) return undefined;
  return { origin, token };
}

function titleFromRecord(record: Record<string, unknown>): string | undefined {
  const title =
    asString(record.content_title_en) ??
    asString(record.content_title) ??
    asString(record.content_title_jp);
  return title ? cleanText(title) || undefined : undefined;
}

function summaryFromRecord(
  record: Record<string, unknown>,
  ctx: ParserContext,
): SourceAnimeSummary | undefined {
  const contentId = asString(record.content_id);
  const title = titleFromRecord(record);
  if (!contentId || !title) return undefined;

  return {
    sourceId: ctx.sourceId,
    externalId: contentId,
    title,
    altTitle: cleanText(asString(record.content_title)) || undefined,
    poster: animeOnsenPoster(contentId),
    episodeCount: asNumber(record.total_episodes),
    status: "unknown",
    url: animeOnsenDetailsUrl(contentId),
  };
}

/** Parsea la respuesta de Meilisearch (`/indexes/content/search`). */
export function parseAnimeOnsenSearch(
  payload: unknown,
  ctx: ParserContext,
  page: number,
  limit: number,
): SourcePage<SourceAnimeSummary> {
  const root = asRecord(payload);
  const hits = asArray(root?.hits);
  const items = hits
    .map((hit) => summaryFromRecord(asRecord(hit) ?? {}, ctx))
    .filter((item): item is SourceAnimeSummary => Boolean(item));

  const offset = asNumber(root?.offset) ?? (page - 1) * limit;
  const total = asNumber(root?.estimatedTotalHits);

  return {
    items: uniqueBy(items, (item) => item.externalId),
    page,
    hasNextPage: total !== undefined && offset + items.length < total,
  };
}

/** Parsea `/v4/content/index`. */
export function parseAnimeOnsenCatalog(
  payload: unknown,
  ctx: ParserContext,
  page: number,
): SourcePage<SourceAnimeSummary> {
  const root = asRecord(payload);
  const content = asArray(root?.content);
  const items = content
    .map((item) => summaryFromRecord(asRecord(item) ?? {}, ctx))
    .filter((item): item is SourceAnimeSummary => Boolean(item));

  const cursor = asRecord(root?.cursor);
  const next = asArray(cursor?.next);

  return {
    items: uniqueBy(items, (item) => item.externalId),
    page,
    hasNextPage: next[0] === true,
  };
}

/** Parsea `/v4/content/{id}/extensive`. */
export function parseAnimeOnsenAnime(
  payload: unknown,
  externalId: string,
  ctx: ParserContext,
): SourceAnimeDetails {
  const root = asRecord(payload) ?? {};
  const malData = asRecord(root.mal_data) ?? {};

  const title =
    cleanText(
      asString(root.content_title_en) ??
        asString(root.content_title) ??
        externalId,
    ) || externalId;

  const genres = uniqueBy(
    asArray(malData.genres)
      .map((genre) => asString(asRecord(genre)?.name))
      .filter((name): name is string => Boolean(name)),
    (name) => name.toLowerCase(),
  );

  const studios = asArray(malData.studios)
    .map((studio) => asString(asRecord(studio)?.name))
    .filter((name): name is string => Boolean(name));

  const altTitle = cleanText(asString(root.content_title)) || undefined;

  return {
    sourceId: ctx.sourceId,
    externalId,
    title,
    altTitle: altTitle && altTitle !== title ? altTitle : undefined,
    poster: animeOnsenPoster(externalId),
    banner: animeOnsenBanner(externalId),
    synopsis: cleanText(asString(malData.synopsis)) || undefined,
    year: undefined,
    type: root.is_movie === true ? "Movie" : "TV",
    status: mapStatus(asString(malData.status)),
    episodeCount: asNumber(root.total_episodes),
    score: asNumber(malData.mean_score),
    genres,
    studio: studios.length > 0 ? studios.join(", ") : undefined,
    url: animeOnsenDetailsUrl(externalId),
  };
}

/** Parsea `/v4/content/{id}/episodes`. */
export function parseAnimeOnsenEpisodes(
  payload: unknown,
  externalId: string,
  ctx: ParserContext,
): SourceEpisode[] {
  const root = asRecord(payload);
  if (!root) return [];

  const episodes: SourceEpisode[] = [];
  for (const [key, value] of Object.entries(root)) {
    const number = parseNumber(key);
    if (number === undefined || !Number.isInteger(number) || number <= 0) {
      continue;
    }

    const record = asRecord(value) ?? {};
    const title =
      cleanText(asString(record.contentTitle_episode_en)) ||
      `Episodio ${number}`;

    episodes.push({
      sourceId: ctx.sourceId,
      externalId: String(number),
      number,
      title,
      thumbnail: animeOnsenPoster(externalId),
      url: animeOnsenWatchUrl(externalId, number),
    });
  }

  return uniqueBy(episodes, (episode) => episode.externalId).sort(
    (a, b) => a.number - b.number,
  );
}
