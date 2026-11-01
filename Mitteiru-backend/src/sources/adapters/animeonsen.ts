import type {
  SourceAdapter,
  SourceAnimeDetails,
  SourceAnimeSummary,
  SourceCapability,
  SourceEpisode,
  SourceHealth,
  SourceHttp,
  SourcePage,
  SourceServer,
  SourceSort,
} from "../types";
import {
  SourceError,
  SourceInvalidRequestError,
  SourceParseError,
  SourceUnavailableError,
} from "../errors";
import { measureHealth } from "../health";
import {
  animeOnsenCdnBase,
  animeOnsenWatchUrl,
  normalizeAnimeOnsenEpisodeNumber,
  normalizeAnimeOnsenId,
  parseAnimeOnsenAnime,
  parseAnimeOnsenCatalog,
  parseAnimeOnsenEpisodes,
  parseAnimeOnsenJwtExp,
  parseAnimeOnsenSearch,
  parseAnimeOnsenSearchMeta,
  parseAnimeOnsenSessionToken,
  parseAnimeOnsenVideo,
} from "./animeonsen.parser";
import { createPlaybackToken } from "../playbackToken";
import { log } from "../../libs/logger";

const API_ORIGIN = "https://api.animeonsen.xyz";
const SEARCH_LIMIT = 30;
const CATALOG_LIMIT = 30;

interface Session {
  token: string;
  expiresAt: number;
}

/**
 * Fuente AnimeOnsen (inglés, API v4 + Meilisearch).
 *
 * La API exige un JWT de cliente derivado de la cookie `ao.session` que el
 * sitio entrega en cualquier página. El adaptador lo obtiene, lo cachea hasta
 * su `exp` y lo renueva si la API responde 401.
 *
 * Los episodios se exponen como embed de la página `/watch/...`, que ya usa
 * DASH.js y resuelve el stream con la sesión del navegador.
 */
export class AnimeOnsenSource implements SourceAdapter {
  readonly id = "animeonsen";
  readonly name = "AnimeOnsen";
  readonly baseUrl = "https://www.animeonsen.xyz";
  readonly language = "en";
  readonly description =
    "Catálogo en inglés con API v4, búsqueda Meilisearch y reproductor DASH embebido.";
  readonly version = "1.0.0";
  readonly capabilities: SourceCapability[] = [
    "search",
    "catalog",
    "episodes",
    "servers",
    "streams",
  ];

  private readonly ctx = { sourceId: this.id, baseUrl: this.baseUrl };
  private session?: Session;

  constructor(private readonly http: SourceHttp) {}

  async search(query: string, page = 1): Promise<SourcePage<SourceAnimeSummary>> {
    const term = query.trim();
    if (!term) return { items: [], page, hasNextPage: false };

    const encoded = encodeURIComponent(term);
    const html = await this.http.getText(`/search/${encoded}`, {
      noCache: true,
      cacheTtlMs: 0,
    });
    const meta = parseAnimeOnsenSearchMeta(html);
    if (!meta) {
      throw new SourceParseError(
        this.id,
        "No se pudo obtener el token de búsqueda de AnimeOnsen",
      );
    }

    const offset = (page - 1) * SEARCH_LIMIT;
    const payload = await this.http.postJsonBody<unknown>(
      `${meta.origin}/indexes/content/search`,
      { q: term, limit: SEARCH_LIMIT, offset },
      {
        headers: {
          Authorization: `Bearer ${meta.token}`,
          Origin: this.baseUrl,
          Referer: `${this.baseUrl}/search/${encoded}`,
          "Sec-Fetch-Site": "cross-site",
        },
      },
    );

    return parseAnimeOnsenSearch(payload, this.ctx, page, SEARCH_LIMIT);
  }

  async catalog(
    sort: SourceSort,
    page = 1,
  ): Promise<SourcePage<SourceAnimeSummary>> {
    // La API v4 no expone un orden por popularidad; ambos modos usan el índice
    // general, ordenado por fecha de alta.
    void sort;
    const start = (page - 1) * CATALOG_LIMIT;
    const payload = await this.apiGet<unknown>(
      `/v4/content/index?start=${start}&limit=${CATALOG_LIMIT}`,
      60_000,
    );
    return parseAnimeOnsenCatalog(payload, this.ctx, page);
  }

