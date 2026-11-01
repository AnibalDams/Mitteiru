import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getAnimes(req: Request, res: Response) {
  try {
    const getAllAnimes = await Anime.getAll();

    switch (getAllAnimes.message) {
      case "animes found":
        res.statusCode = 200;
        res.json(getAllAnimes);
        break;
      case "An error has occurred while getting animes":
        res.statusCode = 500;
        res.json(getAllAnimes);
        break;
      default:
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
