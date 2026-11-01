import { badRequest } from "./errors";
import { isSourcesEnabled } from "./features";

/**
 * Política de reproducción por entorno.
 *
 * - Local: motor de fuentes habilitado; se aceptan rutas locales y http(s).
 * - Producción: el motor está apagado, pero los episodios ya importados desde
 *   JKAnime siguen disponibles (decisión de producto). AnimeOnsen y cualquier
 *   otra fuente externa se redactan.
 */

/** Fuentes externas que se mantienen visibles en producción. */
const LEGACY_PRODUCTION_SOURCES = new Set(["jkanime"]);
const LEGACY_PRODUCTION_HOSTS = ["jkanime.net"];

function hostMatches(host: string, candidates: string[]): boolean {
  const normalized = host.toLowerCase();
  return candidates.some(
    (candidate) =>
      normalized === candidate || normalized.endsWith(`.${candidate}`),
  );
}

export function isLegacyPlaybackUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return hostMatches(url.hostname, LEGACY_PRODUCTION_HOSTS);
  } catch {
    return false;
  }
}

function isLegacyEpisode(record: Record<string, unknown>): boolean {
  const sourceId =
    typeof record.sourceId === "string"
      ? record.sourceId.trim().toLowerCase()
      : "";

  // Si tiene sourceId, manda la fuente: AnimeOnsen nunca es legacy.
  if (sourceId) return LEGACY_PRODUCTION_SOURCES.has(sourceId);

  const link = typeof record.link === "string" ? record.link : "";
  return isLegacyPlaybackUrl(link);
}

/** Rutas internas válidas; rechaza `//host` y `/\host`. */
export function isLocalPlaybackPath(value: string): boolean {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
  );
}

export function assertAllowedPlaybackLink(link: string): void {
  const value = link.trim();
  if (!value) return;

  if (isLocalPlaybackPath(value)) return;

  if (!isSourcesEnabled()) {
    // Excepción explícita: episodios legacy de JKAnime.
    if (isLegacyPlaybackUrl(value)) return;
    throw badRequest(
      "En este entorno solo se permiten archivos locales o enlaces de JKAnime",
      "external_playback_disabled",
    );
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return;
  } catch {
    // cae al error genérico
  }

  throw badRequest(
    "El link del episodio debe ser http(s) o una ruta local",
    "invalid_playback_link",
  );
}

/**
 * Quita las URLs de reproducción externa de un episodio cuando las fuentes
 * están deshabilitadas, salvo los episodios legacy de JKAnime.
 */
export function redactEpisodeForPublicApi<T extends object>(episode: T): T {
  if (isSourcesEnabled()) return episode;

  const record = episode as Record<string, unknown>;

  // Episodio local: no hay nada que redactar.
  if (!record.external && !record.sourceId) return episode;

  // JKAnime ya importado: se mantiene visible y reproducible.
  if (isLegacyEpisode(record)) {
    return { ...record, legacyPlayback: true } as T;
  }

  const {
    link: _link,
    servers: _servers,
    sourceId: _sourceId,
    externalId: _externalId,
    animeExternalId: _animeExternalId,
    ...rest
  } = record;

  return {
    ...rest,
    link: "",
    servers: [],
    external: false,
    externalUnavailable: true,
  } as T;
}
