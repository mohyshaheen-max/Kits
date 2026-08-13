"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { createCustomerSession, destroyCustomerSession } from "@/lib/customer-session";

export async function registerAction(_prev: { error?: string } | undefined, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const password = String(formData.get("password") ?? "");

  if (!name || !email || !password) return { error: "Name, email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const db = getDb();
  const [existing] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  if (existing) return { error: "An account with that email already exists." };

  const [customer] = await db
    .insert(customers)
    .values({ name, email, phone, passwordHash: await hashPassword(password) })
    .returning({ id: customers.id });

  await createCustomerSession(customer.id);
  redirect("/account");
}

export async function loginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };

  const db = getDb();
  const [customer] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);

  if (!customer || !(await verifyPassword(password, customer.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createCustomerSession(customer.id);
  redirect("/account");
}

export async function logoutAction() {
  await destroyCustomerSession();
  redirect("/");
}
