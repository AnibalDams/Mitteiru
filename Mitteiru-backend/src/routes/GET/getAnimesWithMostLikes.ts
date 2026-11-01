import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getMostLikedAnimes(req: Request, res: Response) {
  try {
    const mostLikedAnimes = await new Anime().getMostLiked();
    switch (mostLikedAnimes.message) {
      case "success":
        res.statusCode = 200;
        res.json(mostLikedAnimes);
        break;
      case "An error has occurred while getting the animes":
        res.statusCode = 500;
        res.json(mostLikedAnimes);
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
