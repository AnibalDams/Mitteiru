import { Anime } from "../../classes/animes";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function addLikeToAnime(req: Request, res: Response, next: NextFunction) {
  try {
    const animeId = req.params.animeId;
    const profileId = req.params.profileId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const addLike = await new Anime(animeId).addLike(profileId);
    switch (addLike.message) {
      case "success 1":
        res.statusCode = 200;
        res.json(addLike);
        break;
      case "success 2":
        res.statusCode = 201;
        res.json(addLike);
        break;
      case "An error has occurred while adding the like":
        res.statusCode = 500;
        res.json(addLike);
        break;
    }
  } catch (error) {
    next(error);
  }
}
