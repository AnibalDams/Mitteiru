/**
 * Rate limit por host para no abusar de las fuentes externas.
 *
 * Ventana deslizante simple: como máximo `maxRequests` por `windowMs` y host.
 * Las peticiones esperan su turno en lugar de fallar, salvo que la espera
 * supere `maxWaitMs`.
 */

import { SourceUnavailableError } from "./errors";

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  maxRequests?: number;
  windowMs?: number;
  maxWaitMs?: number;
}

const DEFAULTS: Required<RateLimitOptions> = {
  maxRequests: 8,
  windowMs: 10_000,
  maxWaitMs: 15_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function acquireRateLimit(
  sourceId: string,
  host: string,
  options: RateLimitOptions = {},
): Promise<void> {
  const { maxRequests, windowMs, maxWaitMs } = { ...DEFAULTS, ...options };
  const key = `${sourceId}:${host}`;
  const startedAt = Date.now();

  for (;;) {
    const now = Date.now();
    const bucket = buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((ts) => now - ts < windowMs);

    if (bucket.timestamps.length < maxRequests) {
      bucket.timestamps.push(now);
      buckets.set(key, bucket);
      return;
    }

    const oldest = bucket.timestamps[0] ?? now;
    const waitMs = Math.max(50, windowMs - (now - oldest) + 50);

    if (Date.now() - startedAt + waitMs > maxWaitMs) {
      throw new SourceUnavailableError(
        sourceId,
        "Límite de peticiones a la fuente alcanzado, intenta de nuevo en unos segundos",
        429,
      );
    }

    await sleep(waitMs);
  }
}

/** Útil en tests para aislar el estado global. */
export function resetRateLimits(): void {
  buckets.clear();
}
