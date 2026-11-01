import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.token) {
    const me = await serverApi(locals.token).getMe();
    if (me.user) throw redirect(302, '/selectprofile');
  }
  return {};
};

export const actions: Actions = {
  signup: async ({ request, cookies, getClientAddress }) => {
    const formData = await request.formData();
    const username = String(formData.get('username') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');

    if (!username || !email || !password) {
      return fail(400, { error: 'Campos incompletos' });
    }

    if (password.length < 8) {
      return fail(400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    const api = serverApi(null, getClientAddress());
    const signupRes = await api.signup(username, email, password);

    if (signupRes.status === 429) {
      return fail(429, { error: 'Demasiados registros. Espera unos minutos.' });
    }

    if (signupRes.message !== 'User created successfully') {
      return fail(400, { error: signupRes.message || 'Error al crear la cuenta' });
    }

    // Auto login after signup
    const loginRes = await api.login(email, password);
    if (loginRes.message === 'success' && loginRes.user) {
      cookies.set('session', String(loginRes.user), {
        path: '/',
        httpOnly: true,
        secure: !dev,
        sameSite: 'strict',
        maxAge: 60 * 60 * 12
      });
      cookies.delete('userId', { path: '/' });
      cookies.delete('profileId', { path: '/' });
      throw redirect(302, '/selectprofile');
    }

    throw redirect(302, '/login');
  }
};
