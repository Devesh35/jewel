import { IPaymentProvider, PaymentStatus } from "./payment.types";

export class MockPaymentProvider implements IPaymentProvider {
  async initiatePayment(
    amount: number,
    currency: string,
    _metadata?: Record<string, unknown>
  ): Promise<{
    transactionId: string;
    status: PaymentStatus;
    raw: Record<string, unknown>;
  }> {
    // Simulate API call
    console.log(`[MockPayment] Initiating payment for ${currency} ${amount}`);

    // In a real scenario, this would return a pending status and a redirect URL
    // For this mock, we'll auto-complete it for simplicity, OR keep it pending if we want to test verify flow.
    // Let's assume it succeeds immediately for now.

    return {
      transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: PaymentStatus.COMPLETED,
      raw: { mock: true, success: true },
    };
  }

  async verifyPayment(
    transactionId: string
  ): Promise<{ status: PaymentStatus; raw: Record<string, unknown> }> {
    console.log(`[MockPayment] Verifying transaction ${transactionId}`);
    return {
      status: PaymentStatus.COMPLETED,
      raw: { mock: true, verified: true },
    };
  }
}
