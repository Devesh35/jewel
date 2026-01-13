import { Types } from "mongoose";

import { createError } from "../../utils/error";
import { Order } from "../order/order.model";
import { OrderStatus } from "../order/order.types";

import { Payment } from "./payment.model";
import { MockPaymentProvider } from "./payment.provider";
import {
  IPaymentProvider,
  PaymentMethod,
  PaymentStatus,
} from "./payment.types";

const paymentProvider: IPaymentProvider = new MockPaymentProvider(); // We can inject this

export const initiatePayment = async (
  userId: string,
  orderId: string,
  amount: number,
  method: PaymentMethod
) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw createError(404, "Order not found");
  }

  // Validate amount (e.g., prevent overpayment)
  const remainingAmount = order.totalAmount - order.paidAmount;
  if (amount > remainingAmount) {
    // Optional: allow overpayment or throw error. Let's throw for now.
    // Floating point precision might be an issue here, be careful in real apps.
    if (amount - remainingAmount > 0.01) {
      throw createError(400, "Payment amount exceeds remaining order balance");
    }
  }

  const { transactionId, status, raw } = await paymentProvider.initiatePayment(
    amount,
    order.currency,
    { orderId, userId }
  );

  const payment = new Payment({
    orderId: new Types.ObjectId(orderId),
    userId: new Types.ObjectId(userId),
    amount,
    currency: order.currency,
    method,
    status,
    transactionId,
    metadata: new Map(Object.entries(raw)), // Convert Record to Map
  });

  await payment.save();

  // If auto-completed (like in our mock), update order immediately
  if (status === PaymentStatus.COMPLETED) {
    await handleSuccessfulPayment(
      orderId,
      amount,
      payment._id as Types.ObjectId
    );
  }

  return payment;
};

const handleSuccessfulPayment = async (
  orderId: string,
  amount: number,
  paymentId: Types.ObjectId
) => {
  const order = await Order.findById(orderId);
  if (!order) return;

  order.paidAmount += amount;
  order.paymentIds.push(paymentId);

  // Check if fully paid
  if (order.paidAmount >= order.totalAmount - 0.01) {
    // Tolerance
    order.status = OrderStatus.CONFIRMED; // Or COMPLETED
  }

  await order.save();
};

export const getPaymentById = async (id: string) => {
  return await Payment.findById(id);
};
