import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import { serverApi } from '$lib/server/api';

export const POST: RequestHandler = async (event) => {
  if (!event.locals.token) {
    return json({ message: 'Sesión requerida', code: 'unauthorized' }, { status: 401 });
  }

  const origin = event.request.headers.get('origin');
  if (origin && origin !== event.url.origin) {
    return json({ message: 'Origen no permitido', code: 'forbidden' }, { status: 403 });
  }

  let payload: { profileId?: unknown };
  try {
    payload = (await event.request.json()) as { profileId?: unknown };
  } catch {
    return json({ message: 'JSON inválido', code: 'invalid_json' }, { status: 400 });
  }

  const profileId = typeof payload.profileId === 'string' ? payload.profileId : '';
  if (!profileId) {
    return json({ message: 'Perfil requerido', code: 'bad_request' }, { status: 400 });
  }

  const me = await serverApi(event.locals.token).getMe();
  const profiles = me.profiles ?? [];
  const profile = profiles.find((item: any) => String(item._id) === String(profileId));

  if (!profile) {
    return json(
      { message: 'No tienes acceso a este perfil', code: 'forbidden' },
      { status: 403 }
    );
  }

  event.cookies.set('profileId', profileId, {
    path: '/',
    httpOnly: true,
    secure: !dev,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30
  });

  return json({ message: 'success', profileId });
};
