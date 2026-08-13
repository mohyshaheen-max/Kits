"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { customers, children, addresses } from "@/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-session";

export async function updateProfileAction(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const customer = await requireCustomer();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  if (!name) return { error: "Name is required." };

  const db = getDb();
  await db.update(customers).set({ name, phone }).where(eq(customers.id, customer.id));
  revalidatePath("/account");
  return { ok: true };
}

export async function changePasswordAction(_prev: { error?: string; ok?: boolean } | undefined, formData: FormData) {
  const customer = await requireCustomer();
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");

  if (!(await verifyPassword(currentPassword, customer.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  if (newPassword.length < 8) return { error: "New password must be at least 8 characters." };

  const db = getDb();
  await db.update(customers).set({ passwordHash: await hashPassword(newPassword) }).where(eq(customers.id, customer.id));
  return { ok: true };
}

export async function addChildAction(formData: FormData) {
  const customer = await requireCustomer();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) return;

  const schoolIdRaw = String(formData.get("school_id") ?? "");
  const gradeIdRaw = String(formData.get("grade_id") ?? "");
  const classSection = String(formData.get("class_section") ?? "").trim() || null;

  const db = getDb();
  await db.insert(children).values({
    customerId: customer.id,
    fullName,
    schoolId: schoolIdRaw ? Number(schoolIdRaw) : null,
    gradeId: gradeIdRaw ? Number(gradeIdRaw) : null,
    classSection,
  });
  revalidatePath("/account");
}

export async function deleteChildAction(formData: FormData) {
  const customer = await requireCustomer();
  const id = Number(formData.get("id"));
  if (!id) return;

  const db = getDb();
  await db.delete(children).where(and(eq(children.id, id), eq(children.customerId, customer.id)));
  revalidatePath("/account");
}

export async function addAddressAction(formData: FormData) {
  const customer = await requireCustomer();
  const line = String(formData.get("line") ?? "").trim();
  if (!line) return;

  const label = String(formData.get("label") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;

  const db = getDb();
  await db.insert(addresses).values({ customerId: customer.id, label, line, phone });
  revalidatePath("/account");
}

export async function deleteAddressAction(formData: FormData) {
  const customer = await requireCustomer();
  const id = Number(formData.get("id"));
  if (!id) return;

  const db = getDb();
  await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.customerId, customer.id)));
  revalidatePath("/account");
}
