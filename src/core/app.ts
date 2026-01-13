import express from "express";
import { Server } from "http";

import { errorHandler } from "../middlewares/errorHandler";
import { unsupportedRoute } from "../middlewares/routeErrors";
import { rootRouter } from "../routing";
import { logger } from "../utils/logger";

import { connectMongo, disconnectMongo } from "./db";
import { setupPlugins } from "./plugins";

export const createApp = async () => {
  const app = express();

  setupPlugins(app);

  app.use("/", rootRouter);

  await connectMongo();

  app.use("/*any", unsupportedRoute);
  app.use(errorHandler);

  return app;
};

export const shutdownApp = (server: Server) => async () => {
  logger.info("Shutting down gracefully");
  server.close();
  await disconnectMongo();
  process.exit(0);
};
