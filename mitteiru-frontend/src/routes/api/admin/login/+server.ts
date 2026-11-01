import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { serverApi } from '$lib/server/api';

function originAllowed(event: Parameters<RequestHandler>[0]): boolean {
  const origin = event.request.headers.get('origin');
  if (origin && origin !== event.url.origin) return false;
  const site = event.request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin' && site !== 'none') return false;
  return true;
}

export const POST: RequestHandler = async (event) => {
  if (!originAllowed(event)) {
    return json({ message: 'Origen no permitido', code: 'forbidden' }, { status: 403 });
  }

  let payload: { email?: unknown; password?: unknown };
  try {
    payload = (await event.request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return json({ message: 'JSON inválido', code: 'invalid_json' }, { status: 400 });
  }

  const email = typeof payload.email === 'string' ? payload.email.trim() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!email || !password) {
    return json({ message: 'Credenciales incompletas', code: 'bad_request' }, { status: 400 });
  }

  const response = await serverApi(null, event.getClientAddress()).adminLogin(email, password);

  if (response.message !== 'success' || !response.user) {
    return json(
      { message: response.message || 'Credenciales inválidas', code: 'unauthorized' },
      { status: 401 }
    );
  }

  // El token de admin nunca llega al JavaScript del navegador.
  event.cookies.set('adminToken', String(response.user), {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'strict',
    maxAge: 60 * 60 * 2
  });

  return json({ message: 'success', authenticated: true });
};
