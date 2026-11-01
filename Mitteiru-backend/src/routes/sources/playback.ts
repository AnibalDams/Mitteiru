/**
 * Proxy de playback para AnimeOnsen.
 *
 * El CDN exige un Referer del sitio y bloquea orígenes desconocidos, así que
 * el navegador nunca habla directo con `cdn.animeonsen.xyz`. En su lugar:
 *   1. El backend firma una URL de playback (HMAC, 7 días).
 *   2. El navegador pide el MPD/segmentos a nuestro mismo origen (`/api/...`).
 *   3. Este proxy los busca en el CDN con el Referer correcto.
 *
 * No se reenvía el JWT de AnimeOnsen al navegador ni se permite un proxy
 * abierto: el token solo autoriza una base `cdn.animeonsen.xyz/video/`.
 */

import type { Request, Response as ExpressResponse } from "express";
import { decodePlaybackToken } from "../../sources/playbackToken";

const CDN_REFERER = "https://www.animeonsen.xyz/";
const CDN_ORIGIN = "https://www.animeonsen.xyz";
const CDN_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const CDN_TIMEOUT_MS = 30_000;

function resolveToken(req: Request) {
  const token = typeof req.params.token === "string" ? req.params.token : "";
  return decodePlaybackToken(token);
}

async function fetchCdn(url: string, range?: string): Promise<globalThis.Response> {
  const headers: Record<string, string> = {
    "User-Agent": CDN_USER_AGENT,
    Referer: CDN_REFERER,
    Origin: CDN_ORIGIN,
    Accept: "*/*",
  };
  if (range) headers.Range = range;

  return fetch(url, {
    headers,
    signal: AbortSignal.timeout(CDN_TIMEOUT_MS),
  });
}

export async function getManifest(req: Request, res: ExpressResponse): Promise<void> {
  const session = resolveToken(req);
  if (!session) {
    res.status(404).json({ message: "Playback no encontrado o expirado" });
    return;
  }

  try {
    // Sin Range: necesitamos el MPD completo para reescribir sus URLs.
    const response = await fetchCdn(`${session.cdnBase}manifest.mpd`);
    if (!response.ok) {
      res.status(response.status).end();
      return;
    }

    const manifest = await response.text();
    const proxyBase = `/api/sources/animeonsen/playback/${req.params.token}/`;
    const rewritten = manifest.replaceAll(session.cdnBase, proxyBase);

    res
      .status(200)
      .set("Content-Type", "application/dash+xml; charset=utf-8")
      .set("Cache-Control", "no-store")
      .send(rewritten);
  } catch {
    res.status(502).json({
      message: "No se pudo obtener el manifiesto de AnimeOnsen",
    });
  }
}

export async function getSegment(req: Request, res: ExpressResponse): Promise<void> {
  const session = resolveToken(req);
  if (!session) {
    res.status(404).json({ message: "Playback no encontrado o expirado" });
    return;
  }

  const file = typeof req.params.file === "string" ? req.params.file : "";
  if (!/^[A-Za-z0-9._-]+$/.test(file)) {
    res.status(400).json({ message: "Segmento inválido" });
    return;
  }

  try {
    const range =
      typeof req.headers.range === "string" ? req.headers.range : undefined;
    const response = await fetchCdn(`${session.cdnBase}${file}`, range);

    if (!response.ok) {
      res.status(response.status).end();
      return;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status);

    for (const header of [
      "content-type",
      "content-length",
      "content-range",
      "accept-ranges",
    ]) {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    }

    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch {
    res.status(502).json({
      message: "No se pudo obtener el segmento de AnimeOnsen",
    });
  }
}
