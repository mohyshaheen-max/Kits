import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, skus, schools, grades } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) notFound();

  const [school, grade, items] = await Promise.all([
    order.schoolId ? db.select().from(schools).where(eq(schools.id, order.schoolId)).then((r) => r[0]) : undefined,
    order.gradeId ? db.select().from(grades).where(eq(grades.id, order.gradeId)).then((r) => r[0]) : undefined,
    db
      .select({ item: orderItems, sku: skus })
      .from(orderItems)
      .innerJoin(skus, eq(orderItems.skuId, skus.id))
      .where(eq(orderItems.orderId, order.id)),
  ]);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
        Order confirmed. We&apos;ll be in touch about delivery.
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-neutral-900">{order.orderNumber}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {school ? `${school.name} — ${grade?.label}` : "General Store"}
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <ul className="divide-y divide-neutral-100">
          {items.map(({ item, sku }) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-neutral-900">{sku.name}</p>
                <p className="text-xs text-neutral-400">Qty {item.qty}</p>
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
            <span>{order.total.toFixed(2)} EGP</span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
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

      <p className="mt-8 text-center text-xs text-neutral-400">
        <Link href="/" className="hover:text-neutral-600 hover:underline">
          ← Back home
        </Link>
      </p>
    </div>
  );
}
