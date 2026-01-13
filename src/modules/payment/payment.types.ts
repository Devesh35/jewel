import { Document, Types } from "mongoose";

export enum PaymentMethod {
  CREDIT_CARD = "credit_card",
  DEBIT_CARD = "debit_card",
  UPI = "upi",
  NET_BANKING = "net_banking",
  CASH = "cash",
}

export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface IPayment extends Document {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  metadata?: Map<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentProvider {
  initiatePayment(
    amount: number,
    currency: string,
    metadata?: Record<string, unknown>
  ): Promise<{
    transactionId: string;
    status: PaymentStatus;
    raw: Record<string, unknown>;
  }>;
  verifyPayment(
    transactionId: string
  ): Promise<{ status: PaymentStatus; raw: Record<string, unknown> }>;
}
