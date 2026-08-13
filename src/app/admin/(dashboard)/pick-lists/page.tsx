import Link from "next/link";
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, orders, orderItems, skus } from "@/db/schema";
import { getAvailability } from "@/lib/wms/stock";
import { inputClass } from "@/components/admin/form-controls";

const OPEN_STATUSES = ["pending", "picking"] as const;

export default async function PickListsPage({
  searchParams,
}: {
  searchParams: Promise<{ schoolId?: string; gradeId?: string }>;
}) {
  const { schoolId: schoolIdRaw, gradeId: gradeIdRaw } = await searchParams;
  const schoolId = Number(schoolIdRaw) || undefined;
  const gradeId = Number(gradeIdRaw) || undefined;

  const db = getDb();
  const allSchools = await db.select().from(schools).orderBy(asc(schools.name));
  const schoolGrades = schoolId ? await db.select().from(grades).where(eq(grades.schoolId, schoolId)).orderBy(asc(grades.sortOrder)) : [];

  let rows: { skuId: number; skuName: string; skuCode: string; category: string; needed: number; orderCount: number }[] = [];
  let available = new Map<number, { onHand: number; reserved: number; available: number }>();
  let matchingOrders: { id: number; orderNumber: string; childName: string }[] = [];

  if (schoolId && gradeId) {
    matchingOrders = await db
      .select({ id: orders.id, orderNumber: orders.orderNumber, childName: orders.childName })
      .from(orders)
      .where(and(eq(orders.schoolId, schoolId), eq(orders.gradeId, gradeId), inArray(orders.fulfilmentStatus, OPEN_STATUSES)));

    if (matchingOrders.length > 0) {
      const lines = await db
        .select({ item: orderItems, sku: skus })
        .from(orderItems)
        .innerJoin(skus, eq(orderItems.skuId, skus.id))
        .where(
          inArray(
            orderItems.orderId,
            matchingOrders.map((o) => o.id)
          )
        );

      const agg = new Map<number, { skuName: string; skuCode: string; category: string; needed: number; orderCount: number }>();
      for (const { item, sku } of lines) {
        const remaining = item.qty - (item.pickedQty ?? 0);
        if (remaining <= 0) continue;
        const existing = agg.get(sku.id);
        if (existing) {
          existing.needed += remaining;
          existing.orderCount += 1;
        } else {
          agg.set(sku.id, { skuName: sku.name, skuCode: sku.code, category: sku.category, needed: remaining, orderCount: 1 });
        }
      }
      rows = Array.from(agg.entries())
        .map(([skuId, v]) => ({ skuId, ...v }))
        .sort((a, b) => a.category.localeCompare(b.category) || a.skuName.localeCompare(b.skuName));

      available = await getAvailability(db, rows.map((r) => r.skuId));
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Batch pick list</h1>
        <p className="mt-1 text-sm text-ink-400">
          Total quantity still needed across every open order for one school + grade — pull it all at once before
          packing individual orders.
        </p>
      </div>

      <form className="flex items-end gap-3 rounded-md border border-line bg-surface p-4">
        <div className="flex-1">
          <label className="block text-xs text-ink-400">School</label>
          <select name="schoolId" defaultValue={schoolId ?? ""} className={inputClass}>
            <option value="">— select —</option>
            {allSchools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-ink-400">Grade</label>
          <select name="gradeId" defaultValue={gradeId ?? ""} className={inputClass}>
            <option value="">— select —</option>
            {schoolGrades.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="h-[38px] rounded-md bg-teal-600 px-4 text-sm font-medium text-white hover:bg-teal-700">
          View
        </button>
      </form>

      {schoolId && gradeId && (
        <>
          <p className="text-sm text-ink-400">
            {matchingOrders.length} open order{matchingOrders.length === 1 ? "" : "s"} (pending/picking):{" "}
            {matchingOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="mr-2 font-mono underline hover:text-ink-900">
                {o.orderNumber}
              </Link>
            ))}
          </p>

          <div className="overflow-hidden rounded-md border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 text-right font-medium">Needed</th>
                  <th className="px-4 py-2 text-right font-medium">On hand</th>
                  <th className="px-4 py-2 text-right font-medium">Orders</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {rows.map((r) => {
                  const avail = available.get(r.skuId);
                  const short = (avail?.onHand ?? 0) < r.needed;
                  return (
                    <tr key={r.skuId} className={short ? "bg-warn-bg/50" : undefined}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-ink-900">{r.skuName}</p>
                        <p className="font-mono text-xs text-ink-400">{r.skuCode}</p>
                      </td>
                      <td className="px-4 py-2 text-ink-600">{r.category}</td>
                      <td className="px-4 py-2 text-right font-mono font-medium text-ink-900">{r.needed}</td>
                      <td className={`px-4 py-2 text-right font-mono ${short ? "font-medium text-warn" : "text-ink-600"}`}>
                        {avail?.onHand ?? 0}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-ink-400">{r.orderCount}</td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-ink-400">
                      Nothing to pick — no open orders for this school and grade.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
