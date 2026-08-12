"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { schoolAdmins } from "@/db/schema";
import { verifyPassword } from "@/lib/auth";
import { createSchoolSession, destroySchoolSession } from "@/lib/school-session";

export async function schoolLoginAction(_prev: { error?: string } | undefined, formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const db = getDb();
  const [schoolAdmin] = await db.select().from(schoolAdmins).where(eq(schoolAdmins.email, email)).limit(1);

  if (!schoolAdmin || !(await verifyPassword(password, schoolAdmin.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await createSchoolSession(schoolAdmin.id);
  redirect("/portal");
}

export async function schoolLogoutAction() {
  await destroySchoolSession();
  redirect("/portal/login");
}
