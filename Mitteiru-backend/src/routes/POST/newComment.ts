import type { NextFunction, Request, Response } from "express";
import Episode from "../../classes/episodes";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function newComment(req: Request, res: Response, next: NextFunction) {
  try {
    const { content, profileId } = req.body;
    const episodeId = req.params.episodeId;
    const user = currentUser(res);
    const profile = await requireOwnedProfile(profileId, user.sub);
    const newComment = await new Episode(episodeId).newComment(
      profileId,
      content,
      String(profile.name ?? user.username ?? "Usuario"),
      String(profile.photo ?? ""),
    );
    switch (newComment.message) {
      case "Comment added successfully":
        res.statusCode = 201;
        res.json(newComment);
        break;
      case "The episode does not exist":
        res.statusCode = 404;
        res.json(newComment);
        break;
      case "An error has occurred while adding the comment":
        res.statusCode = 500;
        res.json(newComment);
        break;
    }
  } catch (error) {
    next(error);
  }
}
