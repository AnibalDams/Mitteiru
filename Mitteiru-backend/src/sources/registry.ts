/**
 * Registro de fuentes disponibles.
 *
 * Agregar una fuente nueva = crear su adaptador y sumarlo a `buildSources()`.
 * El resto de la aplicación (rutas, importación, UI) no necesita cambios.
 */

import type { SourceAdapter, SourceMetadata } from "./types";
import { SourceDisabledError, SourceNotFoundError } from "./errors";
import { isSourcesEnabled } from "../libs/features";
import { createSourceHttp } from "./http";
import { JkanimeSource } from "./adapters/jkanime";
import { AnimeOnsenSource } from "./adapters/animeonsen";

function createHttp(
  sourceId: string,
  baseUrl: string,
  allowedHosts?: string[],
) {
  return createSourceHttp({
    sourceId,
    baseUrl,
    allowedHosts,
  });
}

function buildSources(): SourceAdapter[] {
  const animeonsen = new AnimeOnsenSource(
    createHttp("animeonsen", "https://www.animeonsen.xyz", [
      "api.animeonsen.xyz",
      "search.animeonsen.xyz",
    ]),
  );

  const jkanime = new JkanimeSource(
    createHttp("jkanime", "https://jkanime.net"),
  );

  return [animeonsen, jkanime];
}

const sources = buildSources();
const byId = new Map(sources.map((source) => [source.id.toLowerCase(), source]));

export function listSources(): SourceAdapter[] {
  return [...sources];
}

export function getSource(sourceId: string): SourceAdapter {
  if (!isSourcesEnabled()) {
    throw new SourceDisabledError();
  }

  const source = byId.get(sourceId.trim().toLowerCase());
  if (!source) {
    throw new SourceNotFoundError(
      sourceId,
      `La fuente "${sourceId}" no está registrada`,
    );
  }
  return source;
}

export function hasSource(sourceId: string): boolean {
  if (!isSourcesEnabled()) return false;
  return byId.has(sourceId.trim().toLowerCase());
}

export function sourceMetadata(source: SourceAdapter): SourceMetadata {
  return {
    id: source.id,
    name: source.name,
    baseUrl: source.baseUrl,
    language: source.language,
    description: source.description,
    version: source.version,
    capabilities: [...source.capabilities],
  };
}
