import { asyncHandler } from "../../utils/asyncHandler";
import { response } from "../../utils/responses";

import { getHealthStatus, getLiveness, getReadiness } from "./health.service";

import type { Request, Response } from "express";

export const getHealth = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getHealthStatus();
  response(res, data, 200);
});

export const getReady = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getReadiness();
  response(res, data, 200);
});

export const getLive = asyncHandler(async (_req: Request, res: Response) => {
  const data = getLiveness();
  response(res, data, 200);
});
