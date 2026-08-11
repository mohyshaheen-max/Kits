"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { schoolLists, listItems } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function createListAction(formData: FormData) {
  await requireAdmin();
  const schoolId = Number(formData.get("school_id"));
  const gradeId = Number(formData.get("grade_id"));
  const academicYear = String(formData.get("academic_year") ?? "").trim();
  if (!schoolId || !gradeId || !academicYear) return;

  const db = getDb();
  const [created] = await db
    .insert(schoolLists)
    .values({ schoolId, gradeId, academicYear })
    .returning({ id: schoolLists.id });

  revalidatePath(`/admin/schools/${schoolId}`);
  redirect(`/admin/lists/${created.id}`);
}

export async function updateListStatusAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "") as "draft" | "live" | "archived";
  if (!id || !["draft", "live", "archived"].includes(status)) return;

  const db = getDb();
  await db
    .update(schoolLists)
    .set({ status, publishedAt: status === "live" ? new Date().toISOString() : undefined })
    .where(eq(schoolLists.id, id));

  revalidatePath(`/admin/lists/${id}`);
}

export async function addListItemAction(formData: FormData) {
  await requireAdmin();
  const listId = Number(formData.get("list_id"));
  if (!listId) return;

  const skuIdRaw = formData.get("sku_id");
  const skuId = skuIdRaw ? Number(skuIdRaw) : null;
  const qtyRaw = String(formData.get("qty") ?? "").trim();
  const isExcluded = formData.get("is_excluded") === "1";

  const db = getDb();
  await db.insert(listItems).values({
    listId,
    skuId: isExcluded ? null : skuId,
    rawText: String(formData.get("raw_text") ?? "").trim() || null,
    qty: qtyRaw === "" ? null : Number(qtyRaw),
    subject: String(formData.get("subject") ?? "").trim() || null,
    isOptional: formData.get("is_optional") === "1",
    isExcluded,
    exclusionReason: isExcluded ? String(formData.get("exclusion_reason") ?? "").trim() || null : null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath(`/admin/lists/${listId}`);
}

export async function deleteListItemAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const listId = Number(formData.get("list_id"));
  if (!id) return;

  const db = getDb();
  await db.delete(listItems).where(eq(listItems.id, id));
  revalidatePath(`/admin/lists/${listId}`);
}
