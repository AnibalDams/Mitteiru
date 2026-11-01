import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getAnimesOfAnStudio(req: Request, res: Response) {
  try {
    const studio = req.params.studio;
    const animes = await new Anime(
      "",
      "",
      "",
      "",
      "",
      studio,
    ).getAnimesOfAnStudio();
    switch (animes.message) {
      case "success":
        res.statusCode = 200;
        res.json(animes);
        break;
      case "An error has occurred while getting the animes":
        res.statusCode = 500;
        res.json(animes);
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
