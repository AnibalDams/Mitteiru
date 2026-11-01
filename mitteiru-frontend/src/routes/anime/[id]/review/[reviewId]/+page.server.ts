import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ params }) => {
  const { id: animeId, reviewId } = params;
  const api = serverApi();

  const [animeRes, reviewRes] = await Promise.all([
    api.getAnimeById(animeId),
    api.getReviewById(animeId, reviewId)
  ]);

  return {
    anime: animeRes.animes || null,
    review: reviewRes.reviews || null
  };
};
