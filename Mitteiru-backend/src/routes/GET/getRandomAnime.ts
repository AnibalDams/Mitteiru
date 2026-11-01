import type { Request, Response } from "express";
import { Anime } from "../../classes/animes";

export default async function getRandomAnime(req: Request, res: Response) {
  try {
    const ramdonAnime = await Anime.getRandomAnime();
    switch (ramdonAnime.message) {
      case "success":
        res.statusCode = 200;
        res.json(ramdonAnime);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json(ramdonAnime);
        break;
    }
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "There was an error", error: error.message });
  }
}
