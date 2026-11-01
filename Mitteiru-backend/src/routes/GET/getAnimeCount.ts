import type { Request, Response } from "express";
import { Anime } from "../../classes/animes";

export default async function getAnimesCount(req: Request, res: Response) {
  try {
    const animes = await Anime.count();
    switch (animes.message) {
      case "success":
        res.statusCode = 200;
        res.json(animes);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json(animes);
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
