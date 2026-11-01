import type { Response, Request } from "express";
import Episode from "../../classes/episodes";

export default async function (req: Request, res: Response) {
  try {
    const episodeId = req.params.episodeId;
    const commentLikes = await new Episode(episodeId).getLikesOfAComment();
    switch (commentLikes.message) {
      case "Success":
        res.statusCode = 200;
        res.json(commentLikes);
        break;
      case "An error has occurred while getting the likes":
        res.statusCode = 500;
        res.json(commentLikes);
        break;
      default:
        res.statusCode = 500;
        res.json({
          message: "There was an unknown error. Report it to the team",
        });
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
