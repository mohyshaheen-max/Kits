import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-session";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-neutral-100 text-neutral-500",
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
        <p className="text-sm text-neutral-500">
          {tickets.length} ticket{tickets.length === 1 ? "" : "s"}
        </p>
        <Link href="/support" className="text-sm font-medium text-indigo-600 hover:underline">
          New ticket
        </Link>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Updated</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {tickets.map((t) => (
              <tr key={t.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/account/support/${t.id}`} className="font-medium text-neutral-900 hover:underline">
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-neutral-500">{new Date(t.updatedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-neutral-400">
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
