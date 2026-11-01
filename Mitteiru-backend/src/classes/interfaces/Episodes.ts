import type { ObjectId } from "mongodb";

export interface EpisodeServer {
  id: string;
  name: string;
  url: string;
  kind: "embed" | "hls" | "mp4" | "unknown" | "link" | "dash";
  language?: string;
  download?: boolean;
}

export interface Episode {
  _id?: ObjectId | undefined;
  name: string;
  synopsis: string;
  thumbnail: string;
  link: string;
  animeId: string | ObjectId;
  episodeNumber: number;
  profileId?:string;
  isGlobal:boolean;
  external: boolean;
  /** Metadatos de origen externo (opcionales, no rompen episodios manuales). */
  sourceId?: string;
  externalId?: string;
  animeExternalId?: string;
  servers?: EpisodeServer[];
  createdAt?: number;
  updatedAt?: number;
}
