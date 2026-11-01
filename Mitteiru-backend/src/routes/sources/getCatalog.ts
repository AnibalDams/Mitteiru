import type { Request, Response } from "express";
import { getSource, sourceMetadata } from "../../sources/registry";
import { SourceNotSupportedError } from "../../sources/errors";
import { sendSourceError, parsePage } from "./helpers";
import type { SourceSort } from "../../sources/types";

export default async function getSourceCatalog(req: Request, res: Response) {
  try {
    const source = getSource(req.params.sourceId);
    if (!source.catalog) {
      throw new SourceNotSupportedError(source.id, "catálogo");
    }

    const sort: SourceSort = req.query.sort === "latest" ? "latest" : "popular";
    const page = parsePage(req.query.page);
    const result = await source.catalog(sort, page);

    res.statusCode = 200;
    res.json({
      message: "success",
      source: sourceMetadata(source),
      sort,
      page: result.page,
      hasNextPage: result.hasNextPage,
      items: result.items,
    });
  } catch (error) {
    sendSourceError(res, error);
  }
}
