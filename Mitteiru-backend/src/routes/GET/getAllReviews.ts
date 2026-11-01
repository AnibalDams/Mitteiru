import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getReviews(req: Request, res: Response) {
  try {
    const animeId = req.params.animeId;
    const getAllReviews = await new Anime(animeId).getAllReviews();
    switch (getAllReviews.message) {
      case "Success":
        res.statusCode = 200;
        res.json(getAllReviews);
        break;
      case "There was an error while getting the reviews":
        res.statusCode = 500;
        res.json(getAllReviews);
        break;
      default:
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
