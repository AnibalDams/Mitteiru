import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { sourcesUiEnabled } from '$lib/server/features';

export const load: PageServerLoad = async ({ locals }) => {
  const api = serverApi(locals.adminToken);
  const animesRes = await api.getAllAnimes();
  return {
    animes: animesRes.animes || [],
    sourcesEnabled: sourcesUiEnabled()
  };
};
