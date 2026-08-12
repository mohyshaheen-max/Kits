"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { schools, grades, schoolBrandRules, schoolAdmins, listUpdateRequests } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/auth";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createSchoolAction(_prev: { error?: string } | undefined, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "School name is required." };

  const nameAr = String(formData.get("name_ar") ?? "").trim() || null;
  const tier = String(formData.get("tier") ?? "B") as "A" | "B" | "C";
  const district = String(formData.get("district") ?? "").trim() || null;
  const contactName = String(formData.get("contact_name") ?? "").trim() || null;
  const contactPhone = String(formData.get("contact_phone") ?? "").trim() || null;
  const contactEmail = String(formData.get("contact_email") ?? "").trim() || null;
  const referralSlugRaw = String(formData.get("referral_slug") ?? "").trim();
  const referralSlug = slugify(referralSlugRaw || name);

  const db = getDb();
  const [created] = await db
    .insert(schools)
    .values({
      name,
      nameAr,
      tier,
      district,
      contactName,
      contactPhone,
      contactEmail,
      referralSlug,
    })
    .returning({ id: schools.id });

  revalidatePath("/admin/schools");
  redirect(`/admin/schools/${created.id}`);
}

export async function updateSchoolAction(_prev: { error?: string } | undefined, formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return { error: "School name is required." };

  const db = getDb();
  await db
    .update(schools)
    .set({
      name,
      nameAr: String(formData.get("name_ar") ?? "").trim() || null,
      tier: String(formData.get("tier") ?? "B") as "A" | "B" | "C",
      district: String(formData.get("district") ?? "").trim() || null,
      contactName: String(formData.get("contact_name") ?? "").trim() || null,
      contactPhone: String(formData.get("contact_phone") ?? "").trim() || null,
      contactEmail: String(formData.get("contact_email") ?? "").trim() || null,
      status: String(formData.get("status") ?? "active") as "active" | "inactive",
    })
    .where(eq(schools.id, id));

  revalidatePath(`/admin/schools/${id}`);
  revalidatePath("/admin/schools");
  return { error: undefined };
}

export async function createGradeAction(formData: FormData) {
  await requireAdmin();
  const schoolId = Number(formData.get("school_id"));
  const label = String(formData.get("label") ?? "").trim();
  if (!schoolId || !label) return;

  const db = getDb();
  await db.insert(grades).values({
    schoolId,
    label,
    curriculum: String(formData.get("curriculum") ?? "").trim() || null,
    sortOrder: Number(formData.get("sort_order") ?? 0) || 0,
  });

  revalidatePath(`/admin/schools/${schoolId}`);
}

export async function toggleGradeActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const schoolId = Number(formData.get("school_id"));
  const active = formData.get("active") === "1";
  if (!id) return;

  const db = getDb();
  await db.update(grades).set({ active: !active }).where(eq(grades.id, id));
  revalidatePath(`/admin/schools/${schoolId}`);
}

export async function createBrandRuleAction(formData: FormData) {
  await requireAdmin();
  const schoolId = Number(formData.get("school_id"));
  const skuCategory = String(formData.get("sku_category") ?? "").trim();
  const brand = String(formData.get("brand") ?? "").trim();
  const rule = String(formData.get("rule") ?? "") as "REQUIRE" | "FORBID";
  if (!schoolId || !skuCategory || !brand || (rule !== "REQUIRE" && rule !== "FORBID")) return;

  const db = getDb();
  await db.insert(schoolBrandRules).values({
    schoolId,
    skuCategory,
    brand,
    rule,
    note: String(formData.get("note") ?? "").trim() || null,
  });

  revalidatePath(`/admin/schools/${schoolId}`);
}

export async function deleteBrandRuleAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const schoolId = Number(formData.get("school_id"));
  if (!id) return;

  const db = getDb();
  await db.delete(schoolBrandRules).where(eq(schoolBrandRules.id, id));
  revalidatePath(`/admin/schools/${schoolId}`);
}

export async function createSchoolAdminAction(_prev: { error?: string } | undefined, formData: FormData) {
  await requireAdmin();
  const schoolId = Number(formData.get("school_id"));
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim() || null;
  if (!schoolId || !email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const db = getDb();
  const [existing] = await db.select().from(schoolAdmins).where(eq(schoolAdmins.email, email)).limit(1);
  if (existing) return { error: "That email is already a portal login." };

  await db.insert(schoolAdmins).values({
    schoolId,
    email,
    name,
    passwordHash: await hashPassword(password),
  });

  revalidatePath(`/admin/schools/${schoolId}`);
  return { error: undefined };
}

export async function resetSchoolAdminPasswordAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const schoolId = Number(formData.get("school_id"));
  const password = String(formData.get("password") ?? "");
  if (!id || password.length < 8) return;

  const db = getDb();
  await db.update(schoolAdmins).set({ passwordHash: await hashPassword(password) }).where(eq(schoolAdmins.id, id));
  revalidatePath(`/admin/schools/${schoolId}`);
}

export async function deleteSchoolAdminAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const schoolId = Number(formData.get("school_id"));
  if (!id) return;

  const db = getDb();
  await db.delete(schoolAdmins).where(eq(schoolAdmins.id, id));
  revalidatePath(`/admin/schools/${schoolId}`);
}

export async function updateListUpdateRequestStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const schoolId = Number(formData.get("school_id"));
  const status = String(formData.get("status") ?? "") as "open" | "acknowledged" | "done";
  if (!id || !["open", "acknowledged", "done"].includes(status)) return;

  const db = getDb();
  await db.update(listUpdateRequests).set({ status }).where(eq(listUpdateRequests.id, id));
  revalidatePath(`/admin/schools/${schoolId}`);
}
