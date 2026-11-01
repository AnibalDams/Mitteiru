import type { Request, Response } from "express";
import { getSource, sourceMetadata } from "../../sources/registry";
import { sendSourceError } from "./helpers";

export default async function getSourceAnime(req: Request, res: Response) {
  try {
    const source = getSource(req.params.sourceId);
    const anime = await source.getAnime(req.params.externalId);

    res.statusCode = 200;
    res.json({
      message: "success",
      source: sourceMetadata(source),
      anime,
    });
  } catch (error) {
    sendSourceError(res, error);
  }
}
