import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, skus, schools, grades } from "@/db/schema";
import { getAvailability } from "@/lib/wms/stock";
import { getAllowedSubstitutes } from "@/lib/wms/substitution";
import { confirmPickAction } from "@/lib/actions/wms";

export default async function PackOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) notFound();

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) notFound();

  const [school, grade, lines] = await Promise.all([
    order.schoolId ? db.select().from(schools).where(eq(schools.id, order.schoolId)).then((r) => r[0]) : undefined,
    order.gradeId ? db.select().from(grades).where(eq(grades.id, order.gradeId)).then((r) => r[0]) : undefined,
    db
      .select({ item: orderItems, sku: skus })
      .from(orderItems)
      .innerJoin(skus, eq(orderItems.skuId, skus.id))
      .where(eq(orderItems.orderId, orderId)),
  ]);

  const availability = await getAvailability(
    db,
    lines.map(({ sku }) => sku.id)
  );

  const substitutesByLine = new Map<number, Awaited<ReturnType<typeof getAllowedSubstitutes>>>();
  for (const { item, sku } of lines) {
    const avail = availability.get(sku.id)?.available ?? 0;
    if (avail < item.qty) {
      substitutesByLine.set(item.id, await getAllowedSubstitutes(db, order.schoolId, sku));
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/admin/orders/${order.id}`} className="text-xs text-ink-400 hover:text-ink-600">
          ← <span className="font-mono">{order.orderNumber}</span>
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">Pick &amp; pack</h1>
        <p className="text-sm text-ink-400">
          {school ? `${school.name} — ${grade?.label}` : "General Store"} · {order.childName} ({order.childClass}) ·{" "}
          <span className="font-mono">{lines.length} items</span>
        </p>
      </div>

      <form action={confirmPickAction} className="space-y-4">
        <input type="hidden" name="order_id" value={order.id} />

        <div className="overflow-hidden rounded-md border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 text-right font-medium">Ordered</th>
                <th className="px-4 py-3 text-right font-medium">Available</th>
                <th className="px-4 py-3 font-medium">Picked qty</th>
                <th className="px-4 py-3 font-medium">If short: substitute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {lines.map(({ item, sku }) => {
                const avail = availability.get(sku.id)?.available ?? 0;
                const short = avail < item.qty;
                const substitutes = substitutesByLine.get(item.id) ?? [];
                return (
                  <tr key={item.id} className={short ? "bg-warn-bg/50" : undefined}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink-900">{sku.name}</p>
                      <p className="font-mono text-xs text-ink-400">{sku.code}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink-600">{item.qty}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-mono ${short ? "font-medium text-warn" : "text-ink-600"}`}>{avail}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        name={`picked_qty_${item.id}`}
                        min={0}
                        max={item.qty}
                        defaultValue={Math.max(0, Math.min(item.qty, avail))}
                        className="h-11 w-20 rounded-sm border border-line px-2 text-right font-mono text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {short ? (
                        substitutes.length > 0 ? (
                          <div className="space-y-1">
                            <select
                              name={`substitute_sku_${item.id}`}
                              defaultValue=""
                              className="h-11 w-full rounded-sm border border-line px-2 text-xs focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                            >
                              <option value="">— no substitute —</option>
                              {substitutes.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name} {s.brand ? `(${s.brand})` : ""}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              name={`note_${item.id}`}
                              placeholder="Note (optional)"
                              className="h-11 w-full rounded-sm border border-line px-2 text-xs focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-error">Short, no allowed substitute — flag for review</p>
                        )
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button
          type="submit"
          className="cut-tr h-14 rounded-md bg-teal-600 px-6 text-sm font-medium text-white hover:bg-teal-700"
        >
          Confirm pack
        </button>
      </form>
    </div>
  );
}
