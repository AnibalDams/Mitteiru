import type { PageServerLoad } from './$types';
import { serverApi } from '$lib/server/api';

export const load: PageServerLoad = async ({ url }) => {
  const genre = url.searchParams.get('genre') || '';
  const studio = url.searchParams.get('studio') || '';
  const year = url.searchParams.get('year') || '';
  const status = url.searchParams.get('status') || '';
  const sort = url.searchParams.get('sort') || 'newest';
  const page = parseInt(url.searchParams.get('page') || '1', 10);

  const api = serverApi();

  const [animesRes, genresRes] = await Promise.all([
    api.getFilteredAnimes({ genre, studio, year, status, sort, page, limit: 15 }),
    api.getAllGenres()
  ]);

  const genresData = Array.isArray(genresRes) ? genresRes : (genresRes as any)?.genres || [];
  const genres = genresData.map((g: any) => g.name).filter(Boolean);

  return {
    animes: animesRes.animes || [],
    genres,
    pagination: animesRes.pagination || {
      currentPage: page,
      totalPages: 1,
      totalItems: 0,
      itemsPerPage: 15,
      hasNextPage: false,
      hasPrevPage: false
    },
    filters: { genre, studio, year, status, sort }
  };
};
