import { ObjectId } from "mongodb";
import database from "../libs/db";
import dbClient from "../libs/dbClient";
import type ReturnData from "../libs/types/returnData";
import moment from "moment";
import { Anime } from "./animes";

const historyCollection = dbClient.collection("history");

export default class History {
  id: string;
  animeId: string;
  episodeNumber: number;
  profileId: string;
  date: number;

  constructor(
    id: string,
    animeId: string,
    episodeNumber: number,
    date: number,
    profileId: string,
  ) {
    this.id = id;
    this.animeId = animeId;
    this.episodeNumber = episodeNumber;
    this.date = date;
    this.profileId = profileId;
  }

  async add(): Promise<ReturnData> {
    try {
      const today = new Date().getTime();
      const todayString = new Date(today).toISOString().substring(0, 10);

      const isThereAnime: any = await historyCollection
        .find({
          profileId: new ObjectId(this.profileId),
          animeId: new ObjectId(this.animeId),
        })
        .toArray();

      const dates: any = {};
      for (let i = 0; i < isThereAnime.length; i++) {
        const anime = isThereAnime[i];
        const animeDate = new Date(anime.date).toISOString().substring(0, 10);
        dates[animeDate] = animeDate;
      }
      if (!dates[todayString]) {
        await historyCollection.insertOne({
          animeId: new ObjectId(this.animeId),
          episodeNumber: this.episodeNumber,
          date: today,
          profileId: new ObjectId(this.profileId),
        });
      }

      return { message: "Success" };
    } catch (error: any) {
      console.error(error);
      return {
        message: "An error has occurred while adding the History",
        error: error.message,
      };
    }
  }

  async get(): Promise<ReturnData> {
    try {
      const getHistory = await historyCollection
        .find({ profileId: new ObjectId(this.profileId) })
        .sort({ date: -1 })
        .limit(500)
        .toArray();

      const history: any = [];

      if (getHistory.length > 0) {
        for (let i = 0; i < getHistory.length; i++) {
          const animeH = getHistory[i];
          const anime = await new Anime(animeH.animeId).getById();
          history.push({ date: animeH.date, ...anime.animes });
        }
      }
      const dates: any = [];
      for (let i = 0; i < history.length; i++) {
        const log: any = history[i];
        const date = new Date(log.date).toISOString();

        if (!dates.find((e: any) => e.date === date.substring(0, 10))) {
          dates.push({ date: date.substring(0, 10), animes: [] });
        }
      }
      for (let i = 0; i < history.length; i++) {
        const log: any = history[i];
        const date = new Date(log.date).toISOString();
        if (dates.find((e: any) => e.date === date.substring(0, 10))) {
          const index = dates.findIndex(
            (e: any) => e.date === date.substring(0, 10),
          );
          dates[index].animes.push(log);
        }
      }

      return { message: "Success", animes: dates };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting the History",
        error: error.message,
      };
    }
  }

  static async delete(id: string): Promise<ReturnData> {
    try {
      const verify = await historyCollection.findOne({ _id: new ObjectId(id) });
      if (!verify) {
        return { message: "History log not found" };
      }
      await historyCollection.deleteOne({ _id: new ObjectId(id) });
      return { message: "Success" };
    } catch (error: any) {
      return {
        message: "An error has occurred while deleting the History",
        error: error.message,
      };
    }
  }

  static async deleteFromProfile(profileId: ObjectId): Promise<ReturnData> {
    try {
      const verify = await historyCollection
        .find({ profileId: profileId })
        .toArray();
      if (!verify || verify.length === 0) {
        return { message: "History not found" };
      }
      for (const history of verify) {
        await historyCollection.deleteOne({ _id: history._id });
      }
      return { message: "Success" };
    } catch (error: any) {
      return {
        message: "An error has occurred while deleting the History",
        error: error.message,
      };
    }
  }
}
