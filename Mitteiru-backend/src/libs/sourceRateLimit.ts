import { rateLimit } from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate limit para las rutas de fuentes externas.
 * Usa el store en memoria de express-rate-limit (con purga automática) en
 * lugar del Map manual anterior, que crecía sin límite.
 */
const sourceRateLimit = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response): void => {
    res.status(429).json({
      message: "Demasiadas peticiones a fuentes externas, intenta más tarde",
      error: "rate_limited",
      code: "rate_limited",
    });
  },
});

export default sourceRateLimit;
