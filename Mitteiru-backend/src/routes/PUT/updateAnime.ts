import type { NextFunction, Request, Response } from "express";
import type { Anime_ as Ianime } from "../../libs/types/Anime";
import { Anime } from "../../classes/animes";

export default async function updateAnime(req: Request, res: Response, next: NextFunction) {
  try {
    const { animeId } = req.params;
    const data: Ianime = req.body;
    const update = await Anime.update(animeId, data);

    switch (update.message) {
      case "success":
        res.statusCode = 200;
        res.json(update);
        break;
      case "Anime not found":
        res.statusCode = 404;
        res.json(update);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json(update);
        break;
    }
  } catch (error) {
    next(error);
  }
}
