import type { Request, Response } from "express";
import { Anime } from "../../classes/animes";

export default async function deleteAnime(req: Request, res: Response) {
  try {
    const { animeId } = req.params;

    const deleteA = await Anime.delete(animeId);

    switch (deleteA.message) {
      case "Anime not found":
        res.statusCode = 404;
        res.json(deleteA);
        break;
      case "success":
        res.statusCode = 200;
        res.json(deleteA);
        break;
      case "An error occurred":
        res.statusCode = 500;
        res.json(deleteA);
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
