import Genre from "../../classes/genres";
import type { Response, Request } from "express";

export default async function getAllGenres(req: Request, res: Response) {
  try {
    const genres = await new Genre().getAll();

    switch (genres.message) {
      case "Success":
        res.statusCode = 200;
        res.json(genres);
        break;
      case "An error occurred":
        res.statusCode = 500;
        res.json(genres);
        break;
    }
  } catch (error: any) {
    res.statusCode = 500;
    res.json({ message: "There was an error", error: error.message });
  }
}
