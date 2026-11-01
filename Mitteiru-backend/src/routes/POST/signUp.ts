import User from "../../classes/users";
import type { NextFunction, Response, Request } from "express";

export default async function signUp(req: Request, res: Response, next: NextFunction) {
  try {
    const { username, email, password } = req.body;
    const user = new User(username, email, password);
    const createUser = await user.create();

    switch (createUser.message) {
      case "El usuario o email ya está en uso":
        res.statusCode = 409;
        res.json(createUser);
        break;
      case "User created successfully":
        res.statusCode = 201;
        res.json(createUser);
        break;
      case "An error has occurred while creating the user":
        res.statusCode = 500;
        res.json({ message: "No se pudo crear la cuenta" });
        break;
      default:
        res.statusCode = 500;
        res.json({ message: "No se pudo crear la cuenta" });
        break;
    }
  } catch (error) {
    next(error);
  }
}
