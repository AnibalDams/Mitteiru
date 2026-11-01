/**
 * Transporte HTTP de las fuentes.
 *
 * Cadena de resolución:
 *   1. fetch directo con headers realistas y cookies de sesión.
 *   2. Si Cloudflare bloquea, navegador stealth (sidecar Patchright).
 *   3. Si no hay sidecar, FlareSolverr/Byparr (API compatible).
 *
 * Incluye caché TTL, rate limit por host, reintentos con backoff y una
 * allowlist de dominios para evitar SSRF.
 */

import { sourceCache } from "./cache";
import {
  SourceBlockedError,
  SourceError,
  SourceInvalidRequestError,
  SourceNotFoundError,
  SourceParseError,
  SourceUnavailableError,
} from "./errors";
import { acquireRateLimit } from "./rateLimit";
import { assertAllowedHost, assertSafeUrl } from "../libs/httpUrl";
import type { SourceFetchOptions, SourceHttp } from "./types";
import { absoluteUrl } from "./utils";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const CLOUDFLARE_MARKERS = [
  "attention required! | cloudflare",
  "just a moment...",
  "cf-chl",
  "cf-error-details",
  "cloudflare ray id",
  "checking your browser",
  "enable javascript and cookies to continue",
];

const DEFAULT_TIMEOUT_MS = 20_000;
const SOLVER_TIMEOUT_MS = 90_000;
const DEFAULT_CACHE_TTL_MS = 60_000;

interface StoredCookie {
  value: string;
  expiresAt?: number;
}

interface BrowserSolution {
  status: number;
  body: string;
  cookies: { name: string; value: string }[];
  userAgent?: string;
  finalUrl?: string;
}

class CookieJar {
  private readonly hosts = new Map<string, Map<string, StoredCookie>>();

  get(host: string): string {
    const cookies = this.hosts.get(host);
    if (!cookies) return "";
    const now = Date.now();
    const parts: string[] = [];
    for (const [name, cookie] of cookies) {
      if (cookie.expiresAt && cookie.expiresAt <= now) {
        cookies.delete(name);
        continue;
      }
      parts.push(`${name}=${cookie.value}`);
    }
    return parts.join("; ");
  }

  getCookie(host: string, name: string): string | undefined {
    const cookies = this.hosts.get(host);
    const cookie = cookies?.get(name);
    if (!cookie) return undefined;
    if (cookie.expiresAt && cookie.expiresAt <= Date.now()) {
      cookies?.delete(name);
      return undefined;
    }
    return cookie.value;
  }

  store(host: string, setCookieHeaders: string[]): void {
    if (!setCookieHeaders.length) return;
    const cookies = this.hosts.get(host) ?? new Map<string, StoredCookie>();
    for (const header of setCookieHeaders) {
      const [pair] = header.split(";");
      if (!pair) continue;
      const separator = pair.indexOf("=");
      if (separator <= 0) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!name) continue;

      let expiresAt: number | undefined;
      const maxAge = header.match(/max-age=(\d+)/i);
      const expires = header.match(/expires=([^;]+)/i);
      if (maxAge) {
        expiresAt = Date.now() + Number(maxAge[1]) * 1000;
      } else if (expires) {
        const parsed = Date.parse(expires[1]);
        if (Number.isFinite(parsed)) expiresAt = parsed;
      }
      cookies.set(name, { value, expiresAt });
    }
    this.hosts.set(host, cookies);
  }

  import(host: string, cookies: { name: string; value: string }[]): void {
    if (!cookies.length) return;
    const stored = this.hosts.get(host) ?? new Map<string, StoredCookie>();
    for (const cookie of cookies) {
      if (!cookie.name) continue;
      stored.set(cookie.name, { value: cookie.value });
    }
    this.hosts.set(host, stored);
  }

  export(host: string): { name: string; value: string }[] {
    const cookies = this.hosts.get(host);
    if (!cookies) return [];
    return [...cookies.entries()].map(([name, cookie]) => ({ name, value: cookie.value }));
  }
}

const jars = new Map<string, CookieJar>();

function getJar(sourceId: string): CookieJar {
  const jar = jars.get(sourceId) ?? new CookieJar();
  jars.set(sourceId, jar);
  return jar;
}

