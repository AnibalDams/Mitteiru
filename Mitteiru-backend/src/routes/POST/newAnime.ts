import type { NextFunction, Request, Response } from "express";
import { Anime } from "../../classes/animes";

export default async function newAnime(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      name,
      japaneseName,
      synopsis,
      releaseYear,
      studio,
      cover,
      image,
      onGoing,
      horizontalImage,
      genres,
    } = req.body;
    const anime = new Anime(
      "",
      name,
      japaneseName,
      synopsis,
      releaseYear,
      studio,
      cover,
      image,
      onGoing,
      horizontalImage,
      genres,
    );

    let createAnime = await anime.new();
    switch (createAnime.message) {
      case "The anime has been created successfully":
        res.statusCode = 201;
        res.json(createAnime);
        break;
      case "The anime has been updated successfully":
        res.statusCode = 200;
        res.json(createAnime);
        break;
      case "An error has occurred while creating an Anime":
        res.statusCode = 500;
        res.json(createAnime);
        break;

      default:
        break;
    }
  } catch (error) {
    next(error);
  }
}
