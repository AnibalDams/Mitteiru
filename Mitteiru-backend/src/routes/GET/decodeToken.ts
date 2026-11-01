import type { Response, Request } from "express";

export default async function decodeToken(_req: Request, res: Response) {
  res.status(200).json({
    message: "Token decoded",
    user: res.locals.user ?? null,
  });
}
