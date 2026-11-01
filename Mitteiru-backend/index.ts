import express, { json, urlencoded, type ErrorRequestHandler } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";

import routes from "./src/routes/index.routes";
import dbConnection from "./src/libs/db";
import { errorHandler, notFoundHandler } from "./src/libs/errors";
import { ensureIndexes } from "./src/libs/indexes";
import { log, requestId } from "./src/libs/logger";
import {
  getAppEnv,
  isSourcesEnabled,
  sourcesDisabledReason,
} from "./src/libs/features";

const app = express();

// Render/Heroku y similares envían X-Forwarded-For. Solo se confía en los
// proxies declarados explícitamente (TRUST_PROXY=1 o lista de CIDRs).
const trustProxy = process.env.TRUST_PROXY?.trim();
if (trustProxy) {
  if (trustProxy === "true") app.set("trust proxy", true);
  else if (/^\d+$/.test(trustProxy)) app.set("trust proxy", Number(trustProxy));
  else app.set("trust proxy", trustProxy.split(",").map((value) => value.trim()));
}

const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(requestId);
app.use(
  helmet({
    // La CSP la aplica el frontend (SvelteKit). La API solo sirve JSON.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : false,
    credentials: false,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);

app.use(urlencoded({ extended: false, limit: "1mb" }));
app.use(json({ limit: "1mb" }));

// Evita que un JSON malformado devuelva un stack trace HTML con rutas internas.
const jsonErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      message: "JSON inválido en el cuerpo de la petición",
      error: "invalid_json",
      code: "invalid_json",
    });
    return;
  }
  next(err);
};
app.use(jsonErrorHandler);

// Red de seguridad: si un handler antiguo devuelve un mensaje interno de
// MongoDB/JWT/red en `error`, se sustituye por un código genérico.
app.use((_req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (body && typeof body === "object" && "error" in body) {
      const record = body as Record<string, unknown>;
      if (
        typeof record.error === "string" &&
        /(mongo|bson|e11000|duplicate key|jwt|invalid signature|token expired|econn|enotfound|etimedout|timeout|stack|cannot read|typeerror|referenceerror|validationerror|at\s+\w+)/i.test(
          record.error,
        )
      ) {
        return originalJson({ ...record, error: "internal_error" });
      }
    }
    return originalJson(body);
  }) as typeof res.json;
  next();
});

// Archivos estáticos (antes de las rutas para que no las intercepten).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  "/static",
  express.static(path.join(__dirname, "static"), {
    fallthrough: true,
    index: false,
    maxAge: "7d",
  }),
);

// Rutas
app.use(routes);

// 404 y errores centralizados
app.use(notFoundHandler);
app.use(errorHandler);

const port = Number(process.env.PORT ?? 8000);
const isMain =
  (import.meta as ImportMeta & { main?: boolean }).main === true ||
  process.env.NODE_ENV !== "test";

if (isMain) {
  log("info", isSourcesEnabled() ? "sources.enabled" : "sources.disabled", {
    appEnv: getAppEnv(),
    reason: sourcesDisabledReason() || undefined,
  });

  app.listen(port, async () => {
    console.log(`listening on port ${port}`);
    try {
      await dbConnection();
      await ensureIndexes();
    } catch (error) {
      console.error("No se pudo inicializar la base de datos:", error);
    }
  });
}

export { app };
export default app;
