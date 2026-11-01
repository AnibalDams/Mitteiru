import AnimeInList from "../../classes/animesInList";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedList } from "../../libs/ownership";

export default async function removeAnimeFromList(req: Request, res: Response, next: NextFunction) {
  try {
    const animeId = req.params.animeId;
    const listId = req.params.listId;
    const user = currentUser(res);
    await requireOwnedList(listId, user.sub);
    const removeAnime = await new AnimeInList(
      "",
      animeId,
      listId,
      "",
    ).removeFromList();
    switch (removeAnime.message) {
      case "success":
        res.statusCode = 200;
        res.json(removeAnime);
        break;
      case "An error occurred":
        res.statusCode = 500;
        res.json(removeAnime);
    }
  } catch (error) {
    next(error);
  }
}
