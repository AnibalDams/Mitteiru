/**
 * Valida el parámetro `next` de los flujos de autenticación.
 *
 * Solo se aceptan rutas internas del sitio: cualquier valor que pueda sacar al
 * usuario del dominio (open redirect) se descarta devolviendo `null`.
 */
export function sanitizeNext(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null;

  const value = raw.trim();
  if (!value || value.length > 512) return null;

  // Debe ser una ruta absoluta dentro del sitio.
  if (!value.startsWith('/')) return null;

  // "//host" y "/\host" son protocol-relative: el navegador saldría del sitio.
  if (value.startsWith('//') || value.startsWith('/\\')) return null;

  // Saltos de línea y caracteres de control permiten partir la cabecera.
  if (/[\u0000-\u001F\u007F]/.test(value)) return null;

  // Volver a login/signup después de autenticarse solo genera bucles.
  if (/^\/(login|signup)(?:[/?#]|$)/.test(value)) return null;

  return value;
}
