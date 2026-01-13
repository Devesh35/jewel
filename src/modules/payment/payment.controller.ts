import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { createError } from "../../utils/error";
import { response } from "../../utils/responses";

import { getPaymentById, initiatePayment } from "./payment.service";

export const initiatePaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError(401, "Unauthorized");

    const { orderId, amount, method } = req.body;
    const payment = await initiatePayment(userId, orderId, amount, method);
    response(res, payment, 201);
  }
);

export const getPaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const payment = await getPaymentById(id as string);
    response(res, payment);
  }
);
