import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

type Level = "info" | "warn" | "error";

const REDACTED_KEYS = new Set([
  "password",
  "pass",
  "token",
  "authorization",
  "cookie",
  "set-cookie",
  "secret",
  "secretkey",
  "apikey",
  "api_key",
]);

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[depth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > 500 ? `${value.slice(0, 500)}…` : value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitize(item, depth + 1));

  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    output[key] = REDACTED_KEYS.has(key.toLowerCase())
      ? "[redacted]"
      : sanitize(item, depth + 1);
  }
  return output;
}

export function log(level: Level, event: string, data: Record<string, unknown> = {}): void {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(sanitize(data) as Record<string, unknown>),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function audit(event: string, data: Record<string, unknown> = {}): void {
  log("info", `audit.${event}`, data);
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers["x-request-id"];
  const id =
    typeof incoming === "string" && /^[A-Za-z0-9._-]{8,120}$/.test(incoming)
      ? incoming
      : randomUUID();
  res.locals.requestId = id;
  res.setHeader("X-Request-Id", id);
  next();
}
