import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, grades } from "@/db/schema";
import { requireSchoolPortal } from "@/lib/school-session";

export const dynamic = "force-dynamic";

const FULFILMENT_STYLE: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600",
  picking: "bg-blue-100 text-blue-700",
  packed: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function PortalOrdersPage() {
  const schoolAdmin = await requireSchoolPortal();
  const db = getDb();

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      childName: orders.childName,
      childClass: orders.childClass,
      gradeLabel: grades.label,
      fulfilmentStatus: orders.fulfilmentStatus,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .leftJoin(grades, eq(orders.gradeId, grades.id))
    .where(eq(orders.referralSchoolId, schoolAdmin.schoolId))
    .orderBy(desc(orders.createdAt));

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Orders via your referral link</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {rows.length} order{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Grade</th>
              <th className="px-4 py-2 font-medium">Child</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-neutral-900">{o.orderNumber}</p>
                  <p className="text-xs text-neutral-400">{new Date(o.createdAt).toLocaleString()}</p>
                </td>
                <td className="px-4 py-3 text-neutral-600">{o.gradeLabel ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-600">
                  {o.childName} · {o.childClass}
                </td>
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
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-neutral-400">
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
