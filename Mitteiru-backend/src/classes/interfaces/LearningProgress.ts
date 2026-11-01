import type { ObjectId } from "mongodb";

export default interface LearningProgress {
  _id?: string | ObjectId;
  score: number;
  understandingDegree: number;
  notes: string;
  profileId: string | ObjectId;
  animeId: string | ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
