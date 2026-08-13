import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, grades } from "@/db/schema";
import { requireSchoolPortal } from "@/lib/school-session";

export const dynamic = "force-dynamic";

const FULFILMENT_STYLE: Record<string, string> = {
  pending: "bg-canvas text-ink-600",
  picking: "bg-teal-100 text-teal-800",
  packed: "bg-teal-100 text-teal-800",
  delivered: "bg-ok-bg text-ok",
  cancelled: "bg-error-bg text-error",
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
      <h1 className="text-xl font-semibold text-ink-900">Orders via your referral link</h1>
      <p className="mt-1 text-sm text-ink-400">
        {rows.length} order{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Grade</th>
              <th className="px-4 py-2 font-medium">Child</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {rows.map((o) => (
              <tr key={o.id}>
                <td className="px-4 py-3">
                  <p className="font-mono font-medium text-ink-900">{o.orderNumber}</p>
                  <p className="text-xs text-ink-400">{new Date(o.createdAt).toLocaleString()}</p>
                </td>
                <td className="px-4 py-3 text-ink-600">{o.gradeLabel ?? "—"}</td>
                <td className="px-4 py-3 text-ink-600">
                  {o.childName} · {o.childClass}
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
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-ink-400">
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
