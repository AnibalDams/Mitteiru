import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getSimilarAnimes(req: Request, res: Response) {
  try {
    const animeId = req.params.animeId;
    const animes = await new Anime(animeId).getSimilar();
    switch (animes.message) {
      case "no anime found":
        res.statusCode = 404;
        res.json(animes);
        break;
      case "success":
        res.statusCode = 200;
        res.json(animes);
        break;
      case "An error has occurred while getting the similar Animes":
        res.statusCode = 500;
        res.json(animes);
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "there was an error", error: error.message });
  }
}
