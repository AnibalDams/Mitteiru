/**
 * Parsers puros de JKAnime. Reciben HTML y devuelven DTOs normalizados.
 */

import { load } from "cheerio";
import type {
  SourceAnimeDetails,
  SourceAnimeSummary,
  SourceEpisode,
  SourcePage,
  SourceServer,
} from "../types";
import {
  absoluteUrl,
  cleanText,
  extractLabel,
  extractJsonLd,
  firstAttr,
  firstText,
  jsonLdText,
  parseNumber,
  parseStatus,
  parseYear,
  sanitizeUrl,
  uniqueBy,
} from "../utils";

interface ParserContext {
  sourceId: string;
  baseUrl: string;
}

const RESERVED_SLUGS = new Set([
  "directorio",
  "buscar",
  "genero",
  "anime",
  "ultimos-animes",
  "ultimos-episodios",
  "horario",
  "contacto",
  "dmca",
  "acerca-de",
  "login",
  "registro",
  "perfil",
  "mi-lista",
  "noticias",
  "aviso-de-privacidad",
  "terminos",
  "rss",
  "sitemap",
  "assets",
  "static",
  "js",
  "css",
  "img",
  "images",
  "ajax",
  "notificaciones",
  "guardado",
  "historial",
  "cuenta",
  "mi-cuenta",
  "configuracion",
  "favoritos",
  "pendientes",
  "viendo",
  "finalizados",
  "ver-todos",
  "ver-mas",
  "top",
  "top-anime",
  "estrenos",
  "peliculas",
  "ovas",
  "especiales",
  "donghua",
  "latino",
  "castellano",
  "subtitulado",
  "cerrar-sesion",
  "iniciar-sesion",
  "registrarse",
]);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/i;

const AD_HOST_FRAGMENTS = [
  "google",
  "googletagmanager",
  "doubleclick",
  "disqus",
  "facebook",
  "twitter",
  "instagram",
  "gstatic",
  "cloudflareinsights",
];

