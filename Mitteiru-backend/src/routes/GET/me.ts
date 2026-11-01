import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import dbClient from "../../libs/dbClient";
import { unauthorized } from "../../libs/errors";

/** Devuelve el usuario autenticado y sus perfiles. */
export async function getMe(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = res.locals.user;
    if (!session || !ObjectId.isValid(session.sub)) {
      throw unauthorized("Sesión inválida");
    }

    const userId = new ObjectId(session.sub);
    const user = await dbClient
      .collection("user")
      .findOne({ _id: userId }, { projection: { password: 0 } });

    if (!user) throw unauthorized("Sesión inválida");

    const profiles = await dbClient
      .collection("profiles")
      .find({ userId })
      .toArray();

    res.status(200).json({ message: "success", user, profiles });
  } catch (error) {
    next(error);
  }
}

/** Devuelve el administrador autenticado (sin hash de contraseña). */
export async function getAdminMe(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const session = res.locals.admin;
    if (!session || !ObjectId.isValid(session.sub)) {
      throw unauthorized("Sesión de administrador inválida");
    }

    const admin = await dbClient
      .collection("adminUser")
      .findOne(
        { _id: new ObjectId(session.sub) },
        { projection: { password: 0 } },
      );

    if (!admin) throw unauthorized("Sesión de administrador inválida");

    res.status(200).json({ message: "success", admin });
  } catch (error) {
    next(error);
  }
}
