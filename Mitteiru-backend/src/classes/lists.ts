import { ObjectId } from "mongodb";
import dbClient from "../libs/dbClient";
import type ReturnData from "../libs/types/returnData";

export default class List {
  id: string;
  name: string;
  profileId: string;

  constructor(id: string, name: string, profileId: string) {
    this.id = id;
    this.name = name;
    this.profileId = profileId;
  }

  async new(): Promise<ReturnData> {
    try {
      const verifyProfile = await dbClient
        .collection("profiles")
        .findOne({ _id: new ObjectId(this.profileId) });
      if (verifyProfile == null) {
        return { message: "profile not found" };
      }
      await dbClient
        .collection("lists")
        .insertOne({
          name: this.name,
          profileId: new ObjectId(this.profileId),
        });
      return { message: "Success" };
    } catch (error: any) {
      return { message: "An error occurred", error: error.message };
    }
  }

  async getAll(): Promise<ReturnData> {
    try {
      const verifyProfile = await dbClient
        .collection("profiles")
        .findOne({ _id: new ObjectId(this.profileId) });
      if (verifyProfile == null) {
        return { message: "Profile not found" };
      }
      const all = await dbClient
        .collection("lists")
        .find({ profileId: new ObjectId(this.profileId) })
        .toArray();
      return { message: "Success", lists: all };
    } catch (error: any) {
      return { message: "An error occurred", error: error.message };
    }
  }
  static async deleteList(id: string) {
    try {
      const verify = await dbClient
        .collection("lists")
        .findOne({ _id: new ObjectId(id) });
      if (!verify) {
        return { message: "List not found" };
      }
      await dbClient.collection("lists").deleteOne({ _id: new ObjectId(id) });
      return { message: "Success" };
    } catch (error: any) {
      return { message: "An error occurred", error: error.message };
    }
  }
}
