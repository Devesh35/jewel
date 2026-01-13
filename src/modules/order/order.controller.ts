import { Request, Response } from "express";

import { asyncHandler } from "../../utils/asyncHandler";
import { createError } from "../../utils/error";
import { response } from "../../utils/responses";

import { createOrder, getOrderById, getUserOrders } from "./order.service";

export const createOrderController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError(401, "Unauthorized");

    const { items } = req.body;
    const order = await createOrder(userId, items);
    response(res, order, 201);
  }
);

export const getOrderController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const order = await getOrderById(id as string);
    // Optional: Check if order belongs to user
    response(res, order);
  }
);

export const getUserOrdersController = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;
    if (!userId) throw createError(401, "Unauthorized");

    const orders = await getUserOrders(userId);
    response(res, orders);
  }
);
