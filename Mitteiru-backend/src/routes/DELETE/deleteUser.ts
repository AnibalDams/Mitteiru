import type { NextFunction, Request, Response } from "express";
import User from "../../classes/users";
import { audit } from "../../libs/logger";

export default async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const deleteU = await User.deleteUser(id);
    switch (deleteU.message) {
      case "User deleted successfully":
        audit("admin.user.delete", {
          requestId: res.locals.requestId,
          ok: true,
        });
        res.statusCode = 200;
        res.json(deleteU);
        break;
      case "An error has occurred while deleting the user":
        res.statusCode = 500;
        res.json(deleteU);
        break;
    }
  } catch (error) {
    next(error);
  }
}
