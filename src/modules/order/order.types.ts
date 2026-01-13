import { Document, Types } from "mongoose";

export enum OrderStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export interface IOrderItem {
  productId: Types.ObjectId;
  productName: string;
  quantity: number;
  priceAtOrder: number; // The calculated price at the time of order
  currency: string;
}

export interface IOrder extends Document {
  userId: Types.ObjectId;
  items: IOrderItem[];
  totalAmount: number;
  paidAmount: number;
  currency: string;
  status: OrderStatus;
  paymentIds: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
