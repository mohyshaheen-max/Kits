"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { skus, inventory, products } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

type FormState = { error?: string } | undefined;

function readSkuFields(formData: FormData) {
  return {
    productId: Number(formData.get("product_id") ?? 0),
    code: String(formData.get("code") ?? "").trim().toUpperCase(),
    name: String(formData.get("name") ?? "").trim(),
    nameAr: String(formData.get("name_ar") ?? "").trim() || null,
    spec: String(formData.get("spec") ?? "").trim() || null,
    size: String(formData.get("size") ?? "").trim() || null,
    colour: String(formData.get("colour") ?? "").trim() || null,
    brand: String(formData.get("brand") ?? "").trim() || null,
    tier: String(formData.get("tier") ?? "GEN") as "GEN" | "BRAND" | "ANY",
    unitCost: Number(formData.get("unit_cost") ?? 0) || 0,
    unitPrice: Number(formData.get("unit_price") ?? 0) || 0,
    active: formData.get("active") === "1",
  };
}

export async function createSkuAction(_prev: FormState, formData: FormData) {
  await requireAdmin();
  const fields = readSkuFields(formData);
  if (!fields.code || !fields.name || !fields.productId) {
    return { error: "Code, name, and product are required." };
  }

  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, fields.productId)).limit(1);
  if (!product) return { error: "Select a product for this SKU." };

  const existing = await db.select({ id: skus.id }).from(skus).where(eq(skus.code, fields.code)).limit(1);
  if (existing.length > 0) return { error: `SKU code "${fields.code}" is already in use.` };

  const [created] = await db
    .insert(skus)
    .values({ ...fields, category: product.category })
    .returning({ id: skus.id });
  await db.insert(inventory).values({ skuId: created.id, onHand: 0, reserved: 0, reorderPoint: 0 });

  revalidatePath("/admin/skus");
  revalidatePath(`/admin/products/${fields.productId}`);
  redirect(`/admin/skus/${created.id}`);
}

export async function updateSkuAction(_prev: FormState, formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!id) return { error: "Missing SKU id." };

  const fields = readSkuFields(formData);
  if (!fields.code || !fields.name || !fields.productId) {
    return { error: "Code, name, and product are required." };
  }

  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.id, fields.productId)).limit(1);
  if (!product) return { error: "Select a product for this SKU." };

  const existing = await db.select({ id: skus.id }).from(skus).where(eq(skus.code, fields.code)).limit(1);
  if (existing.length > 0 && existing[0].id !== id) {
    return { error: `SKU code "${fields.code}" is already in use.` };
  }

  await db.update(skus).set({ ...fields, category: product.category }).where(eq(skus.id, id));

  revalidatePath("/admin/skus");
  revalidatePath(`/admin/skus/${id}`);
  revalidatePath(`/admin/products/${fields.productId}`);
  return { error: undefined };
}

export async function toggleSkuActiveAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const active = formData.get("active") === "1";
  if (!id) return;

  const db = getDb();
  await db.update(skus).set({ active: !active }).where(eq(skus.id, id));
  revalidatePath("/admin/skus");
}
