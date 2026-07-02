import { Request, Response } from "express";

export const notFound = (req: Request, res: Response) => {
  res.status(404).json({
    message: "The requested resource was not found on this server.",
    status: 404,
    error: "Not Found",
    path: req.originalUrl,
    date: Date(),
  });
};
