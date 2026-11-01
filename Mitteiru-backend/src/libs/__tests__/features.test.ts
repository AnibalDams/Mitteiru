import { describe, expect, test } from "bun:test";
import {
  getAppEnv,
  isSourcesEnabled,
  sourcesDisabledReason,
} from "../features";

describe("feature flag del motor de fuentes", () => {
  test("apagado por defecto", () => {
    expect(isSourcesEnabled({})).toBe(false);
    expect(sourcesDisabledReason({})).toBe("sources_disabled");
  });

  test("habilitado en local", () => {
    const env = { APP_ENV: "local", SOURCES_ENABLED: "true" };
    expect(isSourcesEnabled(env)).toBe(true);
    expect(sourcesDisabledReason(env)).toBe("");
  });

  test("producción ignora SOURCES_ENABLED aunque esté en true", () => {
    const env = { APP_ENV: "production", SOURCES_ENABLED: "true" };
    expect(isSourcesEnabled(env)).toBe(false);
    expect(sourcesDisabledReason(env)).toBe("not_local");
  });

  test("staging tampoco habilita fuentes", () => {
    const env = { APP_ENV: "staging", SOURCES_ENABLED: "true" };
    expect(isSourcesEnabled(env)).toBe(false);
  });

  test("NODE_ENV=production bloquea incluso con APP_ENV=local", () => {
    const env = {
      APP_ENV: "local",
      NODE_ENV: "production",
      SOURCES_ENABLED: "true",
    };
    expect(isSourcesEnabled(env)).toBe(false);
    expect(sourcesDisabledReason(env)).toBe("node_env_production");
  });

  test("APP_ENV ausente se trata como producción", () => {
    expect(getAppEnv({})).toBe("production");
    expect(isSourcesEnabled({ SOURCES_ENABLED: "true" })).toBe(false);
  });
});
