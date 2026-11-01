import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { serverApi } from '$lib/server/api';
import type { ApiResponse } from '$lib/types';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
  const { user, profileId } = await parent();

  if (!locals.token || !user) {
    throw redirect(302, '/login');
  }
  if (!profileId) {
    throw redirect(302, '/selectprofile');
  }

  // Read filter params from URL for initial client state
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const range = url.searchParams.get('range');

  const historyRes = await serverApi(locals.token).getHistory(profileId);

  // API returns array of {date: string, animes: Anime[]} - flatten preserving date
  const response = historyRes as ApiResponse<any[]> & { history?: any[] };
  const groupedHistory =
    response.animes || response.lists || response.history || (Array.isArray(historyRes) ? historyRes : []);

  // Flatten: each anime gets its group's date as watchedAt
  const history: any[] = [];
  if (Array.isArray(groupedHistory)) {
    for (const group of groupedHistory) {
      const groupDate = group.date ? new Date(group.date).getTime() : Date.now();
      const animes = group.animes || [];
      for (const anime of animes) {
        history.push({
          ...anime,
          watchedAt: groupDate,
          episodeNumber: anime.episodeNumber || anime.episode || 1
        });
      }
    }
  }

  history.sort((a, b) => b.watchedAt - a.watchedAt);

  return {
    profileId,
    history,
    filters: { from, to, range: range || 'all' }
  };
};
