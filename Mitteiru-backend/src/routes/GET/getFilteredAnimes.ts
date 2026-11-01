import type { Response, Request } from "express";
import dbClient from "../../libs/dbClient";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function positiveInt(value: unknown, fallback: number): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default async function getFilteredAnimes(req: Request, res: Response) {
  try {
    const {
      genre,
      studio,
      year,
      status,
      sort = "newest",
      page = "1",
      limit = "15",
    } = req.query;

    const pageNum = Math.min(10_000, positiveInt(page, 1));
    const limitNum = Math.min(50, positiveInt(limit, 15));
    const skip = (pageNum - 1) * limitNum;

    const query: Record<string, unknown> = {};

    if (typeof genre === "string" && genre.trim()) {
      query.genres = { $regex: `^${escapeRegExp(genre.trim())}$`, $options: "i" };
    }

    if (typeof studio === "string" && studio.trim()) {
      query.studio = { $regex: `^${escapeRegExp(studio.trim())}$`, $options: "i" };
    }

    if (typeof year === "string" && year.trim()) {
      const value = year.trim();
      const yearNum = Number.parseInt(value, 10);
      if (Number.isFinite(yearNum)) {
        // releaseYear puede estar guardado como string o número.
        query.$or = [
          { releaseYear: value },
          { releaseYear: yearNum },
        ];
      } else {
        query.releaseYear = { $regex: `^${escapeRegExp(value)}$`, $options: "i" };
      }
    }

    if (status === "0" || status === "1") {
      // onGoing se guarda como 1/0 en datos antiguos y como boolean en nuevos.
      query.onGoing = status === "1" ? { $in: [1, true] } : { $in: [0, false] };
    }

    let sortQuery: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "popular") sortQuery = { views: -1 };
    else if (sort === "score") sortQuery = { likes: -1 };

    const animeCollection = dbClient.collection("anime");

    const [animes, total] = await Promise.all([
      animeCollection
        .find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limitNum)
        .toArray(),
      animeCollection.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.statusCode = 200;
    res.json({
      message: "success",
      animes,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    console.error("Error in getFilteredAnimes:", error);
    res.statusCode = 500;
    res.json({ message: "No se pudieron obtener los animes filtrados" });
  }
}
