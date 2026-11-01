import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getLikes(req: Request, res: Response) {
  try {
    const animeId = req.params.animeId;
    const likes = await new Anime(animeId).getLikes();
    switch (likes.message) {
      case "Success":
        res.statusCode = 200;
        res.json(likes);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json(likes);
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
