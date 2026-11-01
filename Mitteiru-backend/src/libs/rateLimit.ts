import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";

function limitHandler(message: string) {
  return (_req: Request, res: Response): void => {
    res.status(429).json({
      message,
      error: "rate_limited",
      code: "rate_limited",
    });
  };
}

/** Login de usuario: solo cuenta intentos fallidos. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: limitHandler("Demasiados intentos de inicio de sesión. Intenta más tarde."),
});

/** Registro de cuentas. */
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler("Demasiados registros desde esta IP. Intenta más tarde."),
});

/** Login de administrador: más estricto. */
export const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler: limitHandler("Demasiados intentos de administrador. Intenta más tarde."),
});

/** Escrituras de contenido de usuario (comentarios, likes, listas, historial). */
export const contentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler(
    "Demasiadas acciones seguidas. Espera un momento e intenta de nuevo.",
  ),
});

/** Endpoints de fuentes externas (lectura y escritura). */
export const sourcesLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler(
    "Demasiadas peticiones a fuentes externas. Intenta de nuevo en unos segundos.",
  ),
});

/** Proxy de playback (manifiesto + segmentos DASH). Límite más alto. */
export const playbackLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
  handler: limitHandler(
    "Demasiadas peticiones de reproducción. Intenta de nuevo en unos segundos.",
  ),
});
