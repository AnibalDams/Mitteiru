import Profile from "../../classes/profiles";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId;
    const { name, photo } = req.body;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const update = await new Profile(profileId, name, photo, "").update();
    switch (update.message) {
      case "success":
        res.statusCode = 200;
        res.json(update);
        break;
      case "An error has occurred while updating the profile":
        res.statusCode = 500;
        res.json(update);
    }
  } catch (error) {
    next(error);
  }
}
