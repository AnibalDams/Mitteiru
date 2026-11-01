import Profile from "../../classes/profiles";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireSameUser } from "../../libs/ownership";

export default async function getAllProfiles(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId;
    const user = currentUser(res);
    requireSameUser(userId, user.sub);
    const allProfiles = await new Profile("", "", "", userId).getAll();
    switch (allProfiles.message) {
      case "User not found":
        res.statusCode = 404;
        res.json(allProfiles);
        break;
      case "success":
        res.statusCode = 200;
        res.json(allProfiles);
        break;
      case "An error has occurred while getting all profiles":
        res.statusCode = 500;
        res.json(allProfiles);
        break;
    }
  } catch (error) {
    next(error);
  }
}
