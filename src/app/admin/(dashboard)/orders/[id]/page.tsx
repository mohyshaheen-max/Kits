import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, skus, schools, grades, payments } from "@/db/schema";
import { reconcilePaymentAction, updateFulfilmentStatusAction } from "@/lib/actions/orders";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) notFound();

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) notFound();

  const [school, grade, items, orderPayments] = await Promise.all([
    order.schoolId ? db.select().from(schools).where(eq(schools.id, order.schoolId)).then((r) => r[0]) : undefined,
    order.gradeId ? db.select().from(grades).where(eq(grades.id, order.gradeId)).then((r) => r[0]) : undefined,
    db
      .select({ item: orderItems, sku: skus })
      .from(orderItems)
      .innerJoin(skus, eq(orderItems.skuId, skus.id))
      .where(eq(orderItems.orderId, orderId)),
    db.select().from(payments).where(eq(payments.orderId, orderId)).orderBy(asc(payments.id)),
  ]);

  const substituteIds = items.map(({ item }) => item.substitutedSkuId).filter((id): id is number => id !== null);
  const substituteSkus = substituteIds.length
    ? Object.fromEntries((await db.select().from(skus)).map((s) => [s.id, s]))
    : {};

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <Link href="/admin/orders" className="text-xs text-ink-400 hover:text-ink-600">
              ← Orders
            </Link>
            <h1 className="mt-1 font-mono text-xl font-semibold text-ink-900">{order.orderNumber}</h1>
            <p className="text-sm text-ink-400">
              {school ? `${school.name} — ${grade?.label}` : "General Store"} ·{" "}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/admin/orders/${order.id}/label`}
              className="rounded-md border border-line px-3 py-2 text-sm font-medium text-ink-600 hover:bg-teal-050"
            >
              Labels
            </Link>
            <Link
              href={`/admin/orders/${order.id}/pack`}
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Pick &amp; pack →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Parent</p>
          <p className="mt-1 text-sm text-ink-900">{order.parentName}</p>
          <p className="text-sm text-ink-600">{order.parentPhone}</p>
          {order.parentEmail && <p className="text-sm text-ink-600">{order.parentEmail}</p>}
        </div>
        <div className="rounded-md border border-line bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Child / Delivery</p>
          <p className="mt-1 text-sm text-ink-900">
            {order.childName} · {order.childClass}
          </p>
          <p className="text-sm text-ink-600">
            {order.deliveryMethod === "SCHOOL_BATCH" ? "School batch" : "Home"}
            {order.deliveryAddress ? ` — ${order.deliveryAddress}` : ""}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <div className="border-b border-line bg-canvas px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          Items
        </div>
        <ul className="divide-y divide-line-2">
          {items.map(({ item, sku }) => (
            <li key={item.id} className="px-4 py-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-ink-900">{sku.name}</p>
                  <p className="text-xs text-ink-400">
                    {sku.code} · Qty {item.qty}
                    {item.pickedQty !== null && item.pickedQty !== item.qty && (
                      <span className="ml-1 text-warn">(picked {item.pickedQty})</span>
                    )}
                  </p>
                </div>
                <p className="font-mono text-ink-600">{item.lineTotal.toFixed(2)} EGP</p>
              </div>
              {item.substitutedSkuId && (
                <p className="mt-1 text-xs text-teal-800">
                  Substituted with {substituteSkus[item.substitutedSkuId]?.name ?? `SKU #${item.substitutedSkuId}`}
                  {item.substitutionNote ? ` — ${item.substitutionNote}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
        <div className="space-y-1 border-t border-line bg-canvas p-4 text-sm">
          <div className="flex justify-between text-ink-400">
            <span>Items</span>
            <span className="font-mono">{order.subtotal.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-ink-400">
            <span>Labeling</span>
            <span className="font-mono">{order.labelingFee.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-ink-400">
            <span>Delivery</span>
            <span className="font-mono">{order.deliveryFee.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink-900">
            <span>Total</span>
            <span className="font-mono text-teal-700">{order.total.toFixed(2)} EGP</span>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Payment</p>
        {orderPayments.map((p) => (
          <div key={p.id} className="mt-3 flex items-center justify-between text-sm">
            <div>
              <p className="text-ink-900">
                {p.method} · <span className="font-mono">{p.amount.toFixed(2)} EGP</span>
              </p>
              <p className="text-xs text-ink-400">
                {p.status.replace("_", " ")}
                {p.reconciledAt ? ` — reconciled ${new Date(p.reconciledAt).toLocaleString()} by ${p.reconciledBy}` : ""}
              </p>
            </div>
            {p.status === "pending_reconciliation" && (
              <form action={reconcilePaymentAction}>
                <input type="hidden" name="payment_id" value={p.id} />
                <input type="hidden" name="order_id" value={order.id} />
                <button
                  type="submit"
                  className="rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
                >
                  Mark cash received
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-md border border-line bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Fulfilment</p>
        <form action={updateFulfilmentStatusAction} className="mt-3 flex items-center gap-2">
          <input type="hidden" name="order_id" value={order.id} />
          <select name="status" defaultValue={order.fulfilmentStatus} className="rounded-md border border-line px-2 py-1.5 text-sm">
            <option value="pending">pending</option>
            <option value="picking">picking</option>
            <option value="packed">packed</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button type="submit" className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700">
            Update
          </button>
        </form>
      </div>
    </div>
  );
}
