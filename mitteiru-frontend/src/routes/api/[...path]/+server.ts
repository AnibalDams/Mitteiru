import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { API_URL } from '$lib/server/api';
import { sourcesUiEnabled } from '$lib/server/features';

const ALLOWED_PREFIXES = ['/anime', '/user', '/sources', '/character', '/me'];
const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const ADMIN_PATTERNS = [
  /^\/anime\/new$/,
  /^\/anime\/[^/]+\/episode\/new$/,
  /^\/anime\/[^/]+\/character\/new$/,
  /^\/sources\/[^/]+\/import$/,
  /^\/anime\/episode\/[^/]+\/servers\/refresh$/
];

function isAdminPath(path: string, method: string): boolean {
  if (ADMIN_PATTERNS.some((pattern) => pattern.test(path))) return true;

  // Rutas admin que comparten path con GET público: el método decide.
  if (method === 'PUT' && /^\/anime\/[^/]+$/.test(path)) return true;
  if (method === 'PUT' && /^\/anime\/episode\/[^/]+$/.test(path)) return true;
  if (method === 'DELETE' && /^\/anime\/[^/]+$/.test(path)) return true;
  if (method === 'DELETE' && /^\/anime\/episode\/[^/]+$/.test(path)) return true;
  if (method === 'DELETE' && /^\/user\/[^/]+$/.test(path)) return true;
  if (method === 'GET' && path === '/user/d/all') return true;

  return false;
}

function isAllowedPath(path: string): boolean {
  return ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function originAllowed(event: Parameters<RequestHandler>[0]): boolean {
  const origin = event.request.headers.get('origin');
  if (origin && origin !== event.url.origin) return false;

  const site = event.request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;

  return true;
}

const proxy: RequestHandler = async (event) => {
  const path = `/${event.params.path ?? ''}`;

  if (path.includes('..') || path.includes('//')) {
    throw error(400, 'Ruta inválida');
  }

  if (!isAllowedPath(path)) {
    throw error(404, 'Ruta no permitida');
  }

  // El backend también lo bloquea; esto evita que el BFF siquiera lo reenvíe.
  if (
    !sourcesUiEnabled() &&
    (path === '/sources' ||
      path.startsWith('/sources/') ||
      /^\/anime\/[^/]+\/sources$/.test(path) ||
      /^\/anime\/episode\/[^/]+\/servers\/refresh$/.test(path))
  ) {
    throw error(404, 'Ruta no permitida');
  }

  const method = event.request.method.toUpperCase();
  if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    throw error(405, 'Método no permitido');
  }

  if (MUTATING.has(method) && !originAllowed(event)) {
    throw error(403, 'Origen no permitido');
  }

  const adminPath = isAdminPath(path, method);
  const token = adminPath ? event.locals.adminToken : event.locals.token;

  // Las rutas de administración nunca se reenvían sin sesión de admin.
  if (adminPath && !token) {
    return json(
      { message: 'Requiere sesión de administrador', code: 'unauthorized' },
      { status: 401 }
    );
  }

  const headers = new Headers();
  // IP real para que el rate limit del backend no sea global al BFF.
  // Requiere TRUST_PROXY=1 (o el CIDR del BFF) en el backend.
  try {
    headers.set('x-forwarded-for', event.getClientAddress());
  } catch {
    // Sin IP disponible (por ejemplo, adapter sin socket): se omite.
  }
  const contentType = event.request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  headers.set('accept', event.request.headers.get('accept') ?? 'application/json');
  const range = event.request.headers.get('range');
  if (range) headers.set('range', range);
  const ifRange = event.request.headers.get('if-range');
  if (ifRange) headers.set('if-range', ifRange);
  if (token) headers.set('authorization', `Bearer ${token}`);

  let body: ArrayBuffer | undefined;
  if (MUTATING.has(method)) {
    body = await event.request.arrayBuffer();
    if (body.byteLength > 2_000_000) {
      throw error(413, 'Cuerpo de la petición demasiado grande');
    }
  }

  const target = `${API_URL}${path}${event.url.search}`;

  let response: Response;
  try {
    response = await fetch(target, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(30_000)
    });
  } catch {
    return json(
      { message: 'No se pudo contactar al backend', code: 'upstream_unavailable' },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  for (const name of [
    'content-type',
    'content-length',
    'content-range',
    'accept-ranges'
  ]) {
    const value = response.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }
  const isPlayback = path.startsWith('/sources/animeonsen/playback/');
  responseHeaders.set(
    'cache-control',
    isPlayback ? (response.headers.get('cache-control') ?? 'no-store') : 'no-store'
  );

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders
  });
};

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
