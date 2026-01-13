import { Types } from "mongoose";

import { createError } from "../../utils/error";
import { getProductById } from "../product/product.service";

import { Order } from "./order.model";
import { IOrderItem, OrderStatus } from "./order.types";

export const createOrder = async (
  userId: string,
  items: { productId: string; quantity: number }[]
) => {
  if (!items || items.length === 0) {
    throw createError(400, "Order must have at least one item");
  }

  let totalAmount = 0;
  const orderItems: IOrderItem[] = [];

  for (const item of items) {
    const product = await getProductById(item.productId);

    if (!product) {
      throw createError(404, `Product not found: ${item.productId}`);
    }

    if (product.stock < item.quantity) {
      throw createError(400, `Insufficient stock for product: ${product.name}`);
    }

    // Use the calculated final price from product service
    // product.pricing is populated by getProductById
    const priceAtOrder = product.pricing?.finalPrice || 0;

    orderItems.push({
      productId: new Types.ObjectId(item.productId),
      productName: product.name,
      quantity: item.quantity,
      priceAtOrder,
      currency: product.pricing?.currency || "INR", // Default to INR if not set
    });

    totalAmount += priceAtOrder * item.quantity;
  }

  const order = new Order({
    userId: new Types.ObjectId(userId),
    items: orderItems,
    totalAmount,
    status: OrderStatus.PENDING,
  });

  return await order.save();
};

export const getOrderById = async (orderId: string) => {
  const order = await Order.findById(orderId).populate("items.productId");
  if (!order) {
    throw createError(404, "Order not found");
  }
  return order;
};

export const getUserOrders = async (userId: string) => {
  return await Order.find({ userId }).sort({ createdAt: -1 });
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus
) => {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { status },
    { new: true }
  );
  if (!order) {
    throw createError(404, "Order not found");
  }
  return order;
};
