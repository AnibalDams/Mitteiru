import { Anime } from "../../classes/animes";
import type { Response, Request } from "express";

export default async function getMostPopularAnimes(
  req: Request,
  res: Response,
) {
  try {
    const animes = new Anime();
    const mostPopular = await animes.getMostPopular();
    switch (mostPopular.message) {
      case "success":
        res.statusCode = 200;
        res.json(mostPopular);
        break;
      case "An error has occurred while getting the animes":
        res.statusCode = 500;
        res.json(mostPopular);
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "No se pudieron obtener los animes populares" });
  }
}
