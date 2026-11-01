import type { NextFunction, Request, Response } from "express";
import AdminUser from "../../classes/AdminUser";
import { audit } from "../../libs/logger";

export default async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const login = await AdminUser.login(email, password);

    switch (login.message) {
      case "Credenciales inválidas":
        res.statusCode = 401;
        res.json(login);
        break;
      case "Demasiados intentos. Intenta más tarde.":
        res.statusCode = 429;
        res.json(login);
        break;
      case "success":
        audit("auth.admin.login", {
          requestId: res.locals.requestId,
          ok: true,
        });
        res.statusCode = 200;
        res.json(login);
        break;
      case "An error has occurred":
        res.statusCode = 500;
        res.json({ message: "No se pudo iniciar sesión" });
        break;
      default:
        res.statusCode = 500;
        res.json({ message: "No se pudo iniciar sesión" });
        break;
    }
  } catch (error) {
    next(error);
  }
}
