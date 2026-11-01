import dbClient from "../libs/dbClient";
import { Anime } from "./animes";
import { ObjectId } from "mongodb";
import type ReturnData from "../libs/types/returnData";
import type { Anime_ as Ianime } from "../libs/types/Anime";

export default class AnimeInList {
  id: string;
  animeId: string;
  listId: string;
  profileId: string;
  constructor(id: string, animeId: string, listId: string, profileId: string) {
    this.id = id;
    this.animeId = animeId;
    this.listId = listId;
    this.profileId = profileId;
  }

  async addToList(): Promise<ReturnData> {
    try {
      await dbClient
        .collection("animeList")
        .insertOne({ animeId: this.animeId, listId: this.listId });
      return { message: "success" };
    } catch (error: any) {
      console.error(error);
      return { message: "An error occurred", error: error.message };
    }
  }

  async removeFromList(): Promise<ReturnData> {
    try {
      await dbClient
        .collection("animeList")
        .findOneAndDelete({ animeId: this.animeId, listId: this.listId });

      return { message: "success" };
    } catch (error: any) {
      console.error(error);

      return { message: "An error occurred", error: error.message };
    }
  }

  async getAll(): Promise<ReturnData> {
    let animes = [];

    try {
      const allLists = await dbClient
        .collection("lists")
        .find({ profileId: new ObjectId(this.profileId) })
        .limit(500)
        .toArray();
      for (let i = 0; i < allLists.length; i++) {
        const list = allLists[i];
        const animesInList = await dbClient
          .collection("animeList")
          .find({ listId: list._id.toString() })
          .limit(1000)
          .toArray();
        for (let i = 0; i < animesInList.length; i++) {
          const animeResult = (
            await new Anime(animesInList[i].animeId.toString()).getById()
          ).animes;
          const anime_ = Array.isArray(animeResult) ? animeResult[0] : animeResult;
          if (!anime_) continue;

          animes.push({
            ...anime_,
            listId: list._id,
            id2: animesInList[i]._id,
          });
        }
      }
      return { message: "success", animes: animes };
    } catch (error: any) {
      console.error(error);
      return { message: "An error occurred", error: error.message };
    }
  }
}
