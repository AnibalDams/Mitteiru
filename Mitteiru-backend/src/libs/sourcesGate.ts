import type { RequestHandler } from "express";
import { isSourcesEnabled } from "./features";

/**
 * Bloquea todas las rutas del motor de fuentes cuando el entorno no es local.
 * Devuelve 404 (no 403/503) para no revelar que la funcionalidad existe.
 */
export const requireSourcesEnabled: RequestHandler = (_req, res, next) => {
  if (!isSourcesEnabled()) {
    res.status(404).json({
      message: "No encontrado",
      error: "not_found",
      code: "not_found",
    });
    return;
  }
  next();
};
