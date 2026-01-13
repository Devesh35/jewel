import { Router } from "express";

import { authenticate, requireAdmin } from "../../middlewares/auth.middleware";

import * as ratesController from "./rates.controller";

export const ratesRouter = Router();

ratesRouter.use(authenticate);

// Define routes

ratesRouter.post("/", requireAdmin, ratesController.updateRates);
ratesRouter.get("/latest", ratesController.getLatestRates);
ratesRouter.get("/:date", ratesController.getRatesByDate);
