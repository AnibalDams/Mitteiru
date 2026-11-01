/**
 * Contratos públicos del motor de fuentes externas.
 *
 * Toda fuente (adaptador) debe devolver estos DTOs normalizados para que el
 * resto de la aplicación no dependa del HTML/JSON particular de cada sitio.
 */

export type SourceCapability =
  | "search"
  | "catalog"
  | "episodes"
  | "servers"
  | "streams";

export type SourceSort = "popular" | "latest";

export type SourceStatus = "ongoing" | "finished" | "unknown";

export type ServerKind = "embed" | "hls" | "mp4" | "unknown" | "link" | "dash";

export type SourceHealthStatus = "ok" | "degraded" | "blocked" | "down";

export interface SourceAnimeSummary {
  sourceId: string;
  externalId: string;
  title: string;
  altTitle?: string;
  poster?: string;
  synopsis?: string;
  year?: string;
  type?: string;
  status: SourceStatus;
  episodeCount?: number;
  score?: number;
  url: string;
}

export interface SourceAnimeDetails extends SourceAnimeSummary {
  genres: string[];
  studio?: string;
  banner?: string;
}

export interface SourceEpisode {
  sourceId: string;
  externalId: string;
  number: number;
  title?: string;
  thumbnail?: string;
  synopsis?: string;
  url?: string;
  airedAt?: string;
  filler?: boolean;
}

export interface SourceServer {
  id: string;
  name: string;
  url: string;
  kind: ServerKind;
  language?: string;
  download?: boolean;
}

export interface SourcePage<T> {
  items: T[];
  page: number;
  hasNextPage: boolean;
}

export interface SourceHealth {
  sourceId: string;
  status: SourceHealthStatus;
  latencyMs: number;
  checkedAt: number;
  message?: string;
  hint?: string;
}

export interface SourceFetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  cacheTtlMs?: number;
  /** Evita reutilizar la caché en peticiones puntuales (p. ej. health checks). */
  noCache?: boolean;
}

/**
 * Superficie mínima de HTTP que consumen los adaptadores. Se define aquí para
 * poder inyectar un transporte falso en los tests sin arrastrar la capa de red.
 */
export interface SourceHttp {
  readonly baseUrl: string;
  getText(url: string, options?: SourceFetchOptions): Promise<string>;
  getJson<T>(url: string, options?: SourceFetchOptions): Promise<T>;
  postText(
    url: string,
    form: Record<string, string>,
    options?: SourceFetchOptions,
  ): Promise<string>;
  postJson<T>(
    url: string,
    form: Record<string, string>,
    options?: SourceFetchOptions,
  ): Promise<T>;
  /** POST con cuerpo JSON (p. ej. Meilisearch). */
  postJsonBody<T>(
    url: string,
    body: unknown,
    options?: SourceFetchOptions,
  ): Promise<T>;
  /** Lee una cookie del jar de la fuente (p. ej. sesión de AnimeOnsen). */
  getCookie(name: string): string | undefined;
  absolute(href: string): string;
}

export interface SourceAdapter {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly language: string;
  readonly description: string;
  readonly version: string;
  readonly capabilities: SourceCapability[];

  search(query: string, page?: number): Promise<SourcePage<SourceAnimeSummary>>;
  catalog?(
    sort: SourceSort,
    page?: number,
  ): Promise<SourcePage<SourceAnimeSummary>>;
  getAnime(externalId: string): Promise<SourceAnimeDetails>;
  getEpisodes(externalId: string): Promise<SourceEpisode[]>;
  getServers?(
    animeExternalId: string,
    episodeExternalId: string,
  ): Promise<SourceServer[]>;
  healthCheck(): Promise<SourceHealth>;
}

export interface SourceMetadata {
  id: string;
  name: string;
  baseUrl: string;
  language: string;
  description: string;
  version: string;
  capabilities: SourceCapability[];
}
