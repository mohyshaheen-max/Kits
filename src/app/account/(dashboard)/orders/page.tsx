import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, schools, grades } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

const FULFILMENT_STYLE: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  picking: "bg-blue-100 text-blue-700",
  packed: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AccountOrdersPage() {
  const customer = await requireCustomer();
  const db = getDb();

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      childName: orders.childName,
      total: orders.total,
      fulfilmentStatus: orders.fulfilmentStatus,
      createdAt: orders.createdAt,
      schoolName: schools.name,
      gradeLabel: grades.label,
    })
    .from(orders)
    .leftJoin(schools, eq(orders.schoolId, schools.id))
    .leftJoin(grades, eq(orders.gradeId, grades.id))
    .where(eq(orders.customerId, customer.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div>
      <p className="text-sm text-neutral-500">
        {rows.length} order{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">School / Grade</th>
              <th className="px-4 py-2 font-medium">Child</th>
              <th className="px-4 py-2 font-medium">Total</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/orders/${o.orderNumber}`} className="font-medium text-indigo-600 hover:underline">
                    {o.orderNumber}
                  </Link>
                  <p className="text-xs text-neutral-400">{new Date(o.createdAt).toLocaleString()}</p>
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {o.schoolName ? `${o.schoolName} · ${o.gradeLabel}` : "General Store"}
                </td>
                <td className="px-4 py-3 text-neutral-600">{o.childName}</td>
                <td className="px-4 py-3 text-neutral-900">{o.total.toFixed(2)} EGP</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${FULFILMENT_STYLE[o.fulfilmentStatus]}`}
                  >
                    {o.fulfilmentStatus}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-400">
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
