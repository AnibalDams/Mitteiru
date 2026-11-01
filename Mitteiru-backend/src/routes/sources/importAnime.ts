import type { Request, Response } from "express";
import { getSource } from "../../sources/registry";
import { importFromSource } from "../../sources/import";
import { SourceInvalidRequestError } from "../../sources/errors";
import { sendSourceError, parseBoolean } from "./helpers";
import { audit } from "../../libs/logger";

export default async function importAnime(req: Request, res: Response) {
  try {
    const source = getSource(req.params.sourceId);
    const body: Record<string, unknown> =
      typeof req.body === "object" && req.body !== null
        ? (req.body as Record<string, unknown>)
        : {};

    const externalId =
      typeof body.externalId === "string" ? body.externalId.trim() : "";
    if (!externalId) {
      throw new SourceInvalidRequestError(
        source.id,
        "externalId es obligatorio para importar",
      );
    }

    const episodeNumbers = Array.isArray(body.episodeNumbers)
      ? body.episodeNumbers
          .map((value) => (typeof value === "number" ? value : Number(value)))
          .filter((value) => Number.isInteger(value) && value > 0)
      : undefined;

    if (episodeNumbers && episodeNumbers.length > 5000) {
      throw new SourceInvalidRequestError(
        source.id,
        "No se pueden importar más de 5000 episodios en una sola operación",
      );
    }

    const attachToAnimeId =
      typeof body.attachToAnimeId === "string" ? body.attachToAnimeId : undefined;

    const result = await importFromSource({
      sourceId: source.id,
      externalId,
      importEpisodes: body.importEpisodes === undefined
        ? true
        : parseBoolean(body.importEpisodes),
      episodeNumbers,
      attachToAnimeId,
    });

    audit("sources.import", {
      requestId: res.locals.requestId,
      sourceId: result.sourceId,
      animeId: result.animeId,
      created: result.createdAnime,
    });

    res.statusCode = result.createdAnime ? 201 : 200;
    res.json(result);
  } catch (error) {
    sendSourceError(res, error);
  }
}
