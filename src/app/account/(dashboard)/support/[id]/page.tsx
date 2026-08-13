import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { supportTickets, supportMessages } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-session";
import ReplyForm from "./reply-form";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-neutral-100 text-neutral-500",
};

export default async function AccountTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ticketId = Number(id);
  if (!ticketId) notFound();

  const customer = await requireCustomer();
  const db = getDb();
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  if (!ticket || ticket.customerId !== customer.id) notFound();

  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.ticketId, ticketId))
    .orderBy(asc(supportMessages.createdAt));
  const visibleMessages = messages.filter((m) => !m.isInternalNote);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">{ticket.subject}</h1>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[ticket.status]}`}>
          {ticket.status.replace("_", " ")}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {visibleMessages.map((m) => (
          <div
            key={m.id}
            className={`rounded-lg border p-3 text-sm ${
              m.author === "admin" ? "border-indigo-100 bg-indigo-50" : "border-neutral-200 bg-white"
            }`}
          >
            <p className="text-xs font-medium text-neutral-500">
              {m.author === "admin" ? `${m.authorName ?? "KITS support"}` : "You"} ·{" "}
              {new Date(m.createdAt).toLocaleString()}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-neutral-800">{m.body}</p>
          </div>
        ))}
      </div>

      {ticket.status !== "closed" && <ReplyForm ticketId={ticket.id} />}
    </div>
  );
}
