import History from "../../classes/history";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function addToHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const animeId = req.params.animeId;
    const episodeNumber = Number(req.params.episodeNumber);
    const profileId = req.params.profileId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const history = await new History(
      "",
      animeId,
      episodeNumber,
      0,
      profileId,
    ).add();
    switch (history.message) {
      case "Success":
        res.statusCode = 201;
        res.json(history);
        break;
      case "An error has occurred while adding the History":
        res.statusCode = 500;
        res.json(history);
        break;
    }
  } catch (error) {
    next(error);
  }
}
