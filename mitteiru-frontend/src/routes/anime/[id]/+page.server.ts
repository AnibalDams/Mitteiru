import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { sourcesUiEnabled } from '$lib/server/features';

export const load: PageServerLoad = async ({ params, locals, parent }) => {
  const animeId = params.id;
  const { profileId } = await parent();
  const api = serverApi();

  const [animeRes, episodesRes, reviewsRes] = await Promise.all([
    api.getAnimeById(animeId),
    api.getEpisodes(animeId),
    api.getReviews(animeId)
  ]);

  const userApi = locals.token ? serverApi(locals.token) : null;

  const [listsRes, animesInListsRes] =
    userApi && profileId
      ? await Promise.all([
          userApi.getLists(profileId),
          userApi.getAnimesInList(profileId)
        ])
      : [{ lists: [] }, { animes: [] }];

  const allAnimesInLists = animesInListsRes.animes || [];
  const savedInListIds = allAnimesInLists
    .filter((item: any) => String(item._id || item.animeId) === String(animeId))
    .map((item: any) => String(item.listId));

  return {
    anime: animeRes.animes || null,
    episodes: episodesRes.episodes || [],
    reviews: reviewsRes.reviews || [],
    userLists: listsRes.lists || [],
    savedInListIds,
    profileId: profileId || null,
    sourcesEnabled: sourcesUiEnabled()
  };
};
