import AnimeInList from "../../classes/animesInList";
import type { NextFunction, Request, Response } from "express";
import { currentUser } from "../../libs/auth";
import { requireOwnedList } from "../../libs/ownership";

export default async function addAnimeToList(req: Request, res: Response, next: NextFunction) {
  try {
    const animeId = req.params.animeId;
    const listId = req.params.listId;
    const user = currentUser(res);
    await requireOwnedList(listId, user.sub);
    const addAnimeToList = await new AnimeInList(
      "",
      animeId,
      listId,
      "",
    ).addToList();
    switch (addAnimeToList.message) {
      case "success":
        res.statusCode = 201;
        res.json(addAnimeToList);
        break;
      case "An error occurred":
        res.statusCode = 500;
        res.json(addAnimeToList);
    }
  } catch (error) {
    next(error);
  }
}
