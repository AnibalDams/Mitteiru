import type { Request, Response } from "express";
import { getSource } from "../../sources/registry";
import { sendSourceError } from "./helpers";
import { cachedHealthCheck } from "../../sources/health";

export default async function sourceHealth(req: Request, res: Response) {
  try {
    const source = getSource(req.params.sourceId);
    const health = await cachedHealthCheck(source.id, () => source.healthCheck());

    res.statusCode = 200;
    res.json({ message: "success", health });
  } catch (error) {
    sendSourceError(res, error);
  }
}
