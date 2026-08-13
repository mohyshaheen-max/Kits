import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, skus, schools, grades, returns } from "@/db/schema";
import { categoryIcon } from "@/lib/category-icon";
import { getCurrentCustomer } from "@/lib/customer-session";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";
import CancelOrderButton from "./cancel-order-button";

export const dynamic = "force-dynamic";

const RETURN_STATUS_STYLE: Record<string, string> = {
  requested: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  declined: "bg-red-100 text-red-700",
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
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader customerName={customer?.name} />
      <div className="mx-auto max-w-xl px-6 py-16">
        {order.fulfilmentStatus === "cancelled" ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
            This order was cancelled.
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
            ✅ Order confirmed. We&apos;ll be in touch about delivery.
          </div>
        )}

        <h1 className="mt-6 text-2xl font-semibold text-neutral-900">{order.orderNumber}</h1>
        <p className="mt-1 text-sm text-indigo-600">
          {school ? `${school.name} — ${grade?.label}` : "General Store"}
        </p>

        <div className="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <ul className="divide-y divide-neutral-100">
            {items.map(({ item, sku }) => (
              <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>{categoryIcon(sku.category)}</span>
                  <div>
                    <p className="font-medium text-neutral-900">{sku.name}</p>
                    <p className="text-xs text-neutral-400">Qty {item.qty}</p>
                  </div>
                </div>
                <p className="text-neutral-600">{item.lineTotal.toFixed(2)} EGP</p>
              </li>
            ))}
          </ul>
          <div className="space-y-1 border-t border-neutral-200 bg-neutral-50 p-4 text-sm">
            <div className="flex justify-between text-neutral-500">
              <span>Items</span>
              <span>{order.subtotal.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Labeling</span>
              <span>{order.labelingFee.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Delivery ({order.deliveryMethod === "SCHOOL_BATCH" ? "school batch" : "home"})</span>
              <span>{order.deliveryFee.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span className="text-indigo-600">{order.total.toFixed(2)} EGP</span>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2 rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-sm">
          <div className="flex justify-between">
            <span className="text-neutral-500">Child</span>
            <span className="text-neutral-900">
              {order.childName} · {order.childClass}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="shrink-0 text-neutral-500">Payment</span>
            <span className="text-right text-neutral-900">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Card"} —{" "}
              {order.paymentStatus === "pending_reconciliation" ? "awaiting cash collection" : "paid"}
            </span>
          </div>
          {order.deliveryAddress && (
            <div className="flex justify-between">
              <span className="text-neutral-500">Address</span>
              <span className="text-right text-neutral-900">{order.deliveryAddress}</span>
            </div>
          )}
        </div>

        {returnRequests.length > 0 && (
          <div className="mt-6 space-y-2 rounded-xl border border-neutral-200 bg-white p-4 text-sm shadow-sm">
            <p className="font-medium text-neutral-900">Return requests</p>
            {returnRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <span className="text-neutral-600">{r.reason}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RETURN_STATUS_STYLE[r.status]}`}>
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
              className="inline-block rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Request a return
            </Link>
          )}
          <Link
            href={`/support?order=${order.orderNumber}`}
            className="inline-block rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Need help with this order?
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
