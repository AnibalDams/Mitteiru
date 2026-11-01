import type { NextFunction, Request, Response } from "express";
import type IlearningProgress from "../../classes/interfaces/LearningProgress";
import LearningProgress from "../../classes/LearnginProgress";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function addLearningProgress(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const profileId = req.params.profileId;
    const animeId = req.params.animeId;
    const user = currentUser(res);
    await requireOwnedProfile(profileId, user.sub);

    const data = {
      ...(req.body as Omit<IlearningProgress, "profileId" | "animeId">),
      profileId,
      animeId,
    } as IlearningProgress;

    const newLearningProgress = await new LearningProgress(data).new();

    switch (newLearningProgress.message) {
      case "Learning progress already exists":
        res.statusCode = 200;
        res.json(newLearningProgress);
        break;
      case "success":
        res.statusCode = 201;
        res.json(newLearningProgress);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json({ message: "No se pudo guardar el progreso" });
        break;
      default:
        res.statusCode = 200;
        res.json(newLearningProgress);
        break;
    }
  } catch (error) {
    next(error);
  }
}
