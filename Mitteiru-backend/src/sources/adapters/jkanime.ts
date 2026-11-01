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
import { SourceInvalidRequestError, SourceParseError } from "../errors";
import { measureHealth } from "../health";
import {
  normalizeJkanimeEpisodeNumber,
  normalizeJkanimeSlug,
  parseJkanimeAnime,
  parseJkanimeCards,
  parseJkanimeCsrf,
  parseJkanimeEmbeddedAnimes,
  parseJkanimeEpisodeCount,
  parseJkanimeEpisodes,
  parseJkanimeEpisodesJson,
  parseJkanimeInternalId,
  parseJkanimeServers,
} from "./jkanime.parser";

const MAX_EPISODE_PAGES = 30;
const MAX_THUMBNAIL_PAGES = 3;

/**
 * Fuente JKAnime (español, HTML server-rendered).
 *
 * Cloudflare: puede devolver 521 si el origen está caído. El health check
 * permite degradar la UI sin romper el resto de la aplicación.
 */
export class JkanimeSource implements SourceAdapter {
  readonly id = "jkanime";
  readonly name = "JKAnime";
  readonly baseUrl = "https://jkanime.net";
  readonly language = "es";
  readonly description =
    "Catálogo en español con fichas HTML, episodios paginados y servidores embebidos.";
  readonly version = "1.0.0";
  readonly capabilities: SourceCapability[] = [
    "search",
    "catalog",
    "episodes",
    "servers",
  ];

  private readonly ctx = { sourceId: this.id, baseUrl: this.baseUrl };

  constructor(private readonly http: SourceHttp) {}

  async search(query: string, page = 1): Promise<SourcePage<SourceAnimeSummary>> {
    const term = query.trim();
    if (!term) return { items: [], page, hasNextPage: false };

    const encoded = encodeURIComponent(term);
    const url = page > 1 ? `/buscar/${encoded}/${page}/` : `/buscar/${encoded}/`;
    const html = await this.http.getText(url, { cacheTtlMs: 60_000 });

    const embedded = parseJkanimeEmbeddedAnimes(html, this.ctx, page);
    if (embedded) return embedded;

    const parsed = parseJkanimeCards(html, this.ctx, page);

    if (parsed.items.length === 0 && page === 1) {
      const fallback = await this.http.getText(`/buscar/${encoded}/${page}/`, {
        cacheTtlMs: 60_000,
      });
      return (
        parseJkanimeEmbeddedAnimes(fallback, this.ctx, page) ??
        parseJkanimeCards(fallback, this.ctx, page)
      );
    }

    return parsed;
  }

  async catalog(sort: SourceSort, page = 1): Promise<SourcePage<SourceAnimeSummary>> {
    if (sort === "latest") {
      try {
        const html = await this.http.getText(`/ultimos-animes/?p=${page}`, {
          cacheTtlMs: 120_000,
        });
        const embedded = parseJkanimeEmbeddedAnimes(html, this.ctx, page);
        if (embedded) return embedded;
      } catch {
        // "últimos animes" puede cambiar de ruta; seguimos con el directorio.
      }
    }

    const html = await this.http.getText(`/directorio/?p=${page}`, {
      cacheTtlMs: 120_000,
    });

    // JKAnime embebe el directorio como JSON (`var animes = {...}`).
    return (
      parseJkanimeEmbeddedAnimes(html, this.ctx, page) ??
      parseJkanimeCards(html, this.ctx, page)
    );
  }

  async getAnime(externalId: string): Promise<SourceAnimeDetails> {
    const slug = this.safeSlug(externalId);
    const html = await this.http.getText(`/${slug}/`, { cacheTtlMs: 300_000 });
    const anime = parseJkanimeAnime(html, slug, this.ctx);

    if (!anime.title || anime.title === slug) {
      throw new SourceParseError(
        this.id,
        "No se pudo extraer el título del anime (posible challenge o cambio de HTML)",
      );
    }

    return anime;
  }

