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
        <Link href={`/admin/orders/${order.id}`} className="text-xs text-neutral-400 hover:text-neutral-700">
          ← {order.orderNumber}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">Pick &amp; pack</h1>
        <p className="text-sm text-neutral-500">
          {school ? `${school.name} — ${grade?.label}` : "General Store"} · {order.childName} ({order.childClass})
        </p>
      </div>

      <form action={confirmPickAction} className="space-y-4">
        <input type="hidden" name="order_id" value={order.id} />

        <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Ordered</th>
                <th className="px-4 py-2 font-medium">Available</th>
                <th className="px-4 py-2 font-medium">Picked qty</th>
                <th className="px-4 py-2 font-medium">If short: substitute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {lines.map(({ item, sku }) => {
                const avail = availability.get(sku.id)?.available ?? 0;
                const short = avail < item.qty;
                const substitutes = substitutesByLine.get(item.id) ?? [];
                return (
                  <tr key={item.id} className={short ? "bg-amber-50/50" : undefined}>
                    <td className="px-4 py-2">
                      <p className="font-medium text-neutral-900">{sku.name}</p>
                      <p className="text-xs text-neutral-400">{sku.code}</p>
                    </td>
                    <td className="px-4 py-2 text-neutral-600">{item.qty}</td>
                    <td className="px-4 py-2">
                      <span className={short ? "font-medium text-amber-700" : "text-neutral-600"}>{avail}</span>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        name={`picked_qty_${item.id}`}
                        min={0}
                        max={item.qty}
                        defaultValue={Math.max(0, Math.min(item.qty, avail))}
                        className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {short ? (
                        substitutes.length > 0 ? (
                          <div className="space-y-1">
                            <select
                              name={`substitute_sku_${item.id}`}
                              defaultValue=""
                              className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
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
                              className="w-full rounded-md border border-neutral-300 px-2 py-1 text-xs"
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-red-600">Short, no allowed substitute — flag for review</p>
                        )
                      ) : (
                        <span className="text-xs text-neutral-300">—</span>
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
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Confirm pack
        </button>
      </form>
    </div>
  );
}
