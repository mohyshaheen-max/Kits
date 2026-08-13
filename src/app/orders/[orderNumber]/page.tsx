import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, skus, schools, grades, returns } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/customer-session";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";
import CancelOrderButton from "./cancel-order-button";

export const dynamic = "force-dynamic";

const RETURN_STATUS_STYLE: Record<string, string> = {
  requested: "bg-warn-bg text-warn",
  approved: "bg-ok-bg text-ok",
  declined: "bg-error-bg text-error",
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) notFound();

  const [school, grade, items, customer, returnRequests] = await Promise.all([
    order.schoolId ? db.select().from(schools).where(eq(schools.id, order.schoolId)).then((r) => r[0]) : undefined,
    order.gradeId ? db.select().from(grades).where(eq(grades.id, order.gradeId)).then((r) => r[0]) : undefined,
    db
      .select({ item: orderItems, sku: skus })
      .from(orderItems)
      .innerJoin(skus, eq(orderItems.skuId, skus.id))
      .where(eq(orderItems.orderId, order.id)),
    getCurrentCustomer(),
    db.select().from(returns).where(eq(returns.orderId, order.id)).orderBy(desc(returns.createdAt)),
  ]);

  const owned = customer && order.customerId === customer.id;
  const canCancel = owned && ["pending", "picking"].includes(order.fulfilmentStatus);
  const canReturn = owned && order.fulfilmentStatus === "delivered" && returnRequests.length === 0;

  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader customerName={customer?.name} />
      <div className="mx-auto max-w-xl px-6 py-16">
        {order.fulfilmentStatus === "cancelled" ? (
          <div className="rounded-md border border-error bg-error-bg p-4 text-sm text-error">
            This order was cancelled.
          </div>
        ) : (
          <div className="rounded-md border border-ok bg-ok-bg p-4 text-sm text-ok">
            Order confirmed. We&apos;ll be in touch about delivery.
          </div>
        )}

        <h1 className="mt-6 font-display text-2xl font-semibold text-ink-900">{order.orderNumber}</h1>
        <p className="mt-1 text-sm text-teal-700">{school ? `${school.name} — ${grade?.label}` : "General Store"}</p>

        <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
          <ul className="divide-y divide-line-2">
            {items.map(({ item, sku }) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-900">{sku.name}</p>
                  <p className="font-mono text-xs text-ink-400">×{item.qty}</p>
                </div>
                <p className="font-mono text-ink-600">{item.lineTotal.toFixed(2)} EGP</p>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-line bg-canvas p-4 text-sm">
            <div className="flex justify-between text-ink-600">
              <span>Items</span>
              <span className="font-mono">{order.subtotal.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Labeling</span>
              <span className="font-mono">{order.labelingFee.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-ink-600">
              <span>Delivery ({order.deliveryMethod === "SCHOOL_BATCH" ? "school batch" : "home"})</span>
              <span className="font-mono">{order.deliveryFee.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink-900">
              <span>Total</span>
              <span className="font-mono text-teal-700">{order.total.toFixed(2)} EGP</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2 rounded-md border border-line bg-surface p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-600">Child</span>
            <span className="text-ink-900">
              {order.childName} · {order.childClass}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-ink-600">Payment</span>
            <span className="text-right text-ink-900">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Card"} —{" "}
              {order.paymentStatus === "pending_reconciliation" ? "awaiting cash collection" : "paid"}
            </span>
          </div>
          {order.deliveryAddress && (
            <div className="flex justify-between">
              <span className="text-ink-600">Address</span>
              <span className="text-right text-ink-900">{order.deliveryAddress}</span>
            </div>
          )}
        </div>

        {returnRequests.length > 0 && (
          <div className="mt-6 space-y-2 rounded-md border border-line bg-surface p-4 text-sm">
            <p className="font-medium text-ink-900">Return requests</p>
            {returnRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-ink-600">{r.reason}</span>
                <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${RETURN_STATUS_STYLE[r.status]}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          {canCancel && <CancelOrderButton orderId={order.id} />}
          {canReturn && (
            <Link
              href={`/orders/${order.orderNumber}/return`}
              className="inline-block rounded-md border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-050"
            >
              Request a return
            </Link>
          )}
          <Link
            href={`/support?order=${order.orderNumber}`}
            className="inline-block rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:bg-canvas"
          >
            Need help with this order?
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
