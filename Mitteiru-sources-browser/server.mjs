/**
 * Sidecar de navegador stealth para el motor de fuentes de Mitteiru.
 *
 * Expone:
 *   GET  /health  → estado del servicio
 *   POST /fetch   → { url, cookies?, userAgent? } => { status, body, cookies, userAgent, finalUrl }
 *
 * Seguridad:
 *   - Token compartido opcional (x-source-token).
 *   - Allowlist de dominios (ALLOWED_HOSTS).
 *   - Límite de tamaño de body y de concurrencia.
 *
 * Este servicio NO se expone públicamente: debe vivir en la misma red privada
 * que el backend (docker-compose / Render private service).
 */

import http from "node:http";
import crypto from "node:crypto";
import dns from "node:dns/promises";
import net from "node:net";

const PORT = Number(process.env.PORT ?? 8787);
const APP_ENV = (process.env.APP_ENV ?? "production").trim().toLowerCase();
const TOKEN = (process.env.SOURCES_BROWSER_TOKEN ?? "").trim();
const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? "animeonsen.xyz,jkanime.net")
  .split(",")
  .map((host) => host.trim().toLowerCase())
  .filter(Boolean);

if (APP_ENV !== "local") {
  console.error(
    "[sources-browser] Solo se permite en local (APP_ENV=local). No desplegar en producción.",
  );
  process.exit(1);
}

if (!TOKEN) {
  console.error(
    "[sources-browser] SOURCES_BROWSER_TOKEN es obligatorio. El servicio no arranca sin token.",
  );
  process.exit(1);
}

const NAV_TIMEOUT_MS = Number(process.env.NAV_TIMEOUT_MS ?? 45_000);
const CHALLENGE_TIMEOUT_MS = Number(process.env.CHALLENGE_TIMEOUT_MS ?? 25_000);
const MAX_BODY_BYTES = 64 * 1024;

let browserPromise;
let browserReady = false;

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import("patchright");
      const browser = await chromium.launch({
        headless: true,
        args: [
          "--disable-blink-features=AutomationControlled",
          "--no-sandbox",
          "--disable-dev-shm-usage",
        ],
      });
      browserReady = true;
      return browser;
    })().catch((error) => {
      browserPromise = undefined;
      throw error;
    });
  }
  return browserPromise;
}

function isAllowed(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return ALLOWED_HOSTS.some(
      (candidate) => host === candidate || host.endsWith(`.${candidate}`),
    );
  } catch {
    return false;
  }
}

function isPrivateAddress(address) {
  const value = String(address).trim().toLowerCase();
  const version = net.isIP(value);

  if (version === 4) {
    const [a, b] = value.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 192 && b === 0) return true;
    if (a === 198 && (b === 18 || b === 19)) return true;
    if (a === 198 && b === 51) return true;
    if (a === 203 && b === 0) return true;
    if (a >= 224) return true;
    return false;
  }

  if (version === 6) {
    if (value === "::" || value === "::1") return true;
    if (value.startsWith("::ffff:")) return isPrivateAddress(value.slice(7));
    if (value.startsWith("fc") || value.startsWith("fd")) return true;
    if (/^fe[89ab]/.test(value)) return true;
    if (value.startsWith("ff")) return true;
    if (value.startsWith("2001:db8")) return true;
    return false;
  }

  return false;
}

const hostCache = new Map();

async function assertSafeTarget(raw) {
  const url = new URL(raw);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Protocolo no permitido");
  }
  if (!isAllowed(url.toString())) {
    throw new Error("Dominio no permitido");
  }

  const host = url.hostname.replace(/^\[/, "").replace(/\]$/, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) {
    throw new Error("Host no permitido");
  }

  const cached = hostCache.get(host);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.private) throw new Error("La URL apunta a una red privada");
    return url;
  }

  const addresses = net.isIP(host)
    ? [{ address: host }]
    : await dns.lookup(host, { all: true, verbatim: true }).catch(() => []);

  if (addresses.length === 0) throw new Error("No se pudo resolver el dominio");

  const isPrivate = addresses.some((entry) => isPrivateAddress(entry.address));
  hostCache.set(host, { expiresAt: Date.now() + 60_000, private: isPrivate });
  if (isPrivate) throw new Error("La URL apunta a una red privada");
  return url;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("Body demasiado grande"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function authorized(req) {
  const provided = req.headers["x-source-token"];
  if (typeof provided !== "string" || !provided) return false;
  return safeEqual(provided, TOKEN);
}

async function waitForChallenge(page) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < CHALLENGE_TIMEOUT_MS) {
    const title = await page.title().catch(() => "");
    const normalized = title.toLowerCase();
    const challenged =
      normalized.includes("just a moment") ||
      normalized.includes("attention required") ||
      normalized.includes("checking your browser");
    if (!challenged) return true;
    await page.waitForTimeout(1_000);
  }
  return false;
}

