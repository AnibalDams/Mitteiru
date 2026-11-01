import type { SourceHealth, SourceHealthStatus } from "./types";
import { SourceError } from "./errors";

/**
 * Caché breve de health checks: `?health=true` no debe golpear las fuentes
 * en cada petición.
 */
const healthCache = new Map<
  string,
  { expiresAt: number; value: SourceHealth }
>();

export async function cachedHealthCheck(
  sourceId: string,
  check: () => Promise<SourceHealth>,
  ttlMs = 60_000,
): Promise<SourceHealth> {
  const cached = healthCache.get(sourceId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const value = await check();
  healthCache.set(sourceId, { expiresAt: Date.now() + ttlMs, value });
  return value;
}

/**
 * Ejecuta un health check y normaliza el resultado.
 * No lanza: el estado de una fuente nunca debe tumbar la API.
 */
export async function measureHealth(
  sourceId: string,
  check: () => Promise<void>,
): Promise<SourceHealth> {
  const startedAt = Date.now();

  try {
    await check();
    return {
      sourceId,
      status: "ok",
      latencyMs: Date.now() - startedAt,
      checkedAt: Date.now(),
    };
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    if (error instanceof SourceError) {
      const status: SourceHealthStatus =
        error.code === "blocked"
          ? "blocked"
          : error.code === "unavailable" || error.code === "timeout"
            ? "down"
            : "degraded";

      return {
        sourceId,
        status,
        latencyMs,
        checkedAt: Date.now(),
        message: error.message,
        ...(error.hint ? { hint: error.hint } : {}),
      };
    }

    return {
      sourceId,
      status: "down",
      latencyMs,
      checkedAt: Date.now(),
      message: "Error desconocido al consultar la fuente",
    };
  }
}
