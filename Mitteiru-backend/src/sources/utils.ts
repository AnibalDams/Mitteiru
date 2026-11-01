/**
 * Utilidades compartidas por los adaptadores: limpieza de texto, URLs seguras,
 * parseo de años/estados y extracción de datos estructurados.
 */

import type { CheerioAPI } from "cheerio";
import type { SourceStatus } from "./types";

const ENTITY_MAP: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
  "&nbsp;": " ",
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&(amp|quot|#39|apos|lt|gt|nbsp);/g, (match) => ENTITY_MAP[match] ?? match)
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}

export function cleanText(input: string | undefined | null): string {
  if (!input) return "";
  return decodeEntities(input)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Solo acepta http/https; evita `javascript:`, `data:` y similares. */
export function sanitizeUrl(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const value = decodeEntities(input).trim();
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function absoluteUrl(baseUrl: string, href: string | undefined | null): string | undefined {
  if (!href) return undefined;
  const raw = decodeEntities(href).trim();
  if (!raw || raw.startsWith("#") || raw.startsWith("javascript:")) return undefined;
  try {
    const url = new URL(raw, baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

export function parseYear(input: string | undefined | null): string | undefined {
  if (!input) return undefined;
  const match = input.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : undefined;
}

export function parseStatus(input: string | undefined | null): SourceStatus {
  if (!input) return "unknown";
  const text = input.toLowerCase();
  // "Finished Airing" contiene "airing": evaluamos primero los estados finales.
  if (/(finished|finalizado|completed|concluido|terminado)/.test(text)) {
    return "finished";
  }
  if (/(currently airing|en emisión|en emision|airing|emitiéndose|emitiendose|en curso)/.test(text)) {
    return "ongoing";
  }
  return "unknown";
}

export function parseNumber(input: string | undefined | null): number | undefined {
  if (!input) return undefined;
  const match = input.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return undefined;
  const value = Number(match[0]);
  return Number.isFinite(value) ? value : undefined;
}

export function uniqueBy<T>(items: T[], keyOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    const key = keyOf(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

/** Extrae el valor de una etiqueta tipo "Studio: MAPPA" dentro del texto. */
export function extractLabel(text: string, labels: string[]): string | undefined {
  const boundaries =
    "Studio|Studios|Status|Aired|Episodes|Type|Season|Year|Genres?|Duration|Rating|Score|" +
    "Japanese|English|Premiered|Producers|Licensors|Source|Tipo|Estudio|Año|Estado|" +
    "Géneros|Generos|Episodios|Duración|Duracion|Director|Reparto|Sinopsis";

  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `${escaped}\\s*:\\s*([^|\\n]+?)(?=\\s+(?:${boundaries})\\s*:|\\s*\\||$)`,
      "i",
    );
    const match = text.match(regex);
    if (match?.[1]) {
      const value = cleanText(match[1]).split(/\s{2,}/)[0];
      if (value) return value;
    }
  }
  return undefined;
}

/** Primer texto no vacío de una lista de selectores. */
export function firstText($: CheerioAPI, selectors: string[]): string {
  for (const selector of selectors) {
    const value = cleanText($(selector).first().text());
    if (value) return value;
  }
  return "";
}

/** Primer atributo no vacío de una lista de selectores. */
export function firstAttr(
  $: CheerioAPI,
  selectors: string[],
  attribute: string,
): string | undefined {
  for (const selector of selectors) {
    const value = $(selector).first().attr(attribute);
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}

/** Extrae metadatos `application/ld+json` y los devuelve como objeto plano. */
export function extractJsonLd($: CheerioAPI): Record<string, unknown> | undefined {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i += 1) {
    const raw = scripts.eq(i).text().trim();
    if (!raw) continue;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const anime = parsed.find(
          (item): item is Record<string, unknown> =>
            typeof item === "object" &&
            item !== null &&
            (item as Record<string, unknown>)["@type"] === "TVSeries",
        );
        if (anime) return anime;
      } else if (typeof parsed === "object" && parsed !== null) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // Un JSON-LD inválido no debe romper el scraping.
    }
  }
  return undefined;
}

export function jsonLdText(value: unknown): string | undefined {
  if (typeof value === "string") return cleanText(value) || undefined;
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => (typeof item === "string" ? item : undefined))
      .filter((item): item is string => Boolean(item));
    return parts.length ? parts.join(", ") : undefined;
  }
  return undefined;
}

/** Convierte un slug en texto legible: "one-piece" → "One Piece". */
export function slugToTitle(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

export function normalizeTitle(input: string): string {
  return cleanText(input)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
