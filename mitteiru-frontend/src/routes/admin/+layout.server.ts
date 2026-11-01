import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/server/api';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // La propia página de login no debe quedar atrapada por el guard.
  if (url.pathname === '/admin/login') {
    return { admin: null };
  }

  if (!locals.adminToken) {
    throw redirect(302, '/admin/login');
  }

  const me = await serverApi(locals.adminToken).adminMe();

  if (me.status === 401 || !me.admin) {
    throw redirect(302, '/admin/login');
  }

  return { admin: me.admin };
};
