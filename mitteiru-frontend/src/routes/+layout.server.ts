import type { LayoutServerLoad } from './$types';
import { serverApi } from '$lib/server/api';

export const load: LayoutServerLoad = async ({ locals }) => {
  const empty = {
    user: null,
    profileId: null,
    profile: null,
    savedAnimeListsMap: {} as Record<string, string>
  };

  if (!locals.token) return empty;

  const api = serverApi(locals.token);
  const me = await api.getMe();

  if (me.status === 401 || !me.user) return empty;

  const profiles = me.profiles ?? [];
  const profile =
    profiles.find((item: any) => String(item._id) === String(locals.profileId)) ?? null;

  const savedAnimeListsMap: Record<string, string> = {};

  if (profile) {
    const [listsRes, animesRes] = await Promise.all([
      api.getLists(String(profile._id)),
      api.getAnimesInList(String(profile._id))
    ]);

    const lists = listsRes.lists ?? [];
    const listNames = new Map(
      lists.map((list: any) => [String(list._id), String(list.name)])
    );

    for (const item of animesRes.animes ?? []) {
      const animeId = String(item._id || item.animeId);
      const listName = listNames.get(String(item.listId));
      if (animeId && listName) savedAnimeListsMap[animeId] = listName;
    }
  }

  return {
    user: me.user,
    profileId: profile ? String(profile._id) : null,
    profile,
    savedAnimeListsMap
  };
};