  async getEpisodes(externalId: string): Promise<SourceEpisode[]> {
    const slug = this.safeSlug(externalId);
    const html = await this.http.getText(`/${slug}/`, { cacheTtlMs: 300_000 });
    const details = parseJkanimeAnime(html, slug, this.ctx);
    const internalId = parseJkanimeInternalId(html);
    const csrf = parseJkanimeCsrf(html);
    const totalFromPage = parseJkanimeEpisodeCount(html);

    const all = new Map<number, SourceEpisode>();

    if (internalId && csrf) {
      let total = totalFromPage;
      // Series largas: con 3 páginas ya tenemos total y miniaturas; el resto
      // se completa con el contador para no hacer 20+ peticiones.
      const pagesToFetch =
        total !== undefined && total > MAX_THUMBNAIL_PAGES * 16
          ? MAX_THUMBNAIL_PAGES
          : MAX_EPISODE_PAGES;

      for (let page = 1; page <= pagesToFetch; page += 1) {
        try {
          const payload = await this.http.postJson<unknown>(
            `/ajax/episodes/${internalId}/${page}`,
            { _token: csrf },
            { headers: { Referer: `${this.baseUrl}/${slug}/` } },
          );

          const parsed = parseJkanimeEpisodesJson(
            payload,
            slug,
            this.ctx,
            details.poster,
          );
          total = parsed.total ?? total;

          if (parsed.items.length === 0) break;

          const before = all.size;
          for (const episode of parsed.items) {
            if (!all.has(episode.number)) all.set(episode.number, episode);
          }

          if (total !== undefined && all.size >= total) break;
          if (all.size === before) break;
        } catch {
          // Si el AJAX falla (CSRF/rate limit), completamos con el contador.
          break;
        }
      }

      if (total !== undefined && total > 0) {
        for (let number = 1; number <= total; number += 1) {
          if (!all.has(number)) {
            all.set(number, {
              sourceId: this.id,
              externalId: String(number),
              number,
              title: `Episodio ${number}`,
              thumbnail: details.poster,
              url: `${this.baseUrl}/${slug}/${number}/`,
            });
          }
        }
      }
    }

    if (all.size === 0) {
      for (const episode of parseJkanimeEpisodes(html, slug, this.ctx)) {
        all.set(episode.number, episode);
      }
    }

    if (all.size === 0 && details.episodeCount) {
      for (let number = 1; number <= details.episodeCount; number += 1) {
        all.set(number, {
          sourceId: this.id,
          externalId: String(number),
          number,
          title: `Episodio ${number}`,
          thumbnail: details.poster,
          url: `${this.baseUrl}/${slug}/${number}/`,
        });
      }
    }

    return [...all.values()].sort((a, b) => a.number - b.number);
  }

  async getServers(
    animeExternalId: string,
    episodeExternalId: string,
  ): Promise<SourceServer[]> {
    const slug = this.safeSlug(animeExternalId);
    const number = this.safeEpisodeNumber(episodeExternalId);

    const html = await this.http.getText(`/${slug}/${number}/`, {
      cacheTtlMs: 120_000,
    });
    return parseJkanimeServers(html, this.ctx);
  }

  async healthCheck(): Promise<SourceHealth> {
    return measureHealth(this.id, async () => {
      await this.http.getText("/", { noCache: true, cacheTtlMs: 0 });
    });
  }

  private safeSlug(externalId: string): string {
    try {
      return normalizeJkanimeSlug(externalId);
    } catch {
      throw new SourceInvalidRequestError(this.id, "Identificador de anime inválido");
    }
  }

  private safeEpisodeNumber(externalId: string): number {
    try {
      return normalizeJkanimeEpisodeNumber(externalId);
    } catch {
      throw new SourceInvalidRequestError(this.id, "Número de episodio inválido");
    }
  }
}
