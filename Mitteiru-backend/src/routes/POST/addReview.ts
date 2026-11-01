import type { NextFunction, Request, Response } from "express";
import { Anime } from "../../classes/animes";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function addReview(req: Request, res: Response, next: NextFunction) {
  try {
    const animeId = req.params.animeId;
    const { review, profileId, title } = req.body;
    const user = currentUser(res);
    // La identidad visible se toma de la BD, nunca del cuerpo de la petición.
    const profile = await requireOwnedProfile(profileId, user.sub);
    const addReview = await new Anime(animeId).addReview(
      review,
      title,
      profileId,
      String(profile.name ?? user.username ?? "Usuario"),
      String(profile.photo ?? ""),
    );
    switch (addReview.message) {
      case "Success":
        res.statusCode = 201;
        res.json(addReview);
        break;
      case "There was an error while getting the reviews":
        res.statusCode = 500;
        res.json(addReview);
    }
  } catch (error) {
    next(error);
  }
}
