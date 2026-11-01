import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { serverApi } from '$lib/server/api';
import { sanitizeNext } from '$lib/utils/redirect';

/** Arma el destino post-login conservando la ruta de origen, si es segura. */
function selectProfilePath(next: string | null): string {
  return next ? `/selectprofile?next=${encodeURIComponent(next)}` : '/selectprofile';
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const next = sanitizeNext(url.searchParams.get('next'));

  if (locals.token) {
    const me = await serverApi(locals.token).getMe();
    if (me.user) throw redirect(302, selectProfilePath(next));
  }

  return { next };
};

export const actions: Actions = {
  login: async ({ request, cookies, getClientAddress }) => {
    const formData = await request.formData();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    // Se revalida en el servidor: el input oculto puede manipularse.
    const next = sanitizeNext(String(formData.get('next') ?? ''));

    if (!email || !password) {
      return fail(400, { error: 'Campos incompletos' });
    }

    const loginRes = await serverApi(null, getClientAddress()).login(email, password);

    if (loginRes.status === 429) {
      return fail(429, { error: 'Demasiados intentos. Espera unos minutos.' });
    }

    if (loginRes.message !== 'success' || !loginRes.user) {
      return fail(400, { error: loginRes.message || 'Credenciales inválidas' });
    }

    // JWT en cookie HttpOnly: JavaScript del navegador nunca lo ve.
    cookies.set('session', String(loginRes.user), {
      path: '/',
      httpOnly: true,
      secure: !dev,
      sameSite: 'strict',
      maxAge: 60 * 60 * 12
    });
    cookies.delete('userId', { path: '/' });
    cookies.delete('profileId', { path: '/' });

    throw redirect(302, selectProfilePath(next));
  }
};
