import dbClient from "../libs/dbClient";
import { Anime } from "./animes";
import type IEpisodeLearningProgress from "./interfaces/EpisodeLearningProgress";
import type ReturnData from "../libs/types/returnData";
import { ObjectId } from "mongodb";
import Episode from "./episodes";

const EpisodeLearningProgressCollection =
  dbClient.collection<IEpisodeLearningProgress>("episodeLearningProgress");

export default class EpisodeLearningProgress {
  episideId: string;
  animeId: string;
  profileId: string;
  score: number;
  notes: string;
  understandingDegree: number;

  constructor(
    episodeId: string,
    animeId: string,
    profileId: string,
    score: number,
    notes: string,
    understandingDegree: number,
  ) {
    this.episideId = episodeId;
    this.animeId = animeId;
    this.profileId = profileId;
    this.score = score;
    this.notes = notes;
    this.understandingDegree = understandingDegree;
  }

  async update(id: string): Promise<boolean> {
    try {
      await EpisodeLearningProgressCollection.findOneAndUpdate(
        { _id: new ObjectId(id), profileId: this.profileId },
        {
          $set: {
            animeId: this.animeId,
            episodeId: this.episideId,
            notes: this.notes,
            score: this.score,
            understandingDegree: this.understandingDegree,
            updatedAt: new Date(),
          },
        },
      );
      return true;
    } catch (error: any) {
      console.error(error);
      return false;
    }
  }

  async add(): Promise<ReturnData> {
    try {
      const doesAlreadyExistARecord =
        await EpisodeLearningProgressCollection.findOne({
          episodeId: this.episideId,
          profileId: this.profileId,
        });
      if (doesAlreadyExistARecord) {
        await this.update(doesAlreadyExistARecord._id.toString());
        return {
          message: "Updated",
          statusCode: 200,
        };
      }
      const doesEpisodeExist = await Episode.checkEpisode(this.episideId);
      if (!doesEpisodeExist) {
        return { message: "This episode does not exist", statusCode: 404 };
      }
      const doesAnimeExist = await Anime.existAnime(this.animeId);
      if (!doesAnimeExist) {
        return { message: "This anime does not exist", statusCode: 404 };
      }
      const episodeLearningProgress = {
        episodeId: this.episideId,
        animeId: this.animeId,
        profileId: this.profileId,
        notes: this.notes,
        score: this.score,
        understandingDegree: this.understandingDegree,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await EpisodeLearningProgressCollection.insertOne(
        episodeLearningProgress,
      );
      return {
        message: "Added",
        statusCode: 201,
      };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has happened",
        error: error.message,
        statusCode: 500,
      };
    }
  }
  static async getEpisodeLearningProgress(
    episodeId: string,
  ): Promise<ReturnData> {
    try {
      const episodeLearningProgress =
        await EpisodeLearningProgressCollection.findOne({
          _id: new ObjectId(episodeId),
        });

      if (!episodeLearningProgress) {
        return {
          message: "Episode learning progress not found",
          statusCode: 404,
        };
      }
      return {
        message: "Success",
        episodeLearningProgress: episodeLearningProgress,
        statusCode: 200,
      };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has happened",
        error: error.message,
        statusCode: 500,
      };
    }
  }
}
