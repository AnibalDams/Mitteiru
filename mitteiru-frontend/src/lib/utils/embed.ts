/**
 * Validación de URLs de embeds/reproductores.
 *
 * Reglas:
 * - Rutas locales (`/...`) siempre permitidas, salvo `//host` y `/\host`.
 * - URLs externas solo si `allowExternal` está activo y el host está en la
 *   allowlist. Allowlist vacía = ningún host externo (deny by default).
 * - Solo http/https; nunca `javascript:`, `data:`, `blob:` en iframes.
 */

export interface EmbedOptions {
  allowExternal: boolean;
  allowedHosts: string[];
}

function isLocalPath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\');
}

export function sanitizeEmbedSrc(value: string | undefined | null, options: EmbedOptions): string {
  const src = (value ?? '').trim();
  if (!src) return '';
  if (isLocalPath(src)) return src;
  if (!options.allowExternal) return '';

  try {
    const url = new URL(src);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';

    const host = url.hostname.toLowerCase();
    const allowed = options.allowedHosts.some(
      (candidate) => host === candidate || host.endsWith(`.${candidate}`)
    );

    return allowed ? url.toString() : '';
  } catch {
    return '';
  }
}

/** URLs para `<video>`/DASH: locales o http(s) si el playback externo está activo. */
export function sanitizeMediaSrc(
  value: string | undefined | null,
  allowExternal: boolean
): string {
  const src = (value ?? '').trim();
  if (!src) return '';
  if (isLocalPath(src)) return src;
  if (!allowExternal) return '';

  try {
    const url = new URL(src);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.toString();
  } catch {
    // inválida
  }
  return '';
}

/** Solo rutas locales; usado por el reproductor DASH. */
export function isLocalPlaybackSrc(value: string | undefined | null): boolean {
  return isLocalPath((value ?? '').trim());
}
