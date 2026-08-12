"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb, type Db } from "@/db";
import { kits, kitItems, skus, orders, orderItems, payments } from "@/db/schema";
import { LABELING_FEE, DELIVERY_FEE, type DeliveryMethod } from "@/lib/pricing";
import { generateOrderNumber } from "@/lib/orders";
import { paymentProvider } from "@/lib/payments/provider";
import { requireAdmin } from "@/lib/session";
import { chunk } from "@/lib/chunk";
import { applyStockMovement, getAvailability } from "@/lib/wms/stock";

export type CheckoutState = { error?: string };

export async function createOrderAction(_prev: CheckoutState | undefined, formData: FormData): Promise<CheckoutState> {
  const kitId = Number(formData.get("kit_id"));
  const delivery = String(formData.get("delivery") ?? "") as DeliveryMethod;
  const labeling = formData.get("labeling") === "1";
  const includedOptionalIds = new Set(
    String(formData.get("included_optional_ids") ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number)
  );
  const parentName = String(formData.get("parent_name") ?? "").trim();
  const parentPhone = String(formData.get("parent_phone") ?? "").trim();
  const parentEmail = String(formData.get("parent_email") ?? "").trim() || null;
  const childName = String(formData.get("child_name") ?? "").trim();
  const childClass = String(formData.get("child_class") ?? "").trim();
  const deliveryAddress = String(formData.get("delivery_address") ?? "").trim() || null;
  const paymentMethod = String(formData.get("payment_method") ?? "") as "CARD" | "COD";

  if (!kitId || !delivery || !(delivery in DELIVERY_FEE)) return { error: "Invalid kit or delivery method." };
  if (!parentName || !parentPhone) return { error: "Parent name and phone are required." };
  if (!childName || !childClass) return { error: "Child's name and class are required." };
  if (delivery === "HOME" && !deliveryAddress) return { error: "Delivery address is required for home delivery." };
  if (paymentMethod !== "CARD" && paymentMethod !== "COD") return { error: "Choose a payment method." };

  const db: Db = getDb();

  const [kit] = await db.select().from(kits).where(and(eq(kits.id, kitId), eq(kits.status, "live"))).limit(1);
  if (!kit) return { error: "This kit is no longer available. Please refresh and try again." };

  const rows = await db
    .select({ item: kitItems, sku: skus })
    .from(kitItems)
    .innerJoin(skus, eq(kitItems.skuId, skus.id))
    .where(eq(kitItems.kitId, kitId));

  const includedRows = rows.filter(({ item }) => item.qty !== null && (!item.isOptional || includedOptionalIds.has(item.id)));
  if (includedRows.length === 0) return { error: "This kit has no items to order." };

  // Reserve at checkout, not at cart: check real availability before writing
  // anything. Never silently drop a line — if stock can't cover it, the
  // whole order is blocked with a clear reason instead.
  const neededBySku = new Map<number, number>();
  for (const { item, sku } of includedRows) {
    neededBySku.set(sku.id, (neededBySku.get(sku.id) ?? 0) + (item.qty as number));
  }
  const availability = await getAvailability(db, Array.from(neededBySku.keys()));
  const shortages: string[] = [];
  for (const { sku } of includedRows) {
    if (shortages.includes(sku.name)) continue;
    const needed = neededBySku.get(sku.id)!;
    const avail = availability.get(sku.id)?.available ?? 0;
    if (needed > avail) shortages.push(sku.name);
  }
  if (shortages.length > 0) {
    return {
      error: `Out of stock: ${shortages.join(", ")}. Please contact us before ordering — we don't want to take an order we can't fulfil.`,
    };
  }

  const subtotal = includedRows.reduce((sum, { item }) => sum + (item.qty as number) * item.unitPrice, 0);
  const labelingFee = labeling && kit.labelingAvailable ? LABELING_FEE : 0;
  const deliveryFee = DELIVERY_FEE[delivery];
  const total = subtotal + labelingFee + deliveryFee;

  const orderNumber = generateOrderNumber();
  const paymentStatus = paymentMethod === "COD" ? "pending_reconciliation" : "paid";

  const [order] = await db
    .insert(orders)
    .values({
      orderNumber,
      schoolId: kit.schoolId,
      gradeId: kit.gradeId,
      kitId: kit.id,
      kitVersion: kit.version,
      parentName,
      parentPhone,
      parentEmail,
      childName,
      childClass,
      subtotal,
      labelingFee,
      deliveryFee,
      total,
      deliveryMethod: delivery,
      deliveryAddress,
      paymentMethod,
      paymentStatus,
      referralSchoolId: kit.schoolId,
    })
    .returning();

  const itemRows = includedRows.map(({ item, sku }) => ({
    orderId: order.id,
    skuId: sku.id,
    qty: item.qty as number,
    unitPrice: item.unitPrice,
    lineTotal: (item.qty as number) * item.unitPrice,
  }));
  for (const batch of chunk(itemRows, 10)) {
    await db.insert(orderItems).values(batch);
  }

  for (const [skuId, qty] of neededBySku) {
    await applyStockMovement(db, {
      skuId,
      delta: qty,
      reason: "RESERVE",
      orderId: order.id,
      note: `Reserved for ${orderNumber}`,
    });
  }

  const intent = await paymentProvider.createIntent(order);
  await db.insert(payments).values({
    orderId: order.id,
    method: paymentMethod,
    amount: total,
    status: paymentStatus,
    providerRef: intent.ref,
    collectedAt: paymentMethod === "CARD" ? new Date().toISOString() : null,
  });

  revalidatePath("/admin/orders");
  redirect(`/orders/${orderNumber}`);
}

export async function reconcilePaymentAction(formData: FormData) {
  const admin = await requireAdmin();
  const paymentId = Number(formData.get("payment_id"));
  const orderId = Number(formData.get("order_id"));
  if (!paymentId || !orderId) return;

  const db = getDb();
  const now = new Date().toISOString();
  await db
    .update(payments)
    .set({ status: "reconciled", reconciledAt: now, reconciledBy: admin.email })
    .where(eq(payments.id, paymentId));
  await db.update(orders).set({ paymentStatus: "paid" }).where(eq(orders.id, orderId));

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

export async function updateFulfilmentStatusAction(formData: FormData) {
  await requireAdmin();
  const orderId = Number(formData.get("order_id"));
  const status = String(formData.get("status") ?? "") as "pending" | "picking" | "packed" | "delivered" | "cancelled";
  if (!orderId || !["pending", "picking", "packed", "delivered", "cancelled"].includes(status)) return;

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) return;

  // Cancelling before pick releases the reservation instead of leaving it
  // stuck holding stock nothing will ever collect.
  if (status === "cancelled" && order.fulfilmentStatus !== "cancelled") {
    const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const line of lines) {
      const unpicked = line.qty - (line.pickedQty ?? 0);
      if (unpicked > 0) {
        await applyStockMovement(db, {
          skuId: line.skuId,
          delta: -unpicked,
          reason: "RELEASE",
          orderId,
          note: `Order cancelled`,
        });
      }
    }
  }

  await db.update(orders).set({ fulfilmentStatus: status }).where(eq(orders.id, orderId));
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}