async function fetchWithBrowser({ url, cookies = [], userAgent }) {
  await assertSafeTarget(url);
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent:
      userAgent ||
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    locale: "es-ES",
    viewport: { width: 1366, height: 768 },
    javaScriptEnabled: true,
  });

  try {
    // Bloquea navegaciones (incluidas redirecciones) a hosts/IPs no permitidos
    // antes de que el navegador llegue a ellos.
    await context.route("**", async (route) => {
      if (route.request().resourceType() !== "document") {
        return route.continue();
      }
      try {
        await assertSafeTarget(route.request().url());
        return route.continue();
      } catch {
        return route.abort();
      }
    });

    if (Array.isArray(cookies) && cookies.length > 0) {
      const cookieUrl = new URL(url).origin;
      const valid = cookies
        .filter(
          (cookie) =>
            cookie && typeof cookie.name === "string" && typeof cookie.value === "string",
        )
        .map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
          url: cookieUrl,
        }));
      if (valid.length > 0) await context.addCookies(valid);
    }

    const page = await context.newPage();
    let response;
    try {
      response = await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: NAV_TIMEOUT_MS,
      });
    } catch (error) {
      throw new Error(`No se pudo navegar a la fuente: ${error.message}`);
    }

    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    const solved = await waitForChallenge(page);

    const finalUrl = page.url();
    await assertSafeTarget(finalUrl);

    const body = await page.content();
    if (body.length > 5_000_000) {
      throw new Error("La respuesta de la fuente es demasiado grande");
    }
    const contextCookies = await context.cookies();

    return {
      status: solved ? response?.status() ?? 200 : 403,
      body,
      finalUrl,
      userAgent: await page.evaluate(() => navigator.userAgent).catch(() => userAgent),
      cookies: contextCookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
      })),
    };
  } finally {
    await context.close().catch(() => {});
  }
}

// Cola simple: un contexto a la vez para no saturar CPU/RAM.
let queue = Promise.resolve();
let pending = 0;
const MAX_PENDING = 8;

function enqueue(task) {
  const result = queue.then(task, task);
  queue = result.catch(() => {});
  return result;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    json(res, 200, {
      status: "ok",
      browser: browserReady ? "ready" : "not_started",
    });
    return;
  }

  if (req.method !== "POST" || req.url !== "/fetch") {
    json(res, 404, { message: "Not found" });
    return;
  }

  if (!authorized(req)) {
    json(res, 401, { message: "Unauthorized" });
    return;
  }

  let payload;
  try {
    payload = JSON.parse(await readBody(req));
  } catch {
    json(res, 400, { message: "JSON inválido" });
    return;
  }

  if (!payload || typeof payload.url !== "string") {
    json(res, 400, { message: "URL no permitida" });
    return;
  }

  try {
    await assertSafeTarget(payload.url);
  } catch {
    json(res, 400, { message: "URL no permitida" });
    return;
  }

  if (pending >= MAX_PENDING) {
    json(res, 429, { message: "Demasiadas peticiones en curso" });
    return;
  }

  pending += 1;
  try {
    const result = await enqueue(() => fetchWithBrowser(payload));
    json(res, 200, result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    const notInstalled = /patchright|Cannot find package|ERR_MODULE_NOT_FOUND/i.test(message);
    if (!notInstalled) {
      console.error("[sources-browser] error:", message);
    }
    json(res, notInstalled ? 501 : 502, {
      message: notInstalled
        ? "Patchright no está instalado en el sidecar"
        : "No se pudo navegar la fuente",
    });
  } finally {
    pending -= 1;
  }
});

server.listen(PORT, () => {
  console.log(`[sources-browser] escuchando en :${PORT}`);
});

async function shutdown(signal) {
  console.log(`[sources-browser] ${signal}, cerrando...`);
  server.close();
  if (browserPromise) {
    const browser = await browserPromise.catch(() => undefined);
    await browser?.close().catch(() => {});
  }
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
