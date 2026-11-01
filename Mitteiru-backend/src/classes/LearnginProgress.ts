import dbClient from "../libs/dbClient";
import type ReturnData from "../libs/types/returnData";
import type ILearningProgress from "./interfaces/LearningProgress";

const LearningProgressCollection =
  dbClient.collection<ILearningProgress>("learningProgress");

export default class LearningProgress {
  data: ILearningProgress;

  constructor(data: ILearningProgress) {
    this.data = data;
  }

  async new(): Promise<ReturnData> {
    try {
      const data = {
        profileId: String(this.data.profileId),
        animeId: String(this.data.animeId),
        notes: this.data.notes ?? "",
        score: this.data.score ?? 0,
        understandingDegree: this.data.understandingDegree ?? 0,
        updatedAt: new Date(),
      };
      const verify = await LearningProgressCollection.findOne({
        profileId: data.profileId,
        animeId: data.animeId,
      });
      if (verify) {
        await LearningProgressCollection.findOneAndUpdate(
          { _id: verify._id },
          { $set: data },
        );
        return { message: "Learning progress already exists" };
      }
      await LearningProgressCollection.insertOne({
        ...data,
        createdAt: new Date(),
      } as ILearningProgress);
      return { message: "success" };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }

  static async get(profileId: string, animeId: string): Promise<ReturnData>{
    try {
      const progress = await LearningProgressCollection.findOne({
        profileId: profileId,
        animeId: animeId,
      });
      if (!progress) {
        return { message: "Learning progress not found" };
      }
      return { message: "success", learningProgress: progress };
    } catch (error:any) {
      return { message: "An error has occurred", error: error.message };
      
    }
  }
}
