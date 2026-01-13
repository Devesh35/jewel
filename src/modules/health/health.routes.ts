import { Router } from "express";

import { getHealth, getLive, getReady } from "./health.controller";

export const healthRoutes = Router();

healthRoutes.get("/", getHealth);
healthRoutes.get("/ready", getReady);
healthRoutes.get("/live", getLive);