export function normalizeJkanimeSlug(input: string): string {
  const value = input.trim();
  const fromUrl = value.match(/^https?:\/\/[^/]+\/([^/?#]+)/i);
  const candidate = (fromUrl?.[1] ?? value).replace(/^\/+|\/+$/g, "");
  if (!SLUG_PATTERN.test(candidate) || RESERVED_SLUGS.has(candidate.toLowerCase())) {
    throw new Error(`Slug inválido de JKAnime: ${input}`);
  }
  return candidate;
}

export function normalizeJkanimeEpisodeNumber(input: string): number {
  const value = input.trim();
  const fromUrl = value.match(/\/(\d+)(?:\/)?(?:[?#]|$)/);
  const parsed = parseNumber(fromUrl?.[1] ?? value);
  if (parsed === undefined || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Número de episodio inválido de JKAnime: ${input}`);
  }
  return parsed;
}

function slugFromHref(href: string | undefined, baseUrl: string): string | undefined {
  const url = absoluteUrl(baseUrl, href);
  if (!url) return undefined;
  const path = new URL(url).pathname;
  const match = path.match(/^\/([a-z0-9][a-z0-9-]*)\/?$/i);
  if (!match) return undefined;
  const slug = match[1];
  if (RESERVED_SLUGS.has(slug.toLowerCase())) return undefined;
  return slug;
}

function isAdUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return AD_HOST_FRAGMENTS.some((fragment) => host.includes(fragment));
  } catch {
    return true;
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return parseNumber(value);
  return undefined;
}

/**
 * Extrae el primer objeto JS/JSON que sigue a un marcador (`var animes = {...}`)
 * usando un contador de llaves que respeta strings.
 */
function extractJsObject(html: string, marker: RegExp): unknown | undefined {
  const match = marker.exec(html);
  if (!match) return undefined;

  const start = html.indexOf("{", match.index);
  if (start < 0) return undefined;

  let depth = 0;
  let inString = false;
  let quote = "";
  let escaped = false;

  for (let index = start; index < html.length; index += 1) {
    const char = html[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        inString = false;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = true;
      quote = char;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, index + 1));
        } catch {
          return undefined;
        }
      }
    }
  }

  return undefined;
}

/** JKAnime embebe el directorio como `var animes = {...}`. */
export function parseJkanimeEmbeddedAnimes(
  html: string,
  ctx: ParserContext,
  page = 1,
): SourcePage<SourceAnimeSummary> | undefined {
  const payload = asRecord(extractJsObject(html, /var\s+animes\s*=/));
  if (!payload) return undefined;

  const data = Array.isArray(payload.data) ? payload.data : [];
  const items: SourceAnimeSummary[] = [];

  for (const raw of data) {
    const record = asRecord(raw);
    if (!record) continue;

    const slug = asString(record.slug);
    if (!slug || !SLUG_PATTERN.test(slug) || RESERVED_SLUGS.has(slug.toLowerCase())) {
      continue;
    }

    const title = cleanText(asString(record.title) ?? asString(record.short_title));
    if (!title) continue;

    const image = asString(record.image);
    const url = asString(record.url) ?? `${ctx.baseUrl}/${slug}/`;

    items.push({
      sourceId: ctx.sourceId,
      externalId: slug,
      title,
      poster: sanitizeUrl(image ? absoluteUrl(ctx.baseUrl, image) : undefined),
      synopsis: cleanText(asString(record.synopsis)) || undefined,
      type: asString(record.tipo) ?? asString(record.type),
      status: parseStatus(asString(record.status) ?? asString(record.estado)),
      url,
    });
  }

  if (items.length === 0) return undefined;

  const currentPage = asNumber(payload.current_page) ?? page;
  const perPage = asNumber(payload.per_page) ?? items.length;
  const total = asNumber(payload.total);
  const hasNextPage =
    Boolean(asString(payload.next_page_url)) ||
    (total !== undefined && currentPage * perPage < total);

  return {
    items: uniqueBy(items, (item) => item.externalId),
    page: currentPage,
    hasNextPage,
  };
}

export function parseJkanimeInternalId(html: string): string | undefined {
  const $ = load(html);
  const fromData =
    $("#guardar-anime[data-anime]").attr("data-anime") ??
    $("[data-anime]").first().attr("data-anime");
  if (fromData && /^\d+$/.test(fromData.trim())) return fromData.trim();

  const match = html.match(/ajax\/(?:episodes|personajes|search_episode)\/(\d+)/);
  return match?.[1];
}

export function parseJkanimeCsrf(html: string): string | undefined {
  const $ = load(html);
  return $('meta[name="csrf-token"]').attr("content")?.trim() || undefined;
}

export function parseJkanimeEpisodeCount(html: string): number | undefined {
  const $ = load(html);
  const text = cleanText($(".anime_data").text()) || cleanText($("body").text());
  const match = text.match(/Episodios?\s*:\s*(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

/** Parsea la respuesta JSON de `POST /ajax/episodes/{id}/{page}`. */
export function parseJkanimeEpisodesJson(
  payload: unknown,
  slug: string,
  ctx: ParserContext,
  poster?: string,
): { items: SourceEpisode[]; total?: number } {
  const root = asRecord(payload);
  const data = Array.isArray(root?.data) ? root.data : [];
  const items: SourceEpisode[] = [];

  for (const raw of data) {
    const record = asRecord(raw);
    if (!record) continue;

    const number = asNumber(record.number);
    if (number === undefined || !Number.isInteger(number) || number <= 0) continue;

    const rawImage = asString(record.image);
    let thumbnail = poster;
    if (rawImage && rawImage.length > 10) {
      thumbnail = rawImage.startsWith("http")
        ? rawImage
        : `https://cdn.jkdesa.com/assets/images/animes/video/image_thumb/${rawImage.replace(/^\/+/, "")}`;
    }

    items.push({
      sourceId: ctx.sourceId,
      externalId: String(number),
      number,
      title: `Episodio ${number}`,
      thumbnail: sanitizeUrl(thumbnail),
      url: `${ctx.baseUrl}/${slug}/${number}/`,
    });
  }

  return {
    items: uniqueBy(items, (item) => item.externalId).sort((a, b) => a.number - b.number),
    total: asNumber(root?.total),
  };
}

/** Parsea tarjetas de anime del directorio, búsqueda o últimos animes. */
export function parseJkanimeCards(
  html: string,
  ctx: ParserContext,
  page = 1,
): SourcePage<SourceAnimeSummary> {
  const $ = load(html);
  const items: SourceAnimeSummary[] = [];

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const slug = slugFromHref(href, ctx.baseUrl);
    if (!slug) return;

    const container = $(element).closest(
      ".anime__item, article, .card, .anime__item__pic, li",
    );
    const scoped = container.length ? container : $(element);

    // Solo tarjetas reales: deben tener portada (img o data-setbg).
    const hasMedia =
      $(element).is("[data-setbg]") ||
      $(element).find("img, [data-setbg]").length > 0 ||
      scoped.find("img, [data-setbg]").length > 0;
    if (!hasMedia) return;

    const title =
      cleanText($(element).find("h5,h4,h3,.title").first().text()) ||
      cleanText(scoped.find("h5,h4,h3,.anime__item__text h5,.title").first().text()) ||
      cleanText($(element).attr("title")) ||
      cleanText($(element).find("img").attr("alt")) ||
      cleanText($(element).text());

    if (!title) return;

    const pic = $(element).find(".anime__item__pic, .set-bg").first();
    const poster =
      pic.attr("data-setbg") ??
      scoped.find(".anime__item__pic").attr("data-setbg") ??
      $(element).find("img").attr("src") ??
      $(element).find("img").attr("data-src") ??
      scoped.find("img").attr("src") ??
      scoped.find("img").attr("data-src");

    const containerText = cleanText(scoped.text());

    items.push({
      sourceId: ctx.sourceId,
      externalId: slug,
      title,
      poster: sanitizeUrl(poster ? absoluteUrl(ctx.baseUrl, poster) : undefined),
      year: parseYear(containerText),
      type: cleanText(scoped.find("ul li").first().text()) || undefined,
      status: "unknown",
      url: `${ctx.baseUrl}/${slug}/`,
    });
  });

  const hasNextPage =
    new RegExp(`[?&]p=${page + 1}(?:[&"']|$)`).test(html) ||
    $(".pagination a").length > 0;

  return {
    items: uniqueBy(items, (item) => item.externalId),
    page,
    hasNextPage,
  };
}

/** Extrae los números de episodio de la ficha del anime. */
export function parseJkanimeEpisodeNumbers(html: string, slug: string): number[] {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const numbers = new Set<number>();

  const pathRegex = new RegExp(`/${escaped}/(\\d+)(?:/|["'?#\\s])`, "gi");
  for (const match of html.matchAll(pathRegex)) {
    const value = Number(match[1]);
    if (Number.isInteger(value) && value > 0 && value < 100_000) numbers.add(value);
  }

  const dataRegex = /data-(?:episode|episodio)=["'](\d+)["']/gi;
  for (const match of html.matchAll(dataRegex)) {
    const value = Number(match[1]);
    if (Number.isInteger(value) && value > 0) numbers.add(value);
  }

  if (numbers.size === 0) {
    const jsonRegex = /"(?:number|episode_number|episodio)"\s*:\s*(\d+)/gi;
    for (const match of html.matchAll(jsonRegex)) {
      const value = Number(match[1]);
      if (Number.isInteger(value) && value > 0) numbers.add(value);
    }
  }

  return [...numbers].sort((a, b) => a - b);
}

export function parseJkanimeEpisodes(
  html: string,
  slug: string,
  ctx: ParserContext,
): SourceEpisode[] {
  return parseJkanimeEpisodeNumbers(html, slug).map((number) => ({
    sourceId: ctx.sourceId,
    externalId: String(number),
    number,
    title: `Episodio ${number}`,
    url: `${ctx.baseUrl}/${slug}/${number}/`,
  }));
}

/** Limpia el sufijo promocional que JKAnime añade al <title>. */
function cleanJkanimeTitle(value: string): string {
  return value
    .replace(/\s*-\s*anime\s+.*?\s+online\s+JkAnime\s*$/i, "")
    .replace(/\s*[-|]\s*JkAnime\s*$/i, "")
    .replace(/\s*\|\s*JkAnime\s*$/i, "")
    .trim();
}

/** Parsea la ficha `/{slug}/`. */
export function parseJkanimeAnime(
  html: string,
  slug: string,
  ctx: ParserContext,
): SourceAnimeDetails {
  const $ = load(html);
  const jsonLd = extractJsonLd($);

  const rawTitle =
    firstText($, [
      ".anime__details__content h3",
      ".anime__details__title h3",
      "h1.title",
      ".anime__details__title",
      "h1",
      "h3",
    ]) ||
    jsonLdText(jsonLd?.name) ||
    cleanText($('meta[property="og:title"]').attr("content"));

  const title = cleanJkanimeTitle(rawTitle);

  const altTitle =
    cleanText($(".anime__details__title span").first().text()) ||
    jsonLdText(jsonLd?.alternateName) ||
    undefined;

  const poster =
    firstAttr(
      $,
      [
        ".anime_pic img",
        ".mov img",
        ".anime__details__pic img",
        'meta[property="og:image"]',
      ],
      "src",
    ) ??
    $(".anime__details__pic[data-setbg]").attr("data-setbg") ??
    $('meta[property="og:image"]').attr("content");

  const synopsis =
    firstText($, [
      ".anime__details__content p.scroll",
      "p.scroll",
      ".anime__details__text p",
      ".anime__details__text",
      ".sinopsis",
      '[itemprop="description"]',
    ]) ||
    jsonLdText(jsonLd?.description) ||
    cleanText($('meta[name="description"]').attr("content"));

  const infoParagraphs = $(
    ".anime_data li, .anime__details__text p, .anime__details__text li",
  )
    .map((_, element) => cleanText($(element).text()))
    .get()
    .filter(Boolean);
  const infoText = infoParagraphs.length
    ? infoParagraphs.join(" | ")
    : cleanText($(".anime__details__text").text()) || cleanText($("body").text());

  const genres = uniqueBy(
    $('a[href*="/genero/"], a[href*="/genre/"]')
      .map((_, element) => cleanText($(element).text()))
      .get()
      .filter(Boolean),
    (genre) => genre.toLowerCase(),
  );

  const yearText =
    extractLabel(infoText, ["Temporada", "Año", "Year", "Estreno"]) ??
    jsonLdText(jsonLd?.datePublished) ??
    "";

  const episodeCount =
    parseNumber(extractLabel(infoText, ["Episodios", "Episodes"])) ??
    parseJkanimeEpisodeNumbers(html, slug).length;

  const statusText =
    extractLabel(infoText, ["Estado", "Status"]) ?? infoText;

  return {
    sourceId: ctx.sourceId,
    externalId: slug,
    title: title || slug,
    altTitle: altTitle || undefined,
    poster: sanitizeUrl(poster ? absoluteUrl(ctx.baseUrl, poster) : undefined),
    synopsis: synopsis || undefined,
    year: parseYear(yearText),
    type: extractLabel(infoText, ["Tipo", "Type"]),
    status: parseStatus(statusText),
    episodeCount: episodeCount || undefined,
    genres,
    studio: extractLabel(infoText, ["Studios", "Estudio", "Studio"]),
    url: `${ctx.baseUrl}/${slug}/`,
  };
}

function serverNameFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Servidor";
  }
}

function serverKind(url: string): SourceServer["kind"] {
  const path = url.split("?")[0]?.toLowerCase() ?? "";
  if (path.endsWith(".m3u8")) return "hls";
  if (path.endsWith(".mp4")) return "mp4";
  return "embed";
}

/** Parsea los servidores/embeds del episodio `/{slug}/{n}/`. */
export function parseJkanimeServers(html: string, ctx: ParserContext): SourceServer[] {
  const $ = load(html);
  const servers: SourceServer[] = [];

  const push = (rawUrl: string | undefined, name?: string, download = false) => {
    const url = sanitizeUrl(rawUrl ? absoluteUrl(ctx.baseUrl, rawUrl) : undefined);
    if (!url || isAdUrl(url)) return;
    // Descarta plantillas JS sin resolver: "...?u='+val.remote+'", "...?u="
    if (/[{}]|'\+|\+val\.|\$\{/.test(url)) return;
    if (/[?&][a-z0-9_]+=$/i.test(url)) return;
    servers.push({
      id: `server-${servers.length}`,
      name: name?.trim() || serverNameFromUrl(url),
      url,
      kind: serverKind(url),
      download,
    });
  };

  // Nombres de servidores declarados en la UI: <a class="servers" data-id="0">Desu</a>
  const serverNames = new Map<string, string>();
  $(".servers[data-id]").each((_, element) => {
    const id = $(element).attr("data-id");
    const name = cleanText($(element).text());
    if (id && name) serverNames.set(id, name);
  });

  // La página inyecta los reproductores en variables JS:
  //   video[0] = '<iframe src="https://jkanime.net/jkplayer/um?e=..."></iframe>';
  const videoRegex = /video\[(\d+)\]\s*=\s*'([\s\S]*?)'\s*(?:;|\n)/g;
  for (const match of html.matchAll(videoRegex)) {
    const index = match[1];
    const iframeHtml = match[2];
    const srcMatch = iframeHtml.match(/src=["']([^"']+)["']/i);
    if (srcMatch) push(srcMatch[1], serverNames.get(index));
  }

  $("iframe[src]").each((_, element) => {
    push($(element).attr("src"), $(element).attr("title") || undefined);
  });

  $("a[data-url], a[data-server], .servers a, #servers a, .server-list a").each(
    (_, element) => {
      const dataUrl = $(element).attr("data-url");
      const dataServer = $(element).attr("data-server");
      const href = $(element).attr("href");
      const name = cleanText($(element).text()) || dataServer;

      if (dataUrl && /^https?:\/\//i.test(dataUrl)) {
        push(dataUrl, name);
        return;
      }
      if (href && /^https?:\/\//i.test(href)) {
        push(href, name);
        return;
      }
      if (dataServer && /^https?:\/\//i.test(dataServer)) {
        push(dataServer, name);
        return;
      }
      const onclick = $(element).attr("onclick");
      const fromOnclick = onclick?.match(/https?:\/\/[^"'\s)]+/);
      if (fromOnclick) push(fromOnclick[0], name);
    },
  );

  const umRegex = /(?:https?:\/\/[^"'\s<>]+)?\/?um\.php\?e=[A-Za-z0-9+/=_%.-]+/gi;
  for (const match of html.matchAll(umRegex)) {
    push(match[0], "JKAnime");
  }

  const jkPlayerRegex = /https?:\/\/[^"'\s<>]*\/jkplayer\/[A-Za-z0-9]+[^"'\s<>]*/gi;
  for (const match of html.matchAll(jkPlayerRegex)) {
    push(match[0], undefined);
  }

  const directRegex = /https?:\/\/[^"'\s<>]+\.(?:m3u8|mp4)(?:\?[^"'\s<>]*)?/gi;
  for (const match of html.matchAll(directRegex)) {
    push(match[0], undefined, true);
  }

  return uniqueBy(servers, (server) => server.url).map((server, index) => ({
    ...server,
    id: `server-${index}-${server.kind}`,
  }));
}
