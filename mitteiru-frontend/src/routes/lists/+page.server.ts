import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ locals, parent }) => {
  const { user, profileId } = await parent();

  if (!locals.token || !user) {
    throw redirect(302, '/login');
  }
  if (!profileId) {
    throw redirect(302, '/selectprofile');
  }

  const api = serverApi(locals.token);
  const [listsRes, animesRes] = await Promise.all([
    api.getLists(profileId),
    api.getAnimesInList(profileId)
  ]);

  return {
    profileId,
    lists: listsRes.lists || [],
    animesInLists: animesRes.animes || []
  };
};
