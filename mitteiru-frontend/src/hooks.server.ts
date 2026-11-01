import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';

/**
 * Carga la sesión desde cookies HttpOnly en `locals` y aplica cabeceras de
 * seguridad. La autorización real la valida el backend en cada petición.
 */
export const handle: Handle = async ({ event, resolve }) => {
  event.locals.token = event.cookies.get('session') ?? null;
  event.locals.adminToken = event.cookies.get('adminToken') ?? null;
  event.locals.profileId = event.cookies.get('profileId') ?? null;
  event.locals.user = null;
  event.locals.profile = null;

  const response = await resolve(event);

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (!dev) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
};
