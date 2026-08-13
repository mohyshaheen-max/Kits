import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets, customers, orders } from "@/db/schema";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-neutral-100 text-neutral-500",
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
      <h1 className="text-xl font-semibold text-neutral-900">Support</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {rows.length} ticket{rows.length === 1 ? "" : "s"}
        {open > 0 && (
          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {open} open
          </span>
        )}
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">From</th>
              <th className="px-4 py-2 font-medium">Order</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((t) => (
              <tr key={t.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/support/${t.id}`} className="font-medium text-neutral-900 hover:underline">
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-600">{t.customerName ?? t.guestName ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-600">{t.orderNumber ?? "—"}</td>
                <td className="px-4 py-3 text-neutral-500">{new Date(t.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-400">
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
