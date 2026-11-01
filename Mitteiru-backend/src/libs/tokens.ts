import { randomUUID } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { unauthorized } from "./errors";

export type Role = "user" | "admin";

export interface AuthUser {
  sub: string;
  email?: string;
  username?: string;
  role: Role;
  /** Versión de sesión; se incrementa al cerrar sesión. */
  ver: number;
}

function getSecret(): string {
  const secret = process.env.SECRET_KEY;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SECRET_KEY no configurado o demasiado corto (mínimo 32 caracteres)",
    );
  }
  return secret;
}

function ttl(value: string | undefined, fallback: string): SignOptions["expiresIn"] {
  return (value && value.trim() ? value : fallback) as SignOptions["expiresIn"];
}

export function signUserToken(payload: {
  sub: string;
  email?: string;
  username?: string;
  ver?: number;
}): string {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      username: payload.username,
      role: "user",
      aud: "user",
      ver: payload.ver ?? 0,
      jti: randomUUID(),
    },
    getSecret(),
    {
      expiresIn: ttl(process.env.USER_TOKEN_TTL, "12h"),
      algorithm: "HS256",
    },
  );
}

export function signAdminToken(payload: {
  sub: string;
  email?: string;
  ver?: number;
}): string {
  return jwt.sign(
    {
      sub: payload.sub,
      email: payload.email,
      role: "admin",
      aud: "admin",
      ver: payload.ver ?? 0,
      jti: randomUUID(),
    },
    getSecret(),
    {
      expiresIn: ttl(process.env.ADMIN_TOKEN_TTL, "2h"),
      algorithm: "HS256",
    },
  );
}

export function verifyToken(token: string, audience: Role): AuthUser {
  try {
    const decoded = jwt.verify(token, getSecret(), {
      algorithms: ["HS256"],
      audience,
    });

    if (typeof decoded === "string") throw unauthorized("Token inválido");

    const record = decoded as Record<string, unknown>;
    const sub =
      typeof record.sub === "string"
        ? record.sub
        : typeof record._id === "string"
          ? record._id
          : undefined;

    if (!sub) throw unauthorized("Token inválido");

    return {
      sub,
      email: typeof record.email === "string" ? record.email : undefined,
      username: typeof record.username === "string" ? record.username : undefined,
      role: audience,
      ver: typeof record.ver === "number" ? record.ver : 0,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TokenExpiredError") {
      throw unauthorized("La sesión expiró, vuelve a iniciar sesión");
    }
    throw unauthorized("Token inválido");
  }
}
