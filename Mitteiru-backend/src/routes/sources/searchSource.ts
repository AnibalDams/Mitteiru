import type { Request, Response } from "express";
import { getSource, sourceMetadata } from "../../sources/registry";
import { SourceInvalidRequestError } from "../../sources/errors";
import { sendSourceError, parsePage } from "./helpers";

export default async function searchSource(req: Request, res: Response) {
  try {
    const source = getSource(req.params.sourceId);
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

    if (!query) {
      throw new SourceInvalidRequestError(
        source.id,
        "El parámetro q es obligatorio",
      );
    }
    if (query.length > 120) {
      throw new SourceInvalidRequestError(
        source.id,
        "La búsqueda no puede superar 120 caracteres",
      );
    }

    const page = parsePage(req.query.page);
    const result = await source.search(query, page);

    res.statusCode = 200;
    res.json({
      message: "success",
      source: sourceMetadata(source),
      query,
      page: result.page,
      hasNextPage: result.hasNextPage,
      items: result.items,
    });
  } catch (error) {
    sendSourceError(res, error);
  }
}
