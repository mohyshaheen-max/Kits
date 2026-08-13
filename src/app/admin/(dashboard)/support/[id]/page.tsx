import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets, supportMessages, customers, orders } from "@/db/schema";
import { updateTicketStatusAction } from "@/lib/actions/support";
import AdminReplyForm from "./admin-reply-form";

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export default async function AdminTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!ticketId) notFound();

  const db = getDb();
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  if (!ticket) notFound();

  const [customer, order, messages] = await Promise.all([
    ticket.customerId ? db.select().from(customers).where(eq(customers.id, ticket.customerId)).then((r) => r[0]) : undefined,
    ticket.orderId ? db.select().from(orders).where(eq(orders.id, ticket.orderId)).then((r) => r[0]) : undefined,
    db.select().from(supportMessages).where(eq(supportMessages.ticketId, ticketId)).orderBy(asc(supportMessages.createdAt)),
  ]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-ink-900">{ticket.subject}</h1>
      <p className="mt-1 text-sm text-ink-400">
        {customer ? customer.name : ticket.guestName} · {customer ? customer.email : ticket.guestEmail}
        {order && (
          <>
            {" "}
            · Order <span className="font-mono">{order.orderNumber}</span>
          </>
        )}
      </p>

      <form action={updateTicketStatusAction} className="mt-3 flex items-center gap-2">
        <input type="hidden" name="ticket_id" value={ticket.id} />
        {STATUSES.map((s) => (
          <button
            key={s}
            type="submit"
            name="status"
            value={s}
            className={`rounded-sm px-3 py-1 text-xs font-medium ${
              ticket.status === s ? "bg-teal-600 text-white" : "bg-canvas text-ink-600 hover:bg-teal-100"
            }`}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </form>

      <div className="mt-4 space-y-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-md border p-3 text-sm ${
              m.isInternalNote
                ? "border-warn bg-warn-bg"
                : m.author === "admin"
                  ? "border-teal-100 bg-teal-050"
                  : "border-line bg-surface"
            }`}
          >
            <p className="text-xs font-medium text-ink-400">
              {m.authorName ?? (m.author === "admin" ? "Staff" : "Customer")} · {new Date(m.createdAt).toLocaleString()}
              {m.isInternalNote && " · internal note"}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-ink-900">{m.body}</p>
          </div>
        ))}
      </div>

      <AdminReplyForm ticketId={ticket.id} />
    </div>
  );
}
