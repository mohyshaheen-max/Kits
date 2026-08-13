"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { orders, orderItems, returns, returnItems, refundLogs } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-session";
import { requireAdmin } from "@/lib/session";
import { applyStockMovement } from "@/lib/wms/stock";

export type ReturnRequestState = { error?: string; ok?: boolean };

// Only after delivery, and only the account that placed the order — matches
// the old spec's "returns allowed ONLY after delivery" rule.
export async function requestReturnAction(_prev: ReturnRequestState | undefined, formData: FormData): Promise<ReturnRequestState> {
  const customer = await requireCustomer();
  const orderId = Number(formData.get("order_id"));
  const reason = String(formData.get("reason") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim() || null;
  if (!orderId || !reason) return { error: "Choose a reason for the return." };

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order || order.customerId !== customer.id) return { error: "Order not found." };
  if (order.fulfilmentStatus !== "delivered") return { error: "Returns can only be requested after delivery." };

  const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  const lineQtyById = new Map(lines.map((l) => [l.id, l.qty]));

  const items: { orderItemId: number; qty: number }[] = [];
  for (const line of lines) {
    const raw = String(formData.get(`qty_${line.id}`) ?? "").trim();
    const qty = Number(raw);
    if (qty > 0) {
      const cap = lineQtyById.get(line.id) ?? 0;
      items.push({ orderItemId: line.id, qty: Math.min(qty, cap) });
    }
  }
  if (items.length === 0) return { error: "Select at least one item to return." };

  const [ret] = await db.insert(returns).values({ orderId, reason, message }).returning({ id: returns.id });
  await db.insert(returnItems).values(items.map((i) => ({ returnId: ret.id, orderItemId: i.orderItemId, qty: i.qty })));

  revalidatePath(`/orders/${order.orderNumber}`);
  revalidatePath("/admin/returns");
  return { ok: true };
}

export async function declineReturnAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  const db = getDb();
  await db
    .update(returns)
    .set({ status: "declined", decidedAt: new Date().toISOString(), decidedBy: admin.email })
    .where(eq(returns.id, id));

  revalidatePath(`/admin/returns/${id}`);
  revalidatePath("/admin/returns");
}

// Approve + grade every item in one step: "good" restocks (RETURN
// movement), "damaged"/"rejected" don't. The refund amount is whatever the
// admin enters — no hard-coded partial-refund formula, since "damaged"
// doesn't have one fixed rate in the real world.
export async function approveReturnAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = Number(formData.get("id"));
  const orderId = Number(formData.get("order_id"));
  const refundAmount = Number(formData.get("refund_amount"));
  if (!id || !orderId || !(refundAmount >= 0)) return;

  const db = getDb();
  const items = await db.select().from(returnItems).where(eq(returnItems.returnId, id));

  for (const item of items) {
    const condition = String(formData.get(`condition_${item.id}`) ?? "rejected") as "good" | "damaged" | "rejected";
    await db.update(returnItems).set({ condition }).where(eq(returnItems.id, item.id));

    if (condition === "good") {
      const [orderItem] = await db.select().from(orderItems).where(eq(orderItems.id, item.orderItemId)).limit(1);
      if (orderItem) {
        await applyStockMovement(db, {
          skuId: orderItem.skuId,
          delta: item.qty,
          reason: "RETURN",
          orderId,
          note: `Return #${id} — good condition`,
          createdBy: admin.email,
        });
      }
    }
  }

  await db
    .update(returns)
    .set({ status: "approved", decidedAt: new Date().toISOString(), decidedBy: admin.email })
    .where(eq(returns.id, id));

  if (refundAmount > 0) {
    await db.insert(refundLogs).values({
      orderId,
      returnId: id,
      amount: refundAmount,
      reason: "return",
      createdBy: admin.email,
    });
  }

  revalidatePath(`/admin/returns/${id}`);
  revalidatePath("/admin/returns");
}
