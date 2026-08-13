import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, children, addresses } from "@/db/schema";
import { CUSTOMER_SESSION_COOKIE, SESSION_TTL_SECONDS, signCustomerSession, verifyCustomerSession } from "@/lib/auth";

async function authSecret(): Promise<string> {
  const { env } = getCloudflareContext();
  return env.AUTH_SECRET;
}

export async function createCustomerSession(customerId: number) {
  const secret = await authSecret();
  const value = await signCustomerSession(customerId, secret);
  const store = await cookies();
  store.set(CUSTOMER_SESSION_COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyCustomerSession() {
  const store = await cookies();
  store.delete(CUSTOMER_SESSION_COOKIE);
}

export async function getCurrentCustomer() {
  const store = await cookies();
  const cookie = store.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!cookie) return null;
  const secret = await authSecret();
  const session = await verifyCustomerSession(cookie, secret);
  if (!session) return null;
  const db = getDb();
  const [customer] = await db.select().from(customers).where(eq(customers.id, session.customerId)).limit(1);
  return customer ?? null;
}

export async function requireCustomer() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");
  return customer;
}

// Checkout prefill data — saved children/addresses for the logged-in
// customer, or null for a guest. Never used to attach an order to an
// account; that always comes from re-deriving the session server-side in
// the order action itself.
export async function getAccountContext() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const db = getDb();
  const [childRows, addressRows] = await Promise.all([
    db.select().from(children).where(eq(children.customerId, customer.id)),
    db.select().from(addresses).where(eq(addresses.customerId, customer.id)),
  ]);

  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    children: childRows.map((c) => ({ id: c.id, fullName: c.fullName, classSection: c.classSection })),
    addresses: addressRows.map((a) => ({ id: a.id, label: a.label, line: a.line })),
  };
}
