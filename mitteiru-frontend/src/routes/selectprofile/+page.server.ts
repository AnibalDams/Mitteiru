import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/server/api';
import { sanitizeNext } from '$lib/utils/redirect';

/** Conserva la ruta de origen al mandar a login por falta de sesión. */
function loginPath(next: string | null): string {
  return next ? `/login?next=${encodeURIComponent(next)}` : '/login';
}

export const load: PageServerLoad = async ({ locals, url }) => {
  const next = sanitizeNext(url.searchParams.get('next'));

  if (!locals.token) {
    throw redirect(302, loginPath(next));
  }

  const me = await serverApi(locals.token).getMe();

  if (me.status === 401 || !me.user) {
    throw redirect(302, loginPath(next));
  }

  return {
    user: me.user,
    profiles: me.profiles ?? [],
    next
  };
};
