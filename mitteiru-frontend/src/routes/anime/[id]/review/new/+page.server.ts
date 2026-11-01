import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const { user, profile, profileId } = await parent();

  if (!locals.token || !user?._id) {
    throw redirect(302, '/login');
  }
  if (!profileId || !profile) {
    throw redirect(302, '/selectprofile');
  }

  const animeRes = await serverApi(locals.token).getAnimeById(params.id);

  return {
    anime: animeRes.animes || null,
    profile,
    profileId
  };
};
