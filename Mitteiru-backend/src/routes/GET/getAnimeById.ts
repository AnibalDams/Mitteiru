import { Anime } from "../../classes/animes";
import type { NextFunction, Response, Request } from "express";

export default async function getByAnimeById(req: Request, res: Response, next: NextFunction) {
  try {
    const animeId = req.params.animeId;
    const anime = new Anime(animeId);
    const getByAnimeById = await anime.getById(true);
    switch (getByAnimeById.message) {
      case "anime found":
        res.statusCode = 200;
        res.json(getByAnimeById);
        break;
      case "An error has occurred while getting the animes":
        res.statusCode = 500;
        res.json(getByAnimeById);
        break;

      default:
        break;
    }
  } catch (error) {
    next(error);
  }
}
