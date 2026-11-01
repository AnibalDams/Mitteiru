import bcrypt from "bcrypt";
import dbClient from "../libs/dbClient";
import verifyFields from "../libs/fieldsVerifier";
import type ReturnData from "../libs/types/returnData";
import type { AdminUser as IAdminUser } from "./interfaces/AdminUser";
import { ObjectId } from "mongodb";
import { signAdminToken } from "../libs/tokens";

const AdminUserCollection = dbClient.collection<IAdminUser>("adminUser");

export default class AdminUser {
  _id: string;
  email: string;
  password: string;
  accepted: boolean;

  constructor(
    _id: string = "",
    email: string = "",
    password: string = "",
    accepted: boolean = false,
  ) {
    this._id = _id;
    this.email = email;
    this.password = password;
    this.accepted = accepted;
  }

  async new(): Promise<ReturnData> {
    try {
      if (!verifyFields([this.email, this.password])) {
        return { message: "All fields are required" };
      }
      const verifyUser = await AdminUserCollection.findOne({
        email: this.email.trim().toLowerCase(),
      });
      if (verifyUser) {
        return { message: "El administrador ya existe" };
      }
      const password = await bcrypt.hash(this.password, 10);

      await AdminUserCollection.insertOne({
        email: this.email.trim().toLowerCase(),
        password: password,
        accepted: this.accepted,
      });
      return { message: "success" };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }

  static async acceptAdmin(id: string): Promise<ReturnData> {
    try {
      if (!ObjectId.isValid(id)) {
        return { message: "Administrador inválido" };
      }
      const objectId = new ObjectId(id);
      const verifyUser = await AdminUserCollection.findOne({ _id: objectId });
      if (!verifyUser) {
        return { message: "Administrador no encontrado" };
      }
      await AdminUserCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: { accepted: true } },
      );
      return { message: "success" };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }

  static async login(email: string, password: string): Promise<ReturnData> {
    try {
      const verifyUser = await AdminUserCollection.findOne({
        email: email.trim().toLowerCase(),
      });
      if (!verifyUser) {
        return { message: "Credenciales inválidas" };
      }
      if (!verifyUser.accepted) {
        // Mensaje genérico para no revelar si el email existe.
        return { message: "Credenciales inválidas" };
      }

      const now = Date.now();
      if (
        typeof verifyUser.lockedUntil === "number" &&
        verifyUser.lockedUntil > now
      ) {
        return { message: "Demasiados intentos. Intenta más tarde." };
      }

      const match = await bcrypt.compare(password, verifyUser.password);
      if (!match) {
        const attempts = Number(verifyUser.failedLoginAttempts ?? 0) + 1;
        const lockedUntil =
          attempts >= 5 ? now + 15 * 60 * 1000 : verifyUser.lockedUntil ?? null;

        await AdminUserCollection.updateOne(
          { _id: verifyUser._id },
          { $set: { failedLoginAttempts: attempts, lockedUntil } },
        );
        return { message: "Credenciales inválidas" };
      }

      await AdminUserCollection.updateOne(
        { _id: verifyUser._id },
        { $set: { failedLoginAttempts: 0, lockedUntil: null } },
      );

      const token = signAdminToken({
        sub: verifyUser._id.toString(),
        email: verifyUser.email,
        ver: Number(verifyUser.tokenVersion ?? 0),
      });

      return { message: "success", user: token };
    } catch (error: any) {
      return { message: "An error has occurred", error: error.message };
    }
  }

  static async isAdmin(id: string, tokenVersion = 0): Promise<boolean> {
    try {
      const verify = await AdminUserCollection.findOne({
        _id: new ObjectId(id),
      });
      if (!verify) {
        return false;
      }
      if (!verify.accepted) {
        return false;
      }
      if (Number(verify.tokenVersion ?? 0) !== Number(tokenVersion ?? 0)) {
        return false;
      }
      return true;
    } catch (error: any) {
      console.error(error);
      return false;
    }
  }
}
