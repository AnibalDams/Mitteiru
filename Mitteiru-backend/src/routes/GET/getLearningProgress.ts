import type { NextFunction, Request, Response } from "express";
import LearningProgress from "../../classes/LearnginProgress";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function getLearningProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const profileId = req.params.profileId;
    const animeId = req.params.animeId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);

    const learningProgress = await LearningProgress.get(profileId, animeId);

    if (learningProgress.message === "An error has occurred") {
      res.status(500).json({ message: "No se pudo obtener el progreso" });
      return;
    }

    res.status(200).json(learningProgress);
  } catch (error) {
    next(error);
  }
}
