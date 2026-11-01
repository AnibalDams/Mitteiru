/**
 * Taxonomía de errores del motor de fuentes.
 *
 * La idea es que las rutas puedan responder con códigos HTTP coherentes sin
 * filtrar detalles internos del sitio ni del transporte.
 */

export type SourceErrorCode =
  | "blocked"
  | "disabled"
  | "not_found"
  | "unavailable"
  | "timeout"
  | "parse"
  | "invalid"
  | "not_supported";

export interface SourceErrorOptions {
  sourceId?: string;
  status?: number;
  retryable?: boolean;
  hint?: string;
  cause?: unknown;
}

export class SourceError extends Error {
  readonly code: SourceErrorCode;
  readonly sourceId?: string;
  readonly status?: number;
  readonly retryable: boolean;
  readonly hint?: string;

  constructor(code: SourceErrorCode, message: string, options: SourceErrorOptions = {}) {
    super(message);
    this.name = "SourceError";
    this.code = code;
    this.sourceId = options.sourceId;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.hint = options.hint;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export class SourceBlockedError extends SourceError {
  constructor(sourceId: string, message: string, hint?: string) {
    super("blocked", message, { sourceId, status: 503, retryable: true, hint });
    this.name = "SourceBlockedError";
  }
}

export class SourceDisabledError extends SourceError {
  constructor() {
    super(
      "disabled",
      "El motor de fuentes externas está deshabilitado en este entorno",
      { status: 404 },
    );
    this.name = "SourceDisabledError";
  }
}

export class SourceNotFoundError extends SourceError {
  constructor(sourceId: string, message = "El recurso no existe en la fuente") {
    super("not_found", message, { sourceId, status: 404 });
    this.name = "SourceNotFoundError";
  }
}

export class SourceUnavailableError extends SourceError {
  constructor(sourceId: string, message: string, status?: number) {
    super("unavailable", message, {
      sourceId,
      status,
      retryable: true,
      hint: "La fuente puede estar caída o bloqueando el acceso. Revisa /sources/:id/health.",
    });
    this.name = "SourceUnavailableError";
  }
}

export class SourceParseError extends SourceError {
  constructor(sourceId: string, message: string) {
    super("parse", message, {
      sourceId,
      status: 502,
      hint: "El HTML de la fuente cambió. Actualiza el parser del adaptador.",
    });
    this.name = "SourceParseError";
  }
}

export class SourceInvalidRequestError extends SourceError {
  constructor(sourceId: string, message: string) {
    super("invalid", message, { sourceId, status: 400 });
    this.name = "SourceInvalidRequestError";
  }
}

export class SourceNotSupportedError extends SourceError {
  constructor(sourceId: string, capability: string) {
    super("not_supported", `La fuente "${sourceId}" no soporta ${capability}`, {
      sourceId,
      status: 501,
    });
    this.name = "SourceNotSupportedError";
  }
}

/** Traduce cualquier excepción a una respuesta segura para el cliente. */
export function toSourceHttpError(error: unknown): {
  status: number;
  body: { message: string; error: string; code: string; hint?: string };
} {
  if (error instanceof SourceError) {
    return {
      status: error.status ?? 502,
      body: {
        message: error.message,
        error: error.code,
        code: error.code,
        ...(error.hint ? { hint: error.hint } : {}),
      },
    };
  }

  return {
    status: 500,
    body: {
      message: "Ocurrió un error inesperado al consultar la fuente externa",
      error: "internal_error",
      code: "internal",
    },
  };
}
