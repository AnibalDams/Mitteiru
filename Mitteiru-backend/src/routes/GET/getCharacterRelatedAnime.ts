import type { Request, Response } from "express";
import Character from "../../classes/characters";

export default async function getCharacterRelatedAnime(
  req: Request,
  res: Response,
) {
  try {
    const characterId = req.params.id;

    if (!characterId) {
      res.statusCode = 400;
      return res.json({ message: "Character ID is required" });
    }
    const relatedAnimes =
      await Character.getRelatedAnimesInformation(characterId);
    switch (relatedAnimes.message) {
      case "Character not found":
        res.statusCode = 404;
        return res.json(relatedAnimes);
      case "Success":
        res.statusCode = 200;
        return res.json(relatedAnimes);
      case "An error has occurred while getting related animes":
        res.statusCode = 500;
        return res.json(relatedAnimes);
    }
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: "An error has occurred while fetching related animes",
      error: (error as Error).message,
    });
  }
}
