import List from "../../classes/lists";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function newList(req: Request, res: Response, next: NextFunction) {
  try {
    const profileId = req.params.profileId;
    const { name } = req.body;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);
    const newList = await new List("", name, profileId).new();
    switch (newList.message) {
      case "profile not found":
        res.statusCode = 404;
        res.json(newList);
        break;
      case "Success":
        res.statusCode = 201;
        res.json(newList);
        break;
      case "An error occurred":
        res.statusCode = 500;
        res.json(newList);
        break;
    }
  } catch (error) {
    next(error);
  }
}
