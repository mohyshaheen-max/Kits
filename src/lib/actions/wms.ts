"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { applyStockMovement } from "@/lib/wms/stock";

export async function confirmPickAction(formData: FormData) {
  const admin = await requireAdmin();
  const orderId = Number(formData.get("order_id"));
  if (!orderId) return;

  const db = getDb();
  const lines = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));

  for (const line of lines) {
    const pickedRaw = formData.get(`picked_qty_${line.id}`);
    const picked = pickedRaw === null || pickedRaw === "" ? line.qty : Math.max(0, Math.min(line.qty, Number(pickedRaw)));
    const substituteSkuId = Number(formData.get(`substitute_sku_${line.id}`)) || null;
    const note = String(formData.get(`note_${line.id}`) ?? "").trim() || null;
    const shortfall = line.qty - picked;

    if (picked > 0) {
      await applyStockMovement(db, {
        skuId: line.skuId,
        delta: -picked,
        reason: "PICK",
        orderId,
        createdBy: admin.email,
        note: `Picked for order`,
      });
    }

    if (shortfall > 0) {
      // The original SKU's reservation for the unfulfilled portion is done
      // either way — release it, whether or not a substitute covers the
      // gap — otherwise it stays stuck holding stock indefinitely.
      await applyStockMovement(db, {
        skuId: line.skuId,
        delta: -shortfall,
        reason: "RELEASE",
        orderId,
        createdBy: admin.email,
        note: substituteSkuId ? "Shortfall covered by substitute" : "Shortfall not substituted",
      });

      if (substituteSkuId) {
        await applyStockMovement(db, {
          skuId: substituteSkuId,
          delta: shortfall,
          reason: "RESERVE",
          orderId,
          createdBy: admin.email,
          note: `Substitute reserve for shortfall`,
        });
        await applyStockMovement(db, {
          skuId: substituteSkuId,
          delta: -shortfall,
          reason: "PICK",
          orderId,
          createdBy: admin.email,
          note: `Substitute pick for shortfall`,
        });
      }
    }

    await db
      .update(orderItems)
      .set({
        pickedQty: picked,
        substitutedSkuId: shortfall > 0 ? substituteSkuId : null,
        substitutionNote: shortfall > 0 ? note : null,
      })
      .where(eq(orderItems.id, line.id));
  }

  await db.update(orders).set({ fulfilmentStatus: "packed" }).where(eq(orders.id, orderId));

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/admin/orders/${orderId}/pack`);
  revalidatePath("/admin/orders");
}
