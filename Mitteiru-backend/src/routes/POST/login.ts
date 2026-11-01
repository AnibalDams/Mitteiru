import User from "../../classes/users";
import type { NextFunction, Response, Request } from "express";
import { audit } from "../../libs/logger";

export default async function signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = new User("", email, password);
    const getUser = await user.login();

    switch (getUser.message) {
      case "Credenciales inválidas":
        res.statusCode = 401;
        res.json(getUser);
        break;
      case "success":
        audit("auth.user.login", {
          requestId: res.locals.requestId,
          ok: true,
        });
        res.statusCode = 200;
        res.json(getUser);
        break;
      case "An error has occurred while getting the user":
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
