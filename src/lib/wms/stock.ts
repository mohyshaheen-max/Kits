import { eq, sql, inArray } from "drizzle-orm";
import type { Db } from "@/db";
import { inventory, stockMovements } from "@/db/schema";

export type StockReason = "PURCHASE" | "RESERVE" | "RELEASE" | "PICK" | "ADJUSTMENT" | "RETURN";

// Which cached column(s) on `inventory` a given movement reason moves.
// PICK moves both at once: stock physically leaves the shelf and the
// reservation that was holding it is cleared in the same step.
const AFFECTS_ON_HAND: Record<StockReason, boolean> = {
  PURCHASE: true,
  ADJUSTMENT: true,
  RETURN: true,
  PICK: true,
  RESERVE: false,
  RELEASE: false,
};
const AFFECTS_RESERVED: Record<StockReason, boolean> = {
  PURCHASE: false,
  ADJUSTMENT: false,
  RETURN: false,
  PICK: true,
  RESERVE: true,
  RELEASE: true,
};

// The only function allowed to change inventory.on_hand / inventory.reserved.
// Every call writes a stock_movements row first — that log is the audit
// trail when something doesn't add up mid-season.
export async function applyStockMovement(
  db: Db,
  params: {
    skuId: number;
    delta: number;
    reason: StockReason;
    orderId?: number;
    note?: string;
    createdBy?: string;
  }
) {
  await db.insert(stockMovements).values({
    skuId: params.skuId,
    delta: params.delta,
    reason: params.reason,
    orderId: params.orderId,
    note: params.note,
    createdBy: params.createdBy,
  });

  await db.insert(inventory).values({ skuId: params.skuId }).onConflictDoNothing();

  const onHandDelta = AFFECTS_ON_HAND[params.reason] ? params.delta : 0;
  const reservedDelta = AFFECTS_RESERVED[params.reason] ? params.delta : 0;

  await db
    .update(inventory)
    .set({
      onHand: sql`${inventory.onHand} + ${onHandDelta}`,
      reserved: sql`${inventory.reserved} + ${reservedDelta}`,
    })
    .where(eq(inventory.skuId, params.skuId));
}

export type Availability = { onHand: number; reserved: number; available: number };

export async function getAvailability(db: Db, skuIds: number[]): Promise<Map<number, Availability>> {
  const map = new Map<number, Availability>();
  if (skuIds.length === 0) return map;

  for (const id of skuIds) map.set(id, { onHand: 0, reserved: 0, available: 0 });

  const rows = await db.select().from(inventory).where(inArray(inventory.skuId, skuIds));
  for (const row of rows) {
    map.set(row.skuId, { onHand: row.onHand, reserved: row.reserved, available: row.onHand - row.reserved });
  }
  return map;
}

// Shared by every checkout path (kit-based and General Store alike). Two
// steps, called in order: checkStockShortages() before the order row even
// exists — reserve at checkout, not at cart, and never silently drop a line
// that can't be covered — then reserveStock() once the order has an id.
export async function checkStockShortages(
  db: Db,
  neededBySku: Map<number, number>,
  skuNamesById: Map<number, string>
): Promise<string[]> {
  const availability = await getAvailability(db, Array.from(neededBySku.keys()));
  const shortages: string[] = [];
  for (const [skuId, needed] of neededBySku) {
    const avail = availability.get(skuId)?.available ?? 0;
    if (needed > avail) shortages.push(skuNamesById.get(skuId) ?? `SKU #${skuId}`);
  }
  return shortages;
}

export async function reserveStock(db: Db, orderId: number, orderNumber: string, neededBySku: Map<number, number>) {
  for (const [skuId, qty] of neededBySku) {
    await applyStockMovement(db, {
      skuId,
      delta: qty,
      reason: "RESERVE",
      orderId,
      note: `Reserved for ${orderNumber}`,
    });
  }
}
