import { Router } from "express";

import { notFound } from "../middlewares/routeErrors";
import { welcomeRoute } from "../modules/welcome/welcome.routes";

import { apiRouter } from "./apiRouter";

export const rootRouter = Router();

rootRouter.use("/", welcomeRoute);
rootRouter.use("/api", apiRouter);

rootRouter.use("/api/*any", notFound);
