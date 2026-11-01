import List from "../../classes/lists";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function getLists(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const allLists = await new List("", "", profileId).getAll();
    switch (allLists.message) {
      case "Profile not found":
        res.statusCode = 404;
        res.json(allLists);
        break;
      case "Success":
        res.statusCode = 200;
        res.json(allLists);
        break;
      case "An error occurred":
        res.statusCode = 500;
        res.json(allLists);
    }
  } catch (error) {
    next(error);
  }
}
