import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets, customers, orders } from "@/db/schema";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-warn-bg text-warn",
  in_progress: "bg-teal-100 text-teal-800",
  resolved: "bg-ok-bg text-ok",
  closed: "bg-canvas text-ink-400",
};

export default async function AdminSupportPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      status: supportTickets.status,
      updatedAt: supportTickets.updatedAt,
      guestName: supportTickets.guestName,
      customerName: customers.name,
      orderNumber: orders.orderNumber,
    })
    .from(supportTickets)
    .leftJoin(customers, eq(supportTickets.customerId, customers.id))
    .leftJoin(orders, eq(supportTickets.orderId, orders.id))
    .orderBy(desc(supportTickets.updatedAt));

  const open = rows.filter((r) => r.status === "open").length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">Support</h1>
      <p className="mt-1 text-sm text-ink-400">
        {rows.length} ticket{rows.length === 1 ? "" : "s"}
        {open > 0 && (
          <span className="ml-2 rounded-sm bg-warn-bg px-2 py-0.5 text-xs font-medium text-warn">
            {open} open
          </span>
        )}
      </p>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">From</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-teal-050">
                <td className="px-4 py-3">
                  <Link href={`/admin/support/${t.id}`} className="font-medium text-ink-900 hover:underline">
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-600">{t.customerName ?? t.guestName ?? "—"}</td>
                <td className="px-4 py-3 text-ink-600">{t.orderNumber ?? "—"}</td>
                <td className="px-4 py-3 text-ink-400">{new Date(t.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-ink-400">
                  No support tickets yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
