import type { ErrorRequestHandler, RequestHandler } from "express";

/**
 * Error de aplicación con un mensaje seguro para el cliente.
 * El detalle interno se registra en logs, nunca se serializa en la respuesta.
 */
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly publicMessage: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    code: string,
    publicMessage: string,
    options: { cause?: unknown; details?: unknown } = {},
  ) {
    super(publicMessage);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.publicMessage = publicMessage;
    this.details = options.details;
    if (options.cause !== undefined) this.cause = options.cause;
  }
}

export function badRequest(
  message = "Solicitud inválida",
  code = "bad_request",
  details?: unknown,
): AppError {
  return new AppError(400, code, message, { details });
}

export function unauthorized(message = "Autenticación requerida"): AppError {
  return new AppError(401, "unauthorized", message);
}

export function forbidden(message = "No tienes permisos para esta acción"): AppError {
  return new AppError(403, "forbidden", message);
}

export function notFound(message = "Recurso no encontrado"): AppError {
  return new AppError(404, "not_found", message);
}

export function conflict(message = "El recurso ya existe"): AppError {
  return new AppError(409, "conflict", message);
}

export function tooManyRequests(message = "Demasiadas peticiones"): AppError {
  return new AppError(429, "rate_limited", message);
}

/** Envuelve un handler async para que los rechazos lleguen al error handler. */
export function asyncHandler(
  handler: RequestHandler,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    message: "Ruta no encontrada",
    error: "not_found",
    code: "not_found",
  });
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  const requestId = typeof res.locals.requestId === "string"
    ? res.locals.requestId
    : "unknown";

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      console.error(JSON.stringify({
        level: "error",
        event: "app_error",
        requestId,
        code: error.code,
        message: error.message,
        stack: error.stack,
      }));
    }
    res.status(error.statusCode).json({
      message: error.publicMessage,
      error: error.code,
      code: error.code,
      requestId,
      ...(error.details !== undefined ? { details: error.details } : {}),
    });
    return;
  }

  console.error(JSON.stringify({
    level: "error",
    event: "unhandled_error",
    requestId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  }));

  res.status(500).json({
    message: "Error interno del servidor",
    error: "internal_error",
    code: "internal",
    requestId,
  });
};
