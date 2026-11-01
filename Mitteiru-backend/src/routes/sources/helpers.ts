import type { Response } from "express";
import { SourceError, toSourceHttpError } from "../../sources/errors";

export function sendSourceError(res: Response, error: unknown): void {
  if (!(error instanceof SourceError)) {
    console.error("[sources] error inesperado:", error);
  }
  const { status, body } = toSourceHttpError(error);
  res.status(status).json(body);
}

export function parsePage(value: unknown, fallback = 1): number {
  const parsed = typeof value === "string" ? Number.parseInt(value, 10) : Number.NaN;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(1, parsed));
}

export function parseBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "1";
}
