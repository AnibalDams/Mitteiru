export interface Anime {
  _id: string;
  name: string;
  japaneseName: string;
  synopsis: string;
  releaseYear: string;
  studio: string;
  cover: string;
  image: string;
  horizontalImage?: string;
  onGoing: number; // 1 = releasing, 0 = finished
  genres: string[];
  views?: number;
  likes?: number;
  createdAt?: number;
  sourceId?: string;
  sourceUrl?: string;
  externalIds?: { sourceId: string; externalId: string; url?: string }[];
  lastSyncedAt?: number;
}

export interface EpisodeServer {
  id: string;
  name: string;
  url: string;
  kind: 'embed' | 'hls' | 'mp4' | 'unknown' | 'link' | 'dash';
  language?: string;
  download?: boolean;
}

export type SourceServer = EpisodeServer;

export interface Episode {
  _id: string;
  name: string;
  episodeNumber: number;
  thumbnail: string;
  synopsis: string;
  link: string;
  animeId: string;
  external?: boolean;
  externalUnavailable?: boolean;
  /** JKAnime importado que sigue disponible en producción. */
  legacyPlayback?: boolean;
  profileId?: string;
  isGlobal?: boolean;
  sourceId?: string;
  externalId?: string;
  animeExternalId?: string;
  servers?: EpisodeServer[];
}

export type SourceCapability = 'search' | 'catalog' | 'episodes' | 'servers' | 'streams';
export type SourceHealthStatus = 'ok' | 'degraded' | 'blocked' | 'down';

export interface SourceHealth {
  sourceId: string;
  status: SourceHealthStatus;
  latencyMs: number;
  checkedAt: number;
  message?: string;
  hint?: string;
}

export interface SourceInfo {
  id: string;
  name: string;
  baseUrl: string;
  language: string;
  description: string;
  version: string;
  capabilities: SourceCapability[];
  health?: SourceHealth;
}

export interface SourceAnime {
  sourceId: string;
  externalId: string;
  title: string;
  altTitle?: string;
  poster?: string;
  synopsis?: string;
  year?: string;
  type?: string;
  status: 'ongoing' | 'finished' | 'unknown';
  episodeCount?: number;
  score?: number;
  url: string;
}

export interface SourceAnimeDetails extends SourceAnime {
  genres: string[];
  studio?: string;
  banner?: string;
}

export interface SourceEpisode {
  sourceId: string;
  externalId: string;
  number: number;
  title?: string;
  thumbnail?: string;
  synopsis?: string;
  url?: string;
  airedAt?: string;
  filler?: boolean;
}

export interface SourceImportResult {
  message: string;
  animeId: string;
  createdAnime: boolean;
  episodesImported: number;
  episodesUpdated: number;
  episodesSkipped: number;
  sourceId: string;
  externalId: string;
  warnings: string[];
}

export interface User {
  _id: string;
  username: string;
  email: string;
}

export interface Profile {
  _id: string;
  name: string;
  photo: string;
  userId: string;
}

export interface AnimeList {
  _id: string;
  name: string;
  profileId: string;
}

export interface AnimeInList {
  _id: string;
  animeId: string;
  listId: string;
  profileId: string;
  episodeProgress?: number;
  totalEpisodes?: number;
}

export interface Review {
  _id: string;
  animeId: string;
  title: string;
  review: string;
  profileId: string;
  profileName: string;
  profileImage: string;
  createdAt: number;
}

export interface Character {
  _id: string;
  name: string;
  japaneseName?: string;
  image: string;
  description?: string;
  role?: string;
  animeId: string;
}

export interface Comment {
  _id: string;
  episodeId: string;
  profileId: string;
  profileName: string;
  profileImage: string;
  content: string;
  date: number;
}

export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = any> {
  message: string;
  error?: string;
  status?: number;
  animes?: T;
  anime?: T;
  episodes?: T;
  profiles?: T;
  lists?: T;
  user?: T;
  admin?: T;
  authenticated?: boolean;
  reviews?: T;
  reviewId?: string;
  comments?: T;
  count?: number;
  likesCount?: number;
  pagination?: PaginationData;
  items?: T;
  sources?: T;
  servers?: T;
  health?: T;
  page?: number;
  hasNextPage?: boolean;
  query?: string;
  createdAnime?: boolean;
  animeId?: string;
  sourceId?: string;
  externalId?: string;
  episodesImported?: number;
  episodesUpdated?: number;
  episodesSkipped?: number;
  warnings?: string[];
  code?: string;
  hint?: string;
}
