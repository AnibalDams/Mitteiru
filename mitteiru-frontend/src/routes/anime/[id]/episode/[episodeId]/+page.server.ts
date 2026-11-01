import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';
import { sourcesUiEnabled } from '$lib/server/features';

export const load: PageServerLoad = async ({ params, parent }) => {
  const animeId = params.id;
  const episodeId = params.episodeId;
  const { profileId, profile } = await parent();
  const api = serverApi();

  const [animeRes, episodesRes, commentsRes] = await Promise.all([
    api.getAnimeById(animeId),
    api.getEpisodes(animeId),
    api.getComments(episodeId)
  ]);

  const episodes = episodesRes.episodes || [];
  const episode =
    episodes.find((ep: any) => String(ep._id) === String(episodeId)) || episodes[0];

  return {
    anime: animeRes.animes || null,
    episodes,
    episode,
    comments: commentsRes.comments || [],
    profileId: profileId || null,
    profileName: profile?.name || null,
    profileImage: profile?.photo || null,
    sourcesEnabled: sourcesUiEnabled()
  };
};
