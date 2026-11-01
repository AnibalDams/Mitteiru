import type { Request, RequestHandler, Response } from "express";
import { ObjectId } from "mongodb";
import AdminUser from "../classes/AdminUser";
import dbClient from "./dbClient";
import { AppError, forbidden, unauthorized } from "./errors";
import { verifyToken, type AuthUser } from "./tokens";

export { signAdminToken, signUserToken, verifyToken } from "./tokens";
export type { AuthUser, Role } from "./tokens";

export interface AdminIdentity {
  sub: string;
  email?: string;
}

export function bearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export function currentUser(res: Response): AuthUser {
  const user = res.locals.user;
  if (!user) throw unauthorized();
  return user;
}

async function currentTokenVersion(userId: string): Promise<number | null> {
  if (!ObjectId.isValid(userId)) return null;
  const user = await dbClient.collection("user").findOne(
    { _id: new ObjectId(userId) },
    { projection: { tokenVersion: 1 } },
  );
  if (!user) return null;
  return Number(user.tokenVersion ?? 0);
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = bearerToken(req);
    if (!token) throw unauthorized("Token requerido");

    const identity = verifyToken(token, "user");
    const version = await currentTokenVersion(identity.sub);
    if (version === null || version !== identity.ver) {
      throw unauthorized("La sesión ya no es válida, vuelve a iniciar sesión");
    }

    res.locals.user = identity;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin: RequestHandler = async (req, res, next) => {
  try {
    const token = bearerToken(req);
    if (!token) throw unauthorized("Token de administrador requerido");

    let identity!: AuthUser;
    try {
      identity = verifyToken(token, "admin");
    } catch (adminError) {
      // Un usuario autenticado pero sin rol admin recibe 403, no 401.
      try {
        verifyToken(token, "user");
        throw forbidden("Requiere permisos de administrador");
      } catch (userError) {
        if (userError instanceof AppError) throw userError;
        throw adminError;
      }
    }

    const isAdmin = await AdminUser.isAdmin(identity.sub, identity.ver);
    if (!isAdmin) throw forbidden("Requiere permisos de administrador");

    res.locals.admin = { sub: identity.sub, email: identity.email };
    next();
  } catch (error) {
    next(error);
  }
};
