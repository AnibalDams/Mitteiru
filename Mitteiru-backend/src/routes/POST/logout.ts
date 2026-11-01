import type { NextFunction, Request, Response } from "express";
import { ObjectId } from "mongodb";
import dbClient from "../../libs/dbClient";
import { currentUser } from "../../libs/auth";
import { unauthorized } from "../../libs/errors";

/** Invalida todas las sesiones del usuario incrementando tokenVersion. */
export async function logoutUser(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const user = currentUser(res);
    await dbClient
      .collection("user")
      .updateOne(
        { _id: new ObjectId(user.sub) },
        { $inc: { tokenVersion: 1 } },
      );
    res.status(200).json({ message: "success" });
  } catch (error) {
    next(error);
  }
}

/** Invalida todas las sesiones del administrador. */
export async function logoutAdmin(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const admin = res.locals.admin as { sub?: string } | undefined;
    if (!admin?.sub) throw unauthorized();

    await dbClient
      .collection("adminUser")
      .updateOne(
        { _id: new ObjectId(admin.sub) },
        { $inc: { tokenVersion: 1 } },
      );
    res.status(200).json({ message: "success" });
  } catch (error) {
    next(error);
  }
}
