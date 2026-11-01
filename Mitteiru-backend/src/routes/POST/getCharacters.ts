import type { Request, Response } from "express";
import Character from "../../classes/characters";

export default async function getCharacterOfAnAnime(
  req: Request,
  res: Response,
) {
  try {
    const animeId = req.params.animeId;
    const characters = await Character.getCharacterOfAnAnime(animeId);

    switch (characters.message) {
      case "Anime not found":
        res.statusCode = 404;
        res.json(characters);
        break;
      case "Success":
        res.statusCode = 200;
        res.json(characters);
        break;
      case "An error has occurred while getting the character":
        res.statusCode = 500;
        res.json(characters);
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
