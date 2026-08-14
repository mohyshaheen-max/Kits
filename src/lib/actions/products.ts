"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { products, skus } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

type FormState = { error?: string } | undefined;

export async function createProductAction(_prev: FormState, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!name || !category) return { error: "Name and category are required." };

  const db = getDb();
  const [created] = await db
    .insert(products)
    .values({
      name,
      nameAr: String(formData.get("name_ar") ?? "").trim() || null,
      category,
    })
    .returning({ id: products.id });

  revalidatePath("/admin/skus");
  redirect(`/admin/products/${created.id}`);
}

export async function updateProductAction(_prev: FormState, formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Missing product id." };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  if (!name || !category) return { error: "Name and category are required." };

  const db = getDb();
  await db
    .update(products)
    .set({
      name,
      nameAr: String(formData.get("name_ar") ?? "").trim() || null,
      category,
      active: formData.get("active") === "1",
    })
    .where(eq(products.id, id));

  // Every variant's category is denormalized from its product so that
  // existing category-based logic (filters, brand rules) stays correct.
  await db.update(skus).set({ category }).where(eq(skus.productId, id));

  revalidatePath("/admin/skus");
  revalidatePath(`/admin/products/${id}`);
  return { error: undefined };
}
