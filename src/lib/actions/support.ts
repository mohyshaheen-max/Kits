"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { supportTickets, supportMessages, orders } from "@/db/schema";
import { getCurrentCustomer, requireCustomer } from "@/lib/customer-session";
import { requireAdmin } from "@/lib/session";

export type TicketFormState = { error?: string; ok?: boolean };

// Works for both guests and logged-in customers. A guest gets a plain
// "we've got it" confirmation — there's no verified identity to gate a
// self-service thread view behind, so guest tickets are handled entirely
// by staff replying out-of-band (email/phone), not through the site.
export async function createTicketAction(_prev: TicketFormState | undefined, formData: FormData): Promise<TicketFormState> {
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const orderNumber = String(formData.get("order_number") ?? "").trim();
  if (!subject || !message) return { error: "Subject and message are required." };

  const customer = await getCurrentCustomer();
  const guestName = String(formData.get("guest_name") ?? "").trim();
  const guestEmail = String(formData.get("guest_email") ?? "").trim();
  if (!customer && (!guestName || !guestEmail)) {
    return { error: "Name and email are required." };
  }

  const db = getDb();
  let orderId: number | null = null;
  if (orderNumber) {
    const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
    if (order) orderId = order.id;
  }

  const [ticket] = await db
    .insert(supportTickets)
    .values({
      customerId: customer?.id ?? null,
      guestName: customer ? null : guestName,
      guestEmail: customer ? null : guestEmail,
      orderId,
      subject,
    })
    .returning({ id: supportTickets.id });

  await db.insert(supportMessages).values({
    ticketId: ticket.id,
    author: "customer",
    authorName: customer?.name ?? guestName,
    body: message,
  });

  revalidatePath("/admin/support");
  return { ok: true };
}

export async function replyTicketAction(_prev: TicketFormState | undefined, formData: FormData): Promise<TicketFormState> {
  const customer = await requireCustomer();
  const ticketId = Number(formData.get("ticket_id"));
  const body = String(formData.get("body") ?? "").trim();
  if (!ticketId || !body) return { error: "Message can't be empty." };

  const db = getDb();
  const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  if (!ticket || ticket.customerId !== customer.id) return { error: "Ticket not found." };

  await db.insert(supportMessages).values({
    ticketId,
    author: "customer",
    authorName: customer.name,
    body,
  });
  await db
    .update(supportTickets)
    .set({ status: "open", updatedAt: new Date().toISOString() })
    .where(eq(supportTickets.id, ticketId));

  revalidatePath(`/account/support/${ticketId}`);
  revalidatePath("/admin/support");
  return { ok: true };
}

export async function adminReplyTicketAction(formData: FormData) {
  const admin = await requireAdmin();
  const ticketId = Number(formData.get("ticket_id"));
  const body = String(formData.get("body") ?? "").trim();
  const isInternalNote = formData.get("is_internal_note") === "1";
  if (!ticketId || !body) return;

  const db = getDb();
  await db.insert(supportMessages).values({
    ticketId,
    author: "admin",
    authorName: admin.name ?? admin.email,
    body,
    isInternalNote,
  });

  const updatedAt = new Date().toISOString();
  if (isInternalNote) {
    await db.update(supportTickets).set({ updatedAt }).where(eq(supportTickets.id, ticketId));
  } else {
    await db.update(supportTickets).set({ status: "in_progress", updatedAt }).where(eq(supportTickets.id, ticketId));
  }

  revalidatePath(`/admin/support/${ticketId}`);
}

export async function updateTicketStatusAction(formData: FormData) {
  await requireAdmin();
  const ticketId = Number(formData.get("ticket_id"));
  const status = String(formData.get("status") ?? "") as "open" | "in_progress" | "resolved" | "closed";
  if (!ticketId || !["open", "in_progress", "resolved", "closed"].includes(status)) return;

  const db = getDb();
  await db
    .update(supportTickets)
    .set({ status, updatedAt: new Date().toISOString() })
    .where(eq(supportTickets.id, ticketId));

  revalidatePath(`/admin/support/${ticketId}`);
  revalidatePath("/admin/support");
}
