/**
 * Token HMAC para el proxy de playback.
 *
 * El navegador nunca recibe el JWT de AnimeOnsen: recibe una URL firmada que
 * apunta a nuestro backend, y este agrega el `Referer` que el CDN exige.
 *
 * El token solo autoriza una base de CDN concreta (`cdn.animeonsen.xyz/video/`)
 * y caduca; no es un proxy abierto.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const CDN_HOST = "cdn.animeonsen.xyz";
const TOKEN_TTL_MS = 6 * 60 * 60 * 1000;

function getSecret(): string {
  const secret =
    process.env.PLAYBACK_TOKEN_SECRET?.trim() ||
    process.env.SECRET_KEY?.trim();

  if (!secret || secret.length < 16) {
    throw new Error(
      "PLAYBACK_TOKEN_SECRET o SECRET_KEY no configurado (mínimo 16 caracteres)",
    );
  }

  return secret;
}

export function isAllowedCdnBase(cdnBase: string): boolean {
  try {
    const url = new URL(cdnBase);
    return (
      url.protocol === "https:" &&
      url.hostname === CDN_HOST &&
      url.pathname.startsWith("/video/") &&
      url.pathname.endsWith("/")
    );
  } catch {
    return false;
  }
}

export function createPlaybackToken(cdnBase: string): string {
  if (!isAllowedCdnBase(cdnBase)) {
    throw new Error("Base de CDN no permitida para playback");
  }

  const payload = Buffer.from(
    JSON.stringify({
      b: cdnBase,
      e: Date.now() + TOKEN_TTL_MS,
    }),
    "utf8",
  ).toString("base64url");

  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");

  return `${payload}.${signature}`;
}

export interface PlaybackTokenPayload {
  cdnBase: string;
  expiresAt: number;
}

export function decodePlaybackToken(
  token: string,
): PlaybackTokenPayload | undefined {
  const parts = token.split(".");
  if (parts.length !== 2) return undefined;

  const [payload, signature] = parts;
  if (!payload || !signature) return undefined;

  let expected: string;
  try {
    expected = createHmac("sha256", getSecret())
      .update(payload)
      .digest("base64url");
  } catch {
    return undefined;
  }

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return undefined;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { b?: unknown; e?: unknown };

    if (typeof decoded.b !== "string" || typeof decoded.e !== "number") {
      return undefined;
    }
    if (decoded.e <= Date.now()) return undefined;
    if (!isAllowedCdnBase(decoded.b)) return undefined;

    return { cdnBase: decoded.b, expiresAt: decoded.e };
  } catch {
    return undefined;
  }
}
