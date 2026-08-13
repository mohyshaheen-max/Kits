import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-warn-bg text-warn",
  in_progress: "bg-teal-100 text-teal-800",
  resolved: "bg-ok-bg text-ok",
  closed: "bg-canvas text-ink-400",
};

export default async function AccountSupportPage() {
  const customer = await requireCustomer();
  const db = getDb();
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.customerId, customer.id))
    .orderBy(desc(supportTickets.updatedAt));

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-600">
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
        </p>
        <Link href="/support" className="text-sm font-medium text-teal-700 hover:underline">
          New ticket
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs font-medium tracking-wide text-ink-400 uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-teal-050">
                <td className="px-4 py-3">
                  <Link href={`/account/support/${t.id}`} className="font-medium text-ink-900 hover:underline">
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-400">{new Date(t.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-ink-400">
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
