import AnimesInList from "../../classes/animesInList";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function getAnimesInList(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const animes = await new AnimesInList("", "", "", profileId).getAll();
    switch (animes.message) {
      case "success":
        res.statusCode = 200;
        res.json(animes);
        break;
      case "An error occurred":
        res.statusCode = 500;
        res.json(animes);
    }
  } catch (error) {
    next(error);
  }
}
