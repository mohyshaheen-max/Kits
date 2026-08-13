import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, schools, grades } from "@/db/schema";

const PAYMENT_STYLE: Record<string, string> = {
  pending: "bg-canvas text-ink-600",
  paid: "bg-ok-bg text-ok",
  pending_reconciliation: "bg-warn-bg text-warn",
  failed: "bg-error-bg text-error",
  refunded: "bg-canvas text-ink-400",
};

const FULFILMENT_STYLE: Record<string, string> = {
  pending: "bg-canvas text-ink-600",
  picking: "bg-teal-100 text-teal-800",
  packed: "bg-teal-100 text-teal-800",
  delivered: "bg-ok-bg text-ok",
  cancelled: "bg-error-bg text-error",
};

export default async function OrdersPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      childName: orders.childName,
      total: orders.total,
      paymentMethod: orders.paymentMethod,
      paymentStatus: orders.paymentStatus,
      fulfilmentStatus: orders.fulfilmentStatus,
      createdAt: orders.createdAt,
      schoolName: schools.name,
      gradeLabel: grades.label,
    })
    .from(orders)
    .leftJoin(schools, eq(orders.schoolId, schools.id))
    .leftJoin(grades, eq(orders.gradeId, grades.id))
    .orderBy(desc(orders.createdAt));

  const pendingReconciliation = rows.filter((r) => r.paymentStatus === "pending_reconciliation").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">Orders</h1>
      <p className="mt-1 text-sm text-ink-400">
        {rows.length} order{rows.length === 1 ? "" : "s"}
        {pendingReconciliation > 0 && (
          <span className="ml-2 rounded-sm bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn">
            {pendingReconciliation} COD awaiting reconciliation
          </span>
        )}
      </p>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">School / Grade</th>
              <th className="px-4 py-2 font-medium">Child</th>
              <th className="px-4 py-2 text-right font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Payment</th>
              <th className="px-4 py-2 font-medium">Fulfilment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-teal-050">
                <td className="px-4 py-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-mono font-medium text-ink-900 hover:underline">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-400">{new Date(o.createdAt).toLocaleString()}</p>
                </td>
                <td className="px-4 py-3 text-ink-600">
                  {o.schoolName ? `${o.schoolName} · ${o.gradeLabel}` : "General Store"}
                </td>
                <td className="px-4 py-3 text-ink-600">{o.childName}</td>
                <td className="px-4 py-3 text-right font-mono text-ink-900">{o.total.toFixed(2)} EGP</td>
                <td className="px-4 py-3">
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${PAYMENT_STYLE[o.paymentStatus]}`}>
                    {o.paymentMethod} · {o.paymentStatus.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-medium ${FULFILMENT_STYLE[o.fulfilmentStatus]}`}
                  >
                    {o.fulfilmentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sm text-ink-400">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
