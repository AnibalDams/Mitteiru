import type { RequestHandler } from "express";
import type { z } from "zod";
import { badRequest } from "./errors";

export function validateBody(schema: z.ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      next(
        badRequest(
          "Datos inválidos",
          "validation_error",
          result.error.flatten(),
        ),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: z.ZodTypeAny): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query ?? {});
    if (!result.success) {
      next(
        badRequest(
          "Parámetros inválidos",
          "validation_error",
          result.error.flatten(),
        ),
      );
      return;
    }
    req.query = result.data as typeof req.query;
    next();
  };
}
