import { ObjectId } from "mongodb";
import database from "../libs/db";
import dbClient from "../libs/dbClient";
import type ReturnData from "../libs/types/returnData";
import List from "./lists";
import AnimeInList from "./animesInList";
import History from "./history";
export default class Profile {
  id: string;
  name: string;
  photo: string;
  userId: string;

  constructor(
    id: string = "",
    name: string = "",
    photo: string = "",
    userId: string = "",
  ) {
    this.id = id;
    this.name = name;
    this.photo = photo;
    this.userId = userId;
  }

  async new(): Promise<ReturnData> {
    const defaultLists = [
      "Watching",
      "Completed",
      "Planning",
      "Paused",
      "Dropped",
    ];
    try {
      const verifyUser = await dbClient
        .collection("user")
        .findOne({ _id: new ObjectId(this.userId) });
      if (verifyUser == null) {
        return { message: "User not found" };
      }
      const newProfile = await dbClient.collection("profiles").insertOne({
        name: this.name,
        photo: this.photo,
        userId: new ObjectId(this.userId),
      });
      const profileId: any = newProfile.insertedId.toString();
      for (let i = 0; i < defaultLists.length; i++) {
        const listName = defaultLists[i];
        const list = new List("", listName, profileId);
        await list.new();
      }

      return { message: "success" };
    } catch (error: any) {
      return {
        message: "An error has occurred while creating profile",
        error: error.message,
      };
    }
  }

  async getAll(): Promise<ReturnData> {
    try {
      const verifyUser = await dbClient
        .collection("user")
        .findOne({ _id: new ObjectId(this.userId) });
      if (verifyUser == null) {
        return { message: "User not found" };
      }
      const allProfiles = await dbClient
        .collection("profiles")
        .find({ userId: new ObjectId(this.userId) })
        .toArray();
      return { message: "success", profiles: allProfiles };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting all profiles",
        error: error.message,
      };
    }
  }

  async delete(): Promise<ReturnData> {
    try {
      const getLists = new List("", "", this.id);
      const lists: any = (await getLists.getAll()).lists;
      const animesInList = new AnimeInList("", "", "", this.id);
      const animes: any = (await animesInList.getAll()).animes;

      for (const list of lists) {
        for (const anime of animes) {
          await new AnimeInList(
            "",
            anime._id.toString(),
            list._id.toString(),
            this.id,
          ).removeFromList();
        }
        await List.deleteList(list._id);
      }
      await History.deleteFromProfile(new ObjectId(this.id));

      // Cascada de contenido personal: sin esto quedaban comentarios, reseñas
      // y progreso huérfanos después de borrar el perfil.
      const profileObjectId = new ObjectId(this.id);
      const profileKeys = [String(this.id), profileObjectId];

      const likes = await dbClient
        .collection("likes")
        .find({ profileId: profileObjectId })
        .toArray();
      for (const like of likes) {
        if (like.animeId) {
          await dbClient
            .collection("anime")
            .updateOne(
              { _id: like.animeId, likes: { $gt: 0 } },
              { $inc: { likes: -1 } },
            );
        }
      }

      await Promise.all([
        dbClient.collection("likes").deleteMany({ profileId: { $in: profileKeys } }),
        dbClient
          .collection("commentLikes")
          .deleteMany({ profileId: { $in: profileKeys } }),
        dbClient.collection("comments").deleteMany({ profileId: { $in: profileKeys } }),
        dbClient.collection("reviews").deleteMany({ profileId: { $in: profileKeys } }),
        dbClient
          .collection("learningProgress")
          .deleteMany({ profileId: { $in: profileKeys } }),
        dbClient
          .collection("episodeLearningProgress")
          .deleteMany({ profileId: { $in: profileKeys } }),
      ]);

      await dbClient
        .collection("profiles")
        .findOneAndDelete({ _id: profileObjectId });
      return { message: "success" };
    } catch (error: any) {
      return {
        message: "An error has occurred while deleting the profile",
        error: error.message,
      };
    }
  }

  async update(): Promise<ReturnData> {
    try {
      await dbClient.collection("profiles").findOneAndUpdate(
        { _id: new ObjectId(this.id) },
        {
          $set: {
            name: this.name,
            photo: this.photo,
          },
        },
      );
      return { message: "success" };
    } catch (error: any) {
      console.log(error);
      return {
        message: "An error has occurred while updating the profile",
        error: error.message,
      };
    }
  }
}
