import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { serverApi } from '$lib/server/api';

function originAllowed(request: Request, origin: string): boolean {
  const requestOrigin = request.headers.get('origin');
  if (requestOrigin && requestOrigin !== origin) return false;

  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;

  return true;
}

export const POST: RequestHandler = async ({ request, cookies, url, locals }) => {
  if (!originAllowed(request, url.origin)) {
    throw error(403, 'Origen no permitido');
  }

  // Invalida el token en el backend; si falla, igual se borra la cookie.
  if (locals.token) {
    try {
      await serverApi(locals.token).userLogout();
    } catch {
      // La cookie local se elimina de todos modos.
    }
  }

  cookies.delete('session', { path: '/' });
  cookies.delete('profileId', { path: '/' });
  throw redirect(303, '/login');
};

export const GET: RequestHandler = async () => {
  throw redirect(303, '/');
};
