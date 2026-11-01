import type { NextFunction, Response, Request } from "express";
import Episode from "../../classes/episodes";
import { currentUser } from "../../libs/auth";
import { requireOwnedProfile } from "../../libs/ownership";

export default async function addLikeToComment(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { commentId, profileId, episodeId } = req.params;
    const user = currentUser(res);

    // El perfil debe pertenecer al usuario autenticado. Sin esto cualquier
    // usuario podía dar/quitar likes con el perfil de otra persona.
    await requireOwnedProfile(profileId, user.sub);

    const addLike = await new Episode(episodeId).addLikeToComment(
      commentId,
      profileId,
    );

    switch (addLike.message) {
      case "The comment does not exist":
        res.statusCode = 404;
        res.json(addLike);
        break;
      case "The profile does not exist":
        res.statusCode = 404;
        res.json(addLike);
        break;
      case "The like was removed successfully":
        res.statusCode = 200;
        res.json(addLike);
        break;
      case "The like was added successfully":
        res.statusCode = 201;
        res.json(addLike);
        break;
      case "An error has occurred while adding the like to the comment":
        res.statusCode = 500;
        res.json(addLike);
        break;
      default:
        res.statusCode = 500;
        res.json({ message: "No se pudo procesar el like" });
        break;
    }
  } catch (error) {
    next(error);
  }
}
