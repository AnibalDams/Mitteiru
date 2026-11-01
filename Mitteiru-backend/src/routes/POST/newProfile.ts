import Profile from "../../classes/profiles";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireSameUser } from "../../libs/ownership";

export default async function newProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.params.userId;
    const { name, photo } = req.body;
    const user = currentUser(res);
    requireSameUser(userId, user.sub);
    const newProfile = await new Profile("", name, photo, userId).new();

    switch (newProfile.message) {
      case "User not found":
        res.statusCode = 404;
        res.json(newProfile);
        break;
      case "success":
        res.statusCode = 201;
        res.json(newProfile);
        break;
      case "An error has occurred while creating profile":
        res.statusCode = 500;
        res.json(newProfile);
    }
  } catch (error) {
    next(error);
  }
}
