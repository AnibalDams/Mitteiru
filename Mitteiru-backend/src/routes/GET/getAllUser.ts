import type { NextFunction, Request, Response } from "express";
import User from "../../classes/users";

export default async function getAllUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit } = req.query;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    if (
      !Number.isInteger(pageNumber) ||
      !Number.isInteger(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      res.statusCode = 400;
      res.json({ message: "page y limit deben ser enteros (limit máximo 100)" });
      return;
    }
    const allUsers = await User.getAll(pageNumber, limitNumber);

    switch (allUsers.message) {
      case "Success":
        res.statusCode = 200;
        res.json(allUsers);
        break;
      case "An error has occurred while getting the users":
        res.statusCode = 500;
        res.json(allUsers);
        break;
    }
  } catch (error) {
    next(error);
  }
}
