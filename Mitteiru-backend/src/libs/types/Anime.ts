import { ObjectId } from "mongodb";

export interface Anime_ {
  _id?: string | ObjectId;
  name: string;
  japaneseName: string;
  synopsis: string;
  releaseYear: string;
  studio: string;
  cover: string;
  image: string;
  onGoing: number;
  createdAt: number;
  horizontalImage: string;
  genres: string[];
  views: number;
  likes: number;
  listId?: string | ObjectId;
  id2?: string | ObjectId;
  /** Fuente externa desde la que se importó el anime (si aplica). */
  sourceId?: string;
  sourceUrl?: string;
  /** Mapeos a fuentes externas; permite varias fuentes por anime local. */
  externalIds?: {
    sourceId: string;
    externalId: string;
    url?: string;
  }[];
  lastSyncedAt?: number;
}
