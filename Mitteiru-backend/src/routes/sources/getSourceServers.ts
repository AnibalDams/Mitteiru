import type { Request, Response } from "express";
import { getSource } from "../../sources/registry";
import { SourceNotSupportedError } from "../../sources/errors";
import { sendSourceError } from "./helpers";

export default async function getSourceServers(req: Request, res: Response) {
  try {
    const source = getSource(req.params.sourceId);
    if (!source.getServers) {
      throw new SourceNotSupportedError(source.id, "servidores");
    }

    const servers = await source.getServers(
      req.params.externalId,
      req.params.episodeExternalId,
    );

    res.statusCode = 200;
    res.json({ message: "success", servers });
  } catch (error) {
    sendSourceError(res, error);
  }
}
