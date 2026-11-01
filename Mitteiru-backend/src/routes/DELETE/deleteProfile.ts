import Profile from "../../classes/profiles";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function defaultProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const deleteProfile = await new Profile(profileId).delete();
    switch (deleteProfile.message) {
      case "success":
        res.statusCode = 200;
        res.json(deleteProfile);
        break;
      case "An error has occurred while deleting the profile":
        res.statusCode = 500;
        res.json(deleteProfile);
    }
  } catch (error) {
    next(error);
  }
}
