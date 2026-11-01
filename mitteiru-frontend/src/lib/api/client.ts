import type {
  Anime,
  AnimeList,
  ApiResponse,
  Character,
  Comment,
  Episode,
  Profile,
  Review,
  SourceAnime,
  SourceAnimeDetails,
  SourceEpisode,
  SourceHealth,
  SourceImportResult,
  SourceInfo,
  SourceServer
} from '../types';

export interface ApiClientOptions {
  /** Base URL: `/api` en el navegador, URL del backend en el servidor. */
  baseUrl: string;
  /** Token que se inyecta como Bearer (solo en el servidor). */
  token?: string | null;
  /** IP real del cliente para rate limiting detrás del BFF. */
  clientIp?: string;
  fetch?: typeof fetch;
}

/**
 * Cliente HTTP universal. En el navegador siempre apunta a `/api` (proxy
 * same-origin); en el servidor se crea una instancia por petición con el token
 * de la cookie HttpOnly.
 */
export function createApiClient({ baseUrl, token, clientIp, fetch: fetchImpl = fetch }: ApiClientOptions) {
  async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined)
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (clientIp) headers['X-Forwarded-For'] = clientIp;

    try {
      const response = await fetchImpl(url, {
        ...options,
        headers,
        credentials: 'same-origin'
      });

      const text = await response.text();
      let data: Record<string, unknown> = {};
      if (text) {
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          data = {
            message:
              response.status >= 400
                ? 'El servidor devolvió una respuesta no válida'
                : text
          };
        }
      }

      return { ...(data as unknown as ApiResponse<T>), status: response.status };
    } catch (error: unknown) {
      return {
        message: 'Network error or backend unreachable',
        error: error instanceof Error ? error.message : String(error),
        status: 0
      };
    }
  }

  return {
    // Animes
    getLatestAnimes: () => request<Anime[]>('/anime/d/latest'),
    getAllAnimes: () => request<Anime[]>('/anime/d/all'),
    getFilteredAnimes: (params: {
      genre?: string;
      studio?: string;
      year?: string;
      status?: string;
      sort?: string;
      page?: number;
      limit?: number;
    }) => {
      const searchParams = new URLSearchParams();
      if (params.genre) searchParams.set('genre', params.genre);
      if (params.studio) searchParams.set('studio', params.studio);
      if (params.year) searchParams.set('year', params.year);
      if (params.status) searchParams.set('status', params.status);
      if (params.sort) searchParams.set('sort', params.sort);
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      return request<any>(`/anime/d/filtered?${searchParams.toString()}`);
    },
    getAnimeById: (id: string) => request<Anime>(`/anime/${id}`),
    getAnimeFullDetails: (id: string) => request<any>(`/anime/${id}/fullDetails`),
    getPopularAnimes: () => request<Anime[]>('/anime/d/mostPopular'),
    getMostLikedAnimes: () => request<Anime[]>('/anime/d/mostLiked'),
    getRandomAnime: () => request<Anime>('/anime/d/random'),
    getAnimesByGenre: (genre: string) =>
      request<Anime[]>(`/anime/genre/${encodeURIComponent(genre)}`),
    getAnimesByStudio: (studio: string) =>
      request<Anime[]>(`/anime/d/studio/${encodeURIComponent(studio)}`),
    getAnimesByYear: (year: string) =>
      request<Anime[]>(`/anime/d/year/${encodeURIComponent(year)}`),
    getSimilarAnimes: (animeId: string) => request<Anime>(`/anime/${animeId}/similar`),
    getAnimeLikes: (animeId: string) => request<any>(`/anime/${animeId}/likes/count`),
    likeAnime: (animeId: string, profileId: string) =>
      request<any>(`/anime/${animeId}/like/${profileId}`, { method: 'POST' }),

    createAnime: (payload: {
      name: string;
      japaneseName?: string;
      synopsis: string;
      releaseYear: string;
      studio: string;
      cover: string;
      image: string;
      horizontalImage?: string;
      onGoing: number;
      genres: string[];
    }) =>
      request<any>('/anime/new', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    // Genres & Meta
    getAllGenres: () => request<string[]>('/anime/genre/d/all'),
    getAnimeCount: () => request<number>('/anime/d/count'),

    // Episodes
    getEpisodes: (animeId: string) => request<Episode[]>(`/anime/${animeId}/episode/all`),
    createEpisode: (
      animeId: string,
      payload: {
        name: string;
        episodeNumber: number;
        synopsis: string;
        thumbnail: string;
        link: string;
        profileId?: string;
        isGlobal?: boolean;
      }
    ) =>
      request<any>(`/anime/${animeId}/episode/new`, {
        method: 'POST',
        body: JSON.stringify({ ...payload, isGlobal: true })
      }),

    // Reviews
    getReviews: (animeId: string) => request<Review[]>(`/anime/${animeId}/review/all`),
    getReviewById: (animeId: string, reviewId: string) =>
      request<Review>(`/anime/${animeId}/review/${reviewId}`),
    addReview: (
      animeId: string,
      payload: {
        title: string;
        review: string;
        profileId: string;
        profileName?: string;
        profileImage?: string;
      }
    ) =>
      request<any>(`/anime/${animeId}/review/new`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    // Characters
    getCharacters: (animeId: string) => request<Character[]>(`/anime/${animeId}/character/all`),

    // Fuentes externas (scraping estandarizado)
    getSources: (health = false) => request<SourceInfo[]>(`/sources${health ? '?health=true' : ''}`),
    getSourceHealth: (sourceId: string) => request<SourceHealth>(`/sources/${sourceId}/health`),
    searchSource: (sourceId: string, query: string, page = 1) =>
      request<SourceAnime[]>(
        `/sources/${sourceId}/search?q=${encodeURIComponent(query)}&page=${page}`
      ),
    getSourceCatalog: (sourceId: string, sort: 'popular' | 'latest', page = 1) =>
      request<SourceAnime[]>(`/sources/${sourceId}/catalog?sort=${sort}&page=${page}`),
    getSourceAnime: (sourceId: string, externalId: string) =>
      request<SourceAnimeDetails>(`/sources/${sourceId}/anime/${encodeURIComponent(externalId)}`),
    getSourceEpisodes: (sourceId: string, externalId: string) =>
      request<SourceEpisode[]>(
        `/sources/${sourceId}/anime/${encodeURIComponent(externalId)}/episodes`
      ),
    getSourceServers: (sourceId: string, externalId: string, episodeExternalId: string) =>
      request<SourceServer[]>(
        `/sources/${sourceId}/anime/${encodeURIComponent(externalId)}/episode/${encodeURIComponent(episodeExternalId)}/servers`
      ),
    importFromSource: (
      sourceId: string,
      payload: {
        externalId: string;
        importEpisodes?: boolean;
        episodeNumbers?: number[];
        attachToAnimeId?: string;
      }
    ) =>
      request<SourceImportResult>(`/sources/${sourceId}/import`, {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    getAnimeSources: (animeId: string) =>
      request<{ sourceId: string; externalId: string; sourceUrl: string; updatedAt: number }[]>(
        `/anime/${animeId}/sources`
      ),
    refreshEpisodeServers: (episodeId: string) =>
      request<{ servers: SourceServer[]; link: string }>(
        `/anime/episode/${episodeId}/servers/refresh`,
        { method: 'POST' }
      ),

    // Auth
    login: (email: string, password: string) =>
      request<string>('/user/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    signup: (username: string, email: string, password: string) =>
      request<any>('/user/new', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      }),
    decodeToken: (token: string) =>
      request<any>('/user/decode', {
        headers: { Authorization: `Bearer ${token}` }
      }),
    getMe: () => request<any>('/me'),
    userLogout: () => request<any>('/user/logout', { method: 'POST' }),

    // Admin (endpoints same-origin que fijan cookies HttpOnly)
    adminLogin: (email: string, password: string) =>
      request<any>('/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    adminLogout: () => request<any>('/admin/logout', { method: 'POST' }),
    adminSession: () => request<any>('/admin/session'),
    adminMe: () => request<any>('/admin/me'),

    // Profiles
    getProfiles: (userId: string) => request<Profile[]>(`/user/${userId}/profile/d/all`),
    createProfile: (userId: string, name: string, photo: string) =>
      request<any>(`/user/${userId}/profile/d/new`, {
        method: 'POST',
        body: JSON.stringify({ name, photo })
      }),
    updateProfile: (profileId: string, name: string, photo: string) =>
      request<any>(`/user/profile/${profileId}`, {
        method: 'PUT',
        body: JSON.stringify({ name, photo })
      }),
    deleteProfile: (profileId: string) =>
      request<any>(`/user/profile/${profileId}/delete`, { method: 'DELETE' }),

    // Lists
    getLists: (profileId: string) => request<AnimeList[]>(`/user/profile/${profileId}/list/all`),
    createList: (profileId: string, name: string) =>
      request<any>(`/user/profile/${profileId}/list/new`, {
        method: 'POST',
        body: JSON.stringify({ name })
      }),
    getAnimesInList: (profileId: string) =>
      request<any[]>(`/user/profile/${profileId}/list/anime/all`),
    addAnimeToList: (animeId: string, listId: string) =>
      request<any>(`/anime/${animeId}/list/${listId}/add`, { method: 'POST' }),
    removeAnimeFromList: (listId: string, animeId: string) =>
      request<any>(`/user/profile/list/${listId}/anime/${animeId}`, { method: 'DELETE' }),

    // History
    addToHistory: (profileId: string, animeId: string, episodeNumber: number) =>
      request<any>(`/user/profile/${profileId}/history/${animeId}/${episodeNumber}/add`, {
        method: 'POST'
      }),
    getHistory: (profileId: string) => request<any[]>(`/user/profile/${profileId}/history`),

    // Comments
    getComments: (episodeId: string) =>
      request<Comment[]>(`/anime/episode/${episodeId}/comment/all`),
    addComment: (
      episodeId: string,
      payload: {
        profileId: string;
        profileName?: string;
        profileImage?: string;
        content: string;
      }
    ) =>
      request<any>(`/anime/episode/${episodeId}/comment/new`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  };
}

/** Cliente del navegador: siempre same-origin contra el BFF. */
export const api = createApiClient({ baseUrl: '/api' });
