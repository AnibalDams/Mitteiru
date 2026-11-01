import type { Request, Response } from "express";
import { refreshEpisodeServers } from "../../sources/import";
import { sendSourceError } from "./helpers";
import { audit } from "../../libs/logger";

export default async function refreshEpisodeServersHandler(
  req: Request,
  res: Response,
) {
  try {
    const result = await refreshEpisodeServers(req.params.episodeId);
    audit("sources.refresh_servers", {
      requestId: res.locals.requestId,
      episodeId: req.params.episodeId,
      servers: result.servers.length,
    });
    res.statusCode = 200;
    res.json({
      message: "Servidores actualizados correctamente",
      ...result,
    });
  } catch (error) {
    sendSourceError(res, error);
  }
}
