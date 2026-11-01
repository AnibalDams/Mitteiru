/**
 * Feature flags de despliegue.
 *
 * El motor de fuentes externas solo se habilita en local. En producción el
 * default es apagado incluso si SOURCES_ENABLED=true por error: no existe
 * break-glass para producción.
 */

export type AppEnv = "local" | "staging" | "production";

type EnvLike = Record<string, string | undefined>;

function normalizeAppEnv(value: string | undefined): AppEnv {
  const normalized = value?.trim().toLowerCase();
  if (normalized === "local" || normalized === "staging") return normalized;
  // Si falta o es desconocido, se asume producción (fail-closed).
  return "production";
}

function isTrue(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function getAppEnv(env: EnvLike = process.env): AppEnv {
  return normalizeAppEnv(env.APP_ENV);
}

export function isSourcesEnabled(env: EnvLike = process.env): boolean {
  return (
    getAppEnv(env) === "local" &&
    env.NODE_ENV !== "production" &&
    isTrue(env.SOURCES_ENABLED)
  );
}

/** Motivo legible para logs/health; cadena vacía si está habilitado. */
export function sourcesDisabledReason(env: EnvLike = process.env): string {
  if (!isTrue(env.SOURCES_ENABLED)) return "sources_disabled";
  if (getAppEnv(env) !== "local") return "not_local";
  if (env.NODE_ENV === "production") return "node_env_production";
  return "";
}
