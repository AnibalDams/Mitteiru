import dbClient from "../libs/dbClient";
import bcrypt from "bcrypt";
import type ReturnData from "../libs/types/returnData";
import { ObjectId } from "mongodb";
import Profile from "./profiles";
import { signUserToken, verifyToken } from "../libs/tokens";

const userCollection = dbClient.collection("user");

export default class User {
  username: string;
  email: string;
  password: string;

  constructor(username: string, email: string, password: string) {
    this.username = username;
    this.email = email;
    this.password = password;
  }

  async create(): Promise<ReturnData> {
    try {
      const normalizedEmail = this.email.trim().toLowerCase();
      const normalizedUsername = this.username.trim();
      const password = await bcrypt.hash(this.password, 10);
      const username = await userCollection.findOne({
        username: normalizedUsername,
      });
      if (username != null) {
        return { message: "El usuario o email ya está en uso" };
      }
      const email = await userCollection.findOne({ email: normalizedEmail });
      if (email != null) {
        return { message: "El usuario o email ya está en uso" };
      }
      await userCollection.insertOne({
        username: normalizedUsername,
        email: normalizedEmail,
        password: password,
      });

      return { message: "User created successfully" };
    } catch (error: any) {
      return {
        message: "An error has occurred while creating the user",
        error: error.message,
      };
    }
  }

  async login(): Promise<ReturnData> {
    try {
      const user = await userCollection.findOne({
        email: this.email.trim().toLowerCase(),
      });
      if (user == null) {
        return { message: "Credenciales inválidas" };
      }
      const match = await bcrypt.compare(this.password, user.password);
      if (match) {
        const token = signUserToken({
          sub: user._id.toString(),
          email: user.email,
          username: user.username,
          ver: Number(user.tokenVersion ?? 0),
        });
        return { message: "success", user: token };
      }
      return { message: "Credenciales inválidas" };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting the user",
        error: error.message,
      };
    }
  }
  decodeToken(token: string): ReturnData {
    try {
      const tokenInfo = verifyToken(token, "user");
      return { message: "Success", user: tokenInfo };
    } catch {
      return { message: "Token inválido o expirado" };
    }
  }

  static async getAll(page: number, limit: number): Promise<ReturnData> {
    try {
      const pageFormatter = page == 1 ? 0 : (page - 1) * limit;

      const users = await userCollection
        .find({}, { projection: { password: 0 } })
        .skip(pageFormatter)
        .limit(limit)
        .toArray();
      return { message: "Success", user: users };
    } catch (error: any) {
      return {
        message: "An error has occurred while getting the users",
        error: error.message,
      };
    }
  }

  static async deleteUser(id: string) {
    try {
      if (!ObjectId.isValid(id)) {
        return { message: "Usuario inválido" };
      }
      const objectId = new ObjectId(id);
      const verify = await userCollection.findOne({ _id: objectId });
      if (!verify) {
        return { message: "User not found" };
      }
      const profiles = (await new Profile("", "", "", id).getAll()).profiles;

      if (profiles && profiles.length > 0) {
        for (const profile of profiles) {
          await new Profile(profile._id.toString(), "", "", "").delete();
        }
      }

      await userCollection.deleteOne({ _id: objectId });

      return { message: "User deleted successfully" };
    } catch (error: any) {
      return {
        message: "An error has occurred while deleting the user",
        error: error.message,
      };
    }
  }
}
