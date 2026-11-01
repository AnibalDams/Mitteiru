import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ url }) => {
  const query = url.searchParams.get('q') || '';
  const api = serverApi();
  const res = await api.getAllAnimes();
  const allAnimes = res.animes || [];

  const queryLower = query.toLowerCase();
  const filtered = query
    ? allAnimes.filter((a) =>
        a.name?.toLowerCase().includes(queryLower) ||
        a.japaneseName?.toLowerCase().includes(queryLower) ||
        a.synopsis?.toLowerCase().includes(queryLower) ||
        a.genres?.some((g) => g.toLowerCase().includes(queryLower))
      )
    : [];

  return {
    query,
    results: filtered
  };
};
