import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async () => {
  const api = serverApi();

  const [latestRes, randomRes, popularRes, mostLikedRes] = await Promise.all([
    api.getLatestAnimes(),
    api.getRandomAnime(),
    api.getPopularAnimes(),
    api.getMostLikedAnimes()
  ]);

  const latestAnimes = latestRes.animes || [];
  const featuredAnime = randomRes.animes || latestAnimes[0] || null;
  const popularAnimes = popularRes.animes || [];
  const mostLikedAnimes = mostLikedRes.animes || [];

  return {
    featuredAnime,
    latestAnimes,
    popularAnimes,
    mostLikedAnimes
  };
};
