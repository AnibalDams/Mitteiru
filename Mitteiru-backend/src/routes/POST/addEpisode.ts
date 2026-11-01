import Episode from "../../classes/episodes";
import type { NextFunction, Response, Request } from "express";
import { assertAllowedPlaybackLink } from "../../libs/playbackPolicy";
 
export default async function addEpisode(req: Request, res: Response, next: NextFunction) {
  try {
    const animeId = req.params.animeId;
    const { name, episodeNumber, synopsis, thumbnail, link, profileId,isGlobal } = req.body;
    assertAllowedPlaybackLink(String(link ?? ""));
    const newEpisode = await new Episode(
      "",
      name,
      episodeNumber,
      thumbnail,
      synopsis,
      link,
      animeId,
      profileId,
      isGlobal
    ).new();

    switch (newEpisode.message) {
      case "The anime does not exist":
        res.statusCode = 404;
        res.json(newEpisode);
        break;
      case "The episode was added to the anime":
        res.statusCode = 201;
        res.json(newEpisode);
        break;
      case "An error has occurred while adding the episode":
        res.statusCode = 500;
        res.json(newEpisode);
        break;
    }
  } catch (error) {
    next(error);
  }
}
