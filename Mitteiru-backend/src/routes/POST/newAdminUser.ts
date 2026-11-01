import type { NextFunction, Request, Response } from "express";
import AdminUser from "../../classes/AdminUser";
import { audit } from "../../libs/logger";

export default async function newAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    // Un admin autenticado crea administradores ya habilitados.
    const newAUser = await new AdminUser("", email, password, true).new();

    switch (newAUser.message) {
      case "El administrador ya existe":
        res.statusCode = 409;
        res.json(newAUser);
        break;
      case "success":
        audit("admin.create", {
          requestId: res.locals.requestId,
          ok: true,
        });
        res.statusCode = 201;
        res.json(newAUser);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json({ message: "No se pudo crear el administrador" });
        break;
      default:
        res.statusCode = 500;
        res.json({ message: "No se pudo crear el administrador" });
        break;
    }
  } catch (error) {
    next(error);
  }
}
