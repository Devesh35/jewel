import { response } from "../utils/responses";

import type { Request, Response } from "express";

export const notFound = (req: Request, res: Response) =>
  response(res, { message: `Route not found: ${req.originalUrl}` }, 404);

export const unsupported = (req: Request, res: Response) =>
  response(res, { message: `Method not allowed: ${req.method}` }, 405);

export const unsupportedRoute = (req: Request, res: Response) =>
  response(res, { message: `Unsupported route: ${req.originalUrl}` }, 404);
