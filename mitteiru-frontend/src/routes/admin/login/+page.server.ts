import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.adminToken) {
    const me = await serverApi(locals.adminToken).adminMe();
    if (me.admin) throw redirect(302, '/admin');
  }
  return {};
};
