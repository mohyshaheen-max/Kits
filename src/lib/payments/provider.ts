// The seam a developer plugs Paymob (or Fawry, etc.) into later. Nothing
// outside src/lib/payments/ should know or care which provider is behind
// this interface — the rest of the app talks to PaymentProvider only.

import type { orders } from "@/db/schema";

export type Order = typeof orders.$inferSelect;
export type PaymentStatus = "pending" | "paid" | "pending_reconciliation" | "reconciled" | "failed" | "refunded";

export interface PaymentProvider {
  createIntent(order: Order): Promise<{ redirectUrl?: string; ref: string }>;
  verify(ref: string): Promise<PaymentStatus>;
  refund(ref: string, amount: number): Promise<void>;
}

// Dev-only stub — always succeeds, never touches money. This is what's wired
// up today; swapping in a real provider means implementing PaymentProvider
// and changing the one export below, nothing else in the app should need to
// change.
export class StubProvider implements PaymentProvider {
  async createIntent(order: Order): Promise<{ redirectUrl?: string; ref: string }> {
    return { ref: `stub_${order.orderNumber}` };
  }

  async verify(): Promise<PaymentStatus> {
    return "paid";
  }

  async refund(): Promise<void> {
    // no-op — the stub never actually held money
  }
}

export const paymentProvider: PaymentProvider = new StubProvider();
