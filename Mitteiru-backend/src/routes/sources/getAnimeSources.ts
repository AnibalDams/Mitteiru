import type { Request, Response } from "express";
import { getAnimeSourceMappings } from "../../sources/import";
import { sendSourceError } from "./helpers";

export default async function getAnimeSources(req: Request, res: Response) {
  try {
    const sources = await getAnimeSourceMappings(req.params.animeId);
    res.statusCode = 200;
    res.json({ message: "success", sources });
  } catch (error) {
    sendSourceError(res, error);
  }
}
