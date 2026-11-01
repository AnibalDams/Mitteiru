import type { NextFunction, Response, Request } from "express";
import Episode from "../../classes/episodes";

export default async function getComments(req: Request, res: Response, next: NextFunction) {
  try {
    const episodeId = req.params.episodeId;
    const comments = await new Episode(episodeId).getComments();
    switch (comments.message) {
      case "success":
        res.statusCode = 200;
        res.json(comments);
        break;
      case "The episode does not exist":
        res.statusCode = 404;
        res.json(comments);
        break;
      case "An error has occurred while getting the comments":
        res.statusCode = 500;
        res.json(comments);
        break;
    }
  } catch (error) {
    next(error);
  }
}
