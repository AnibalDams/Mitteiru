import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getAnimeOfAyear(req: Request, res: Response) {
  try {
    const year = req.params.year;
    const animes = await new Anime("", "", "", "", year).getAnimesOfAYear();
    switch (animes.message) {
      case "Success":
        res.statusCode = 200;
        res.json(animes);
        break;
      case "An error has occurred while getting the animes":
        res.statusCode = 500;
        res.json(animes);
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