  async getAnime(externalId: string): Promise<SourceAnimeDetails> {
    const id = this.safeId(externalId);
    const payload = await this.apiGet<unknown>(
      `/v4/content/${id}/extensive`,
      300_000,
    );
    const anime = parseAnimeOnsenAnime(payload, id, this.ctx);

    if (!anime.title || anime.title === id) {
      throw new SourceParseError(
        this.id,
        "No se pudo extraer el título del anime desde la API de AnimeOnsen",
      );
    }

    return anime;
  }

  async getEpisodes(externalId: string): Promise<SourceEpisode[]> {
    const id = this.safeId(externalId);
    const payload = await this.apiGet<unknown>(
      `/v4/content/${id}/episodes`,
      300_000,
    );
    return parseAnimeOnsenEpisodes(payload, id, this.ctx);
  }

  async getServers(
    animeExternalId: string,
    episodeExternalId: string,
  ): Promise<SourceServer[]> {
    const id = this.safeId(animeExternalId);
    const number = this.safeEpisodeNumber(episodeExternalId);
    const servers: SourceServer[] = [];

    try {
      const payload = await this.apiGet<unknown>(
        `/v4/content/${id}/video/${number}`,
        60_000,
      );
      const video = parseAnimeOnsenVideo(payload);
      const cdnBase = animeOnsenCdnBase(video.stream);

      if (cdnBase) {
        const token = createPlaybackToken(cdnBase);
        servers.push({
          id: `animeonsen-dash-${number}`,
          name: "AnimeOnsen DASH",
          url: `/api/sources/animeonsen/playback/${token}/manifest.mpd`,
          kind: "dash",
          language: "en",
        });
      }
    } catch (error) {
      log("warn", "sources.animeonsen.video_unavailable", {
        contentId: id,
        episode: number,
        error: error instanceof Error ? error.message : "unknown",
      });
    }

    servers.push({
      id: `animeonsen-watch-${number}`,
      name: "AnimeOnsen (pestaña)",
      url: animeOnsenWatchUrl(id, number),
      kind: "link",
      language: "en",
    });

    return servers;
  }

  async healthCheck(): Promise<SourceHealth> {
    return measureHealth(this.id, async () => {
      // Fuerza sesión nueva y verifica que la API responda.
      this.session = undefined;
      await this.apiGet("/v4/content/index?start=0&limit=1", 0);
    });
  }

  private async ensureToken(force = false): Promise<string> {
    if (
      !force &&
      this.session &&
      this.session.expiresAt > Date.now() + 60_000
    ) {
      return this.session.token;
    }

    await this.http.getText("/", { noCache: true, cacheTtlMs: 0 });
    const cookie = this.http.getCookie("ao.session");
    if (!cookie) {
      throw new SourceUnavailableError(
        this.id,
        "AnimeOnsen no devolvió la cookie de sesión ao.session",
        502,
      );
    }

    let token: string;
    try {
      token = parseAnimeOnsenSessionToken(cookie);
    } catch (error) {
      throw new SourceParseError(
        this.id,
        error instanceof Error
          ? error.message
          : "No se pudo derivar el token de AnimeOnsen",
      );
    }

    const exp = parseAnimeOnsenJwtExp(token);
    this.session = {
      token,
      expiresAt: exp ? exp * 1000 : Date.now() + 3_600_000,
    };
    return token;
  }

  private async apiGet<T>(path: string, cacheTtlMs: number): Promise<T> {
    const token = await this.ensureToken();

    try {
      return await this.http.getJson<T>(`${API_ORIGIN}${path}`, {
        headers: this.apiHeaders(token),
        cacheTtlMs,
      });
    } catch (error) {
      if (error instanceof SourceError && error.status === 401) {
        const refreshed = await this.ensureToken(true);
        return await this.http.getJson<T>(`${API_ORIGIN}${path}`, {
          headers: this.apiHeaders(refreshed),
          cacheTtlMs,
          noCache: true,
        });
      }
      throw error;
    }
  }

  private apiHeaders(token: string): Record<string, string> {
    return {
      Authorization: `Bearer ${token}`,
      Origin: this.baseUrl,
      Referer: `${this.baseUrl}/`,
      "Sec-Fetch-Site": "cross-site",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
    };
  }

  private safeId(externalId: string): string {
    try {
      return normalizeAnimeOnsenId(externalId);
    } catch {
      throw new SourceInvalidRequestError(
        this.id,
        "Identificador de anime inválido",
      );
    }
  }

  private safeEpisodeNumber(externalId: string): number {
    try {
      return normalizeAnimeOnsenEpisodeNumber(externalId);
    } catch {
      throw new SourceInvalidRequestError(
        this.id,
        "Número de episodio inválido",
      );
    }
  }
}
