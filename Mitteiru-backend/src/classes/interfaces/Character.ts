import type { ObjectId } from "mongodb";

export interface ExtraInformation {
  name: string;
  value: string;
  spoiler: boolean;
}

export interface Character {
  _id?: ObjectId | undefined;
  animeId: string | ObjectId;
  name: string;
  role: string;
  japaneseName: string;
  age: string;
  gender: string;
  height: string;
  extraInformation: ExtraInformation[];
  description: string;
  likes: number;
  image: string;
  relatedAnimes: string[];
}
