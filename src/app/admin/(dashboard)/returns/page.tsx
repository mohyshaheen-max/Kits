import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { returns, orders } from "@/db/schema";

const STATUS_STYLE: Record<string, string> = {
  requested: "bg-warn-bg text-warn",
  approved: "bg-ok-bg text-ok",
  declined: "bg-error-bg text-error",
};

export default async function AdminReturnsPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: returns.id,
      reason: returns.reason,
      status: returns.status,
      createdAt: returns.createdAt,
      orderNumber: orders.orderNumber,
      childName: orders.childName,
    })
    .from(returns)
    .innerJoin(orders, eq(returns.orderId, orders.id))
    .orderBy(desc(returns.createdAt));

  const pending = rows.filter((r) => r.status === "requested").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">Returns</h1>
      <p className="mt-1 text-sm text-ink-400">
        {rows.length} request{rows.length === 1 ? "" : "s"}
        {pending > 0 && (
          <span className="ml-2 rounded-sm bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn">
            {pending} awaiting decision
          </span>
        )}
      </p>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Child</th>
              <th className="px-4 py-2 font-medium">Reason</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-teal-050">
                <td className="px-4 py-3">
                  <Link href={`/admin/returns/${r.id}`} className="font-mono font-medium text-ink-900 hover:underline">
                    {r.orderNumber}
                  </Link>
                  <p className="text-xs text-ink-400">{new Date(r.createdAt).toLocaleString()}</p>
                </td>
                <td className="px-4 py-3 text-ink-600">{r.childName}</td>
                <td className="px-4 py-3 text-ink-600">{r.reason}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-ink-400">
                  No return requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
