"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { faqCategories, faqEntries } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function createFaqCategoryAction(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const db = getDb();
  await db.insert(faqCategories).values({ name });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaqCategoryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  const db = getDb();
  await db.delete(faqEntries).where(eq(faqEntries.categoryId, id));
  await db.delete(faqCategories).where(eq(faqCategories.id, id));
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function createFaqEntryAction(formData: FormData) {
  await requireAdmin();
  const categoryId = Number(formData.get("category_id"));
  const question = String(formData.get("question") ?? "").trim();
  const answer = String(formData.get("answer") ?? "").trim();
  if (!categoryId || !question || !answer) return;

  const db = getDb();
  await db.insert(faqEntries).values({ categoryId, question, answer });
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}

export async function deleteFaqEntryAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return;

  const db = getDb();
  await db.delete(faqEntries).where(eq(faqEntries.id, id));
  revalidatePath("/admin/faq");
  revalidatePath("/faq");
}
