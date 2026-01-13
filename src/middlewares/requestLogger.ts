import morgan from "morgan";

import { appConfig } from "../config/env";

import type { RequestHandler } from "express";

const skipHealth = (path: string) => path.startsWith("/api/v1/health");

export const requestLogger = (): RequestHandler =>
  morgan(appConfig.isProduction ? "combined" : "dev", {
    skip: (req) => appConfig.isProduction && skipHealth(req.path),
  });
