import type { Request, Response } from "express";
import Episode from "../../classes/episodes";

export default async function deleteEpisode(req: Request, res: Response) {
  try {
    const { episodeId } = req.params;

    const deleteE = await Episode.delete(episodeId);

    switch (deleteE.message) {
      case "The episode does not exist":
        res.statusCode = 404;
        res.json(deleteE);
        break;
      case "The episode was deleted successfully":
        res.statusCode = 200;
        res.json(deleteE);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json(deleteE);
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "there was an error", error: error.message });
  }
}
