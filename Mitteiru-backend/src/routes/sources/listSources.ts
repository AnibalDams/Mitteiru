import type { Request, Response } from "express";
import { listSources as getRegisteredSources, sourceMetadata } from "../../sources/registry";
import { sendSourceError, parseBoolean } from "./helpers";
import { cachedHealthCheck } from "../../sources/health";

export default async function listSources(req: Request, res: Response) {
  try {
    const includeHealth = parseBoolean(req.query.health);
    const sources = getRegisteredSources();

    const data = await Promise.all(
      sources.map(async (source) => ({
        ...sourceMetadata(source),
        ...(includeHealth
          ? {
              health: await cachedHealthCheck(source.id, () =>
                source.healthCheck(),
              ),
            }
          : {}),
      })),
    );

    res.statusCode = 200;
    res.json({ message: "success", sources: data });
  } catch (error) {
    sendSourceError(res, error);
  }
}