function isCloudflareChallenge(status: number, body: string, headers: Headers): boolean {
  if (headers.get("cf-mitigated")) return true;
  if (status !== 403 && status !== 503 && status !== 429) return false;
  if ((headers.get("server") ?? "").toLowerCase().includes("cloudflare") && status === 403) {
    return true;
  }
  const haystack = body.slice(0, 20_000).toLowerCase();
  return CLOUDFLARE_MARKERS.some((marker) => haystack.includes(marker));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SourceHttpClientOptions {
  sourceId: string;
  baseUrl: string;
  userAgent?: string;
  allowedHosts?: string[];
  /** Solo para tests locales: permite loopback/redes privadas. */
  allowPrivateHosts?: boolean;
}

interface RequestExtras {
  method?: "GET" | "POST";
  body?: string;
  headers?: Record<string, string>;
}

export class SourceHttpClient implements SourceHttp {
  readonly baseUrl: string;
  private readonly sourceId: string;
  private readonly userAgent: string;
  private readonly allowedHosts: string[];
  private readonly allowPrivateHosts: boolean;
  private readonly jar: CookieJar;

  constructor(options: SourceHttpClientOptions) {
    this.sourceId = options.sourceId;
    this.baseUrl = options.baseUrl;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.jar = getJar(options.sourceId);
    this.allowPrivateHosts =
      options.allowPrivateHosts === true ||
      process.env.SOURCES_ALLOW_PRIVATE === "true";

    const extra = (process.env.SOURCES_ALLOWED_HOSTS ?? "")
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);

    this.allowedHosts = [
      ...new Set([
        new URL(options.baseUrl).hostname.toLowerCase(),
        ...(options.allowedHosts ?? []).map((host) => host.toLowerCase()),
        ...extra,
      ]),
    ];
  }

  absolute(href: string): string {
    const resolved = absoluteUrl(this.baseUrl, href);
    if (!resolved) {
      throw new SourceInvalidRequestError(
        this.sourceId,
        `URL inválida recibida de la fuente: ${href}`,
      );
    }
    return resolved;
  }

  getCookie(name: string): string | undefined {
    const host = new URL(this.baseUrl).host;
    const alternate = host.startsWith("www.")
      ? host.slice(4)
      : `www.${host}`;
    return (
      this.jar.getCookie(host, name) ??
      this.jar.getCookie(alternate, name)
    );
  }

  async getText(url: string, options: SourceFetchOptions = {}): Promise<string> {
    const result = await this.request(url, options);
    return result.body;
  }

  async getJson<T>(url: string, options: SourceFetchOptions = {}): Promise<T> {
    const body = await this.getText(url, {
      ...options,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        ...options.headers,
      },
    });
    try {
      return JSON.parse(body) as T;
    } catch (error) {
      throw new SourceParseError(
        this.sourceId,
        "La fuente devolvió JSON inválido (¿cambió la API o hay un challenge?)",
      );
    }
  }

  async postText(
    url: string,
    form: Record<string, string>,
    options: SourceFetchOptions = {},
  ): Promise<string> {
    const body = new URLSearchParams(form).toString();
    const result = await this.request(url, { ...options, noCache: true }, {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-origin",
        ...options.headers,
      },
    });
    return result.body;
  }

  async postJson<T>(
    url: string,
    form: Record<string, string>,
    options: SourceFetchOptions = {},
  ): Promise<T> {
    const body = await this.postText(url, form, options);
    try {
      return JSON.parse(body) as T;
    } catch {
      throw new SourceParseError(
        this.sourceId,
        "La fuente devolvió JSON inválido en una petición POST",
      );
    }
  }

  /** POST con cuerpo JSON (p. ej. Meilisearch). */
  async postJsonBody<T>(
    url: string,
    body: unknown,
    options: SourceFetchOptions = {},
  ): Promise<T> {
    const result = await this.request(
      url,
      { ...options, noCache: true },
      {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "cross-site",
          ...options.headers,
        },
      },
    );

    try {
      return JSON.parse(result.body) as T;
    } catch {
      throw new SourceParseError(
        this.sourceId,
        "La fuente devolvió JSON inválido en una petición POST JSON",
      );
    }
  }

  private async request(
    url: string,
    options: SourceFetchOptions,
    extras: RequestExtras = {},
  ): Promise<{ body: string; status: number }> {
    const absolute = this.absolute(url);
    const parsed = new URL(absolute);
    await this.assertSafeTarget(parsed);

    const method = extras.method ?? "GET";
    const cacheKey = `source:${this.sourceId}:${method}:${absolute}`;
    const ttl = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
    if (method === "GET" && !options.noCache) {
      const cached = sourceCache.get<string>(cacheKey);
      if (cached !== undefined) return { body: cached, status: 200 };
    }

    await acquireRateLimit(this.sourceId, parsed.host);

    const direct = await this.directFetch(absolute, options, extras);
    if (direct.ok) {
      if (method === "GET" && !options.noCache) {
        sourceCache.set(cacheKey, direct.body, ttl);
      }
      return { body: direct.body, status: direct.status };
    }

    if (direct.cloudflare) {
      if (method !== "GET") {
        throw new SourceBlockedError(
          this.sourceId,
          "Cloudflare bloqueó una petición POST y el solver solo resuelve navegación GET",
          "Reintenta más tarde o usa el sidecar Patchright con cookies frescas.",
        );
      }

      const solved = await this.solveChallenge(absolute, parsed.host);
      if (solved) {
        if (method === "GET" && !options.noCache) {
          sourceCache.set(cacheKey, solved.body, ttl);
        }
        return { body: solved.body, status: solved.status };
      }
      throw new SourceBlockedError(
        this.sourceId,
        "Cloudflare bloqueó la petición y no hay un transporte alternativo disponible",
        "Configura SOURCES_BROWSER_URL (sidecar) o FLARESOLVERR_URL, o usa un proxy residencial.",
      );
    }

    throw new SourceUnavailableError(
      this.sourceId,
      `La fuente respondió con estado ${direct.status}`,
      direct.status,
    );
  }

  private async directFetch(
    absolute: string,
    options: SourceFetchOptions,
    extras: RequestExtras = {},
  ): Promise<{ ok: boolean; status: number; body: string; cloudflare: boolean }> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const method = extras.method ?? "GET";
    let lastStatus = 0;
    let lastBody = "";

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        let current = new URL(absolute);
        let response: Response | undefined;

        // Redirecciones manuales: cada salto se valida contra la allowlist y
        // contra rangos de IP privados antes de emitir la petición.
        for (let hop = 0; hop <= 5; hop += 1) {
          await this.assertSafeTarget(current);

          const headerMap = new Map<string, string>();
          const setHeaders = (source?: Record<string, string>) => {
            if (!source) return;
            for (const [name, value] of Object.entries(source)) {
              headerMap.set(name.toLowerCase(), value);
            }
          };

          setHeaders({
            "User-Agent": this.userAgent,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "es-ES,es;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            Referer: `${current.origin}/`,
          });
          setHeaders(extras.headers);
          setHeaders(options.headers);

          const cookie = this.jar.get(current.host);
          if (cookie) headerMap.set("cookie", cookie);

          const headers = Object.fromEntries(headerMap);

          response = await fetch(current, {
            method,
            body: extras.body,
            headers,
            redirect: "manual",
            signal: AbortSignal.timeout(timeoutMs),
          });

          const headersWithCookies = response.headers as Headers & {
            getSetCookie?: () => string[];
          };
          const setCookies = headersWithCookies.getSetCookie?.() ?? [];
          if (setCookies.length) this.jar.store(current.host, setCookies);

          if (![301, 302, 303, 307, 308].includes(response.status)) break;

          const location = response.headers.get("location");
          if (!location) break;

          // No reenviamos cuerpos en redirecciones: evitamos efectos dobles.
          if (method !== "GET") {
            return {
              ok: false,
              status: response.status,
              body: "",
              cloudflare: false,
            };
          }

          current = new URL(location, current);
        }

        if (!response) {
          return { ok: false, status: 502, body: "", cloudflare: false };
        }

        const body = await response.text();
        lastStatus = response.status;
        lastBody = body;

        if (response.ok) {
          return { ok: true, status: response.status, body, cloudflare: false };
        }

        const cloudflare = isCloudflareChallenge(
          response.status,
          body,
          response.headers,
        );
        if (cloudflare) {
          return { ok: false, status: response.status, body, cloudflare: true };
        }

        if (response.status === 404) {
          throw new SourceNotFoundError(this.sourceId);
        }

        if (response.status === 429 || response.status >= 500) {
          await sleep(400 * (attempt + 1) ** 2);
          continue;
        }

        return { ok: false, status: response.status, body, cloudflare: false };
      } catch (error) {
        if (error instanceof SourceError) throw error;
        if (error instanceof Error && error.name === "TimeoutError") {
          lastStatus = 504;
          lastBody = "timeout";
          await sleep(300 * (attempt + 1));
          continue;
        }
        lastStatus = 502;
        lastBody = error instanceof Error ? error.message : String(error);
        await sleep(300 * (attempt + 1));
      }
    }

    return { ok: false, status: lastStatus, body: lastBody, cloudflare: false };
  }

  private async solveChallenge(
    absolute: string,
    host: string,
  ): Promise<{ status: number; body: string } | undefined> {
    const browser = await this.fetchViaBrowser(absolute, host);
    if (browser) {
      this.jar.import(host, browser.cookies);
      if (browser.status >= 200 && browser.status < 400) {
        return { status: browser.status, body: browser.body };
      }
    }

    const solver = await this.fetchViaFlareSolverr(absolute, host);
    if (solver) {
      this.jar.import(host, solver.cookies);
      if (solver.status >= 200 && solver.status < 400) {
        return { status: solver.status, body: solver.body };
      }
    }

    return undefined;
  }

  private async fetchViaBrowser(
    absolute: string,
    host: string,
  ): Promise<BrowserSolution | undefined> {
    const base = process.env.SOURCES_BROWSER_URL?.replace(/\/+$/, "");
    if (!base) return undefined;

    try {
      const response = await fetch(`${base}/fetch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.SOURCES_BROWSER_TOKEN
            ? { "x-source-token": process.env.SOURCES_BROWSER_TOKEN }
            : {}),
        },
        body: JSON.stringify({
          url: absolute,
          cookies: this.jar.export(host),
          userAgent: this.userAgent,
        }),
        signal: AbortSignal.timeout(SOLVER_TIMEOUT_MS),
      });

      if (!response.ok) return undefined;
      const data: unknown = await response.json();
      if (!isBrowserSolution(data)) return undefined;
      if (typeof data.body === "string" && data.body.length > 5_000_000) {
        return undefined;
      }
      if (typeof data.finalUrl === "string" && data.finalUrl) {
        await this.assertSafeTarget(new URL(data.finalUrl));
      }
      return data;
    } catch {
      return undefined;
    }
  }

  private async fetchViaFlareSolverr(
    absolute: string,
    host: string,
  ): Promise<BrowserSolution | undefined> {
    const base = process.env.FLARESOLVERR_URL?.replace(/\/+$/, "");
    if (!base) return undefined;

    try {
      const response = await fetch(`${base}/v1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cmd: "request.get",
          url: absolute,
          maxTimeout: SOLVER_TIMEOUT_MS,
        }),
        signal: AbortSignal.timeout(SOLVER_TIMEOUT_MS + 5_000),
      });

      if (!response.ok) return undefined;
      const data: unknown = await response.json();
      if (!isFlareSolverrResponse(data)) return undefined;

      const cookies = data.solution.cookies
        .filter(
          (cookie): cookie is { name: string; value: string } =>
            typeof cookie.name === "string" && typeof cookie.value === "string",
        )
        .map((cookie) => ({ name: cookie.name, value: cookie.value }));

      return {
        status: data.solution.status,
        body: data.solution.response,
        cookies,
        userAgent: data.solution.userAgent,
      };
    } catch {
      return undefined;
    }
  }

  private async assertSafeTarget(url: URL): Promise<void> {
    try {
      assertAllowedHost(url, this.allowedHosts);
      if (this.allowPrivateHosts) return;
      await assertSafeUrl(url.toString(), this.allowedHosts);
    } catch (error) {
      throw new SourceInvalidRequestError(
        this.sourceId,
        error instanceof Error ? error.message : "URL no permitida",
      );
    }
  }
}

function isBrowserSolution(value: unknown): value is BrowserSolution {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.status === "number" &&
    typeof record.body === "string" &&
    Array.isArray(record.cookies) &&
    (record.finalUrl === undefined || typeof record.finalUrl === "string")
  );
}

interface FlareSolverrResponse {
  status: string;
  solution: {
    status: number;
    response: string;
    userAgent?: string;
    cookies: { name?: unknown; value?: unknown }[];
  };
}

function isFlareSolverrResponse(value: unknown): value is FlareSolverrResponse {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  if (record.status !== "ok") return false;
  const solution = record.solution;
  if (typeof solution !== "object" || solution === null) return false;
  const s = solution as Record<string, unknown>;
  return (
    typeof s.status === "number" &&
    typeof s.response === "string" &&
    Array.isArray(s.cookies)
  );
}

/** Crea un cliente HTTP aislado por fuente. */
export function createSourceHttp(options: SourceHttpClientOptions): SourceHttpClient {
  return new SourceHttpClient(options);
}
