import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { response } from "../../utils/responses";

import * as ratesService from "./rates.service";

export const updateRates = asyncHandler(async (req: Request, res: Response) => {
  const result = await ratesService.setRate(req.body);
  response(res, result);
});

export const getLatestRates = asyncHandler(
  async (_req: Request, res: Response) => {
    const result = await ratesService.getLatestRates();
    response(res, result);
  }
);

export const getRatesByDate = asyncHandler(
  async (req: Request, res: Response) => {
    const { date } = req.params;
    if (!date) throw { status: 400, message: "Date is required" };
    const result = await ratesService.getRateForDate(date);
    response(res, result);
  }
);
