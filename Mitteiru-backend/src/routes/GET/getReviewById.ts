import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getReviewById(req: Request, res: Response) {
  try {
    const animeId = req.params.animeId;
    const reviewId = req.params.reviewId;
    const getReview = await new Anime(animeId).getReviewById(reviewId);
    switch (getReview.message) {
      case "Success":
        res.statusCode = 200;
        res.json(getReview);
        break;
      case "Review not found":
        res.statusCode = 404;
        res.json(getReview);
        break;
      case "There was an error while getting the review":
        res.statusCode = 500;
        res.json(getReview);
        break;
      default:
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
