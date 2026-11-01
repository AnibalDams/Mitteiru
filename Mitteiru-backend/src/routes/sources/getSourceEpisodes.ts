import type { Request, Response } from "express";
import { getSource } from "../../sources/registry";
import { sendSourceError } from "./helpers";

export default async function getSourceEpisodes(req: Request, res: Response) {
  try {
    const source = getSource(req.params.sourceId);
    const episodes = await source.getEpisodes(req.params.externalId);

    res.statusCode = 200;
    res.json({ message: "success", episodes });
  } catch (error) {
    sendSourceError(res, error);
  }
}
