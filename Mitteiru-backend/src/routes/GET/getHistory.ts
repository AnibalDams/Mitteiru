import History from "../../classes/history";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function getHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const getH = await new History("", "", 0, 0, profileId).get();
    switch (getH.message) {
      case "Success":
        res.statusCode = 200;
        res.json(getH);
        break;
      case "An error has occurred while getting the History":
        res.statusCode = 500;
        res.json(getH);
    }
  } catch (error) {
    next(error);
  }
}
