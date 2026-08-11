"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, type Db } from "@/db";
import { kits, kitItems, schoolLists, listItems, skus, schools, grades, schoolBrandRules } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { computeKitTotals } from "@/lib/kit-pricing";
import { chunk } from "@/lib/chunk";

const KIT_ITEM_INSERT_BATCH_SIZE = 8; // kit_items has 11 bound params/row — stay well under D1's per-statement cap

async function recalcKitTotals(db: Db, kitId: number) {
  const rows = await db
    .select({ qty: kitItems.qty, unitPrice: kitItems.unitPrice, skuTier: skus.tier, skuCost: skus.unitCost })
    .from(kitItems)
    .innerJoin(skus, eq(kitItems.skuId, skus.id))
    .where(eq(kitItems.kitId, kitId));

  const totals = computeKitTotals(rows);

  await db
    .update(kits)
    .set({
      basePrice: totals.basePrice,
      cogs: totals.cogs,
      marginPct: totals.marginPct,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(kits.id, kitId));

  return totals;
}

export async function generateKitFromListAction(formData: FormData) {
  await requireAdmin();
  const listId = Number(formData.get("list_id"));
  if (!listId) return;

  const db = getDb();
  const [list] = await db.select().from(schoolLists).where(eq(schoolLists.id, listId)).limit(1);
  if (!list) return;
  const [school] = await db.select().from(schools).where(eq(schools.id, list.schoolId)).limit(1);
  const [grade] = await db.select().from(grades).where(eq(grades.id, list.gradeId)).limit(1);
  if (!school || !grade) return;

  const sellableItems = await db
    .select({ item: listItems, sku: skus })
    .from(listItems)
    .innerJoin(skus, eq(listItems.skuId, skus.id))
    .where(and(eq(listItems.listId, listId), eq(listItems.isExcluded, false)));

  const [kit] = await db
    .insert(kits)
    .values({
      schoolId: school.id,
      gradeId: grade.id,
      listId: list.id,
      academicYear: list.academicYear,
      name: `${school.name} — ${grade.label} — ${list.academicYear}`,
      status: "draft",
    })
    .returning({ id: kits.id });

  const newRows = sellableItems.map(({ item, sku }, idx) => ({
    kitId: kit.id,
    skuId: sku.id,
    qty: item.qty,
    unitPrice: sku.unitPrice,
    lineTotal: (item.qty ?? 0) * sku.unitPrice,
    subject: item.subject,
    isCore: !item.isOptional,
    isOptional: item.isOptional,
    sourceListItemId: item.id,
    substitutionAllowed: sku.tier !== "BRAND",
    sortOrder: idx,
  }));
  for (const batch of chunk(newRows, KIT_ITEM_INSERT_BATCH_SIZE)) {
    await db.insert(kitItems).values(batch);
  }

  await recalcKitTotals(db, kit.id);

  revalidatePath(`/admin/lists/${listId}`);
  redirect(`/admin/kits/${kit.id}`);
}

export async function updateKitItemAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const kitId = Number(formData.get("kit_id"));
  if (!id || !kitId) return;

  const qtyRaw = String(formData.get("qty") ?? "").trim();
  const qty = qtyRaw === "" ? null : Number(qtyRaw);
  const unitPrice = Number(formData.get("unit_price"));

  const db = getDb();
  await db
    .update(kitItems)
    .set({
      qty,
      unitPrice,
      lineTotal: (qty ?? 0) * unitPrice,
      subject: String(formData.get("subject") ?? "").trim() || null,
      isCore: formData.get("is_core") === "1",
      isOptional: formData.get("is_optional") === "1",
      substitutionAllowed: formData.get("substitution_allowed") === "1",
    })
    .where(eq(kitItems.id, id));

  await recalcKitTotals(db, kitId);
  revalidatePath(`/admin/kits/${kitId}`);
}

export async function addKitItemAction(formData: FormData) {
  await requireAdmin();
  const kitId = Number(formData.get("kit_id"));
  const skuId = Number(formData.get("sku_id"));
  if (!kitId || !skuId) return;

  const db = getDb();
  const [sku] = await db.select().from(skus).where(eq(skus.id, skuId)).limit(1);
  if (!sku) return;

  const qtyRaw = String(formData.get("qty") ?? "").trim();
  const qty = qtyRaw === "" ? null : Number(qtyRaw);
  const isOptional = formData.get("is_optional") === "1";

  await db.insert(kitItems).values({
    kitId,
    skuId,
    qty,
    unitPrice: sku.unitPrice,
    lineTotal: (qty ?? 0) * sku.unitPrice,
    subject: String(formData.get("subject") ?? "").trim() || null,
    isCore: !isOptional,
    isOptional,
    substitutionAllowed: sku.tier !== "BRAND",
  });

  await recalcKitTotals(db, kitId);
  revalidatePath(`/admin/kits/${kitId}`);
}

export async function removeKitItemAction(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const kitId = Number(formData.get("kit_id"));
  if (!id || !kitId) return;

  const db = getDb();
  await db.delete(kitItems).where(eq(kitItems.id, id));
  await recalcKitTotals(db, kitId);
  revalidatePath(`/admin/kits/${kitId}`);
}

export async function publishKitAction(
  _prev: { errors: string[] } | undefined,
  formData: FormData
): Promise<{ errors: string[] }> {
  await requireAdmin();
  const kitId = Number(formData.get("kit_id"));
  if (!kitId) return { errors: ["Missing kit id."] };

  const db = getDb();
  const [kit] = await db.select().from(kits).where(eq(kits.id, kitId)).limit(1);
  if (!kit) return { errors: ["Kit not found."] };

  const rows = await db
    .select({ item: kitItems, sku: skus })
    .from(kitItems)
    .innerJoin(skus, eq(kitItems.skuId, skus.id))
    .where(eq(kitItems.kitId, kitId));

  const errors: string[] = [];
  if (rows.length === 0) errors.push("Kit has no items.");

  for (const { item, sku } of rows) {
    if (item.qty === null) errors.push(`"${sku.name}" has no quantity set.`);
    if (!sku.active) errors.push(`"${sku.name}" is no longer active in the catalogue.`);
  }

  const forbidRules = await db
    .select()
    .from(schoolBrandRules)
    .where(and(eq(schoolBrandRules.schoolId, kit.schoolId), eq(schoolBrandRules.rule, "FORBID")));

  for (const { sku } of rows) {
    const violated = forbidRules.find(
      (r) => r.skuCategory === sku.category && sku.brand && r.brand.toLowerCase() === sku.brand.toLowerCase()
    );
    if (violated) {
      errors.push(`"${sku.name}" (${sku.brand}) is FORBIDden at this school${violated.note ? ` — ${violated.note}` : ""}.`);
    }
  }

  const unresolvedExclusions = await db
    .select()
    .from(listItems)
    .where(
      and(
        eq(listItems.listId, kit.listId),
        eq(listItems.isExcluded, true),
        sql`(${listItems.exclusionReason} IS NULL OR ${listItems.exclusionReason} = '')`
      )
    );
  if (unresolvedExclusions.length > 0) {
    errors.push(`${unresolvedExclusions.length} excluded list item(s) are missing an exclusion reason.`);
  }

  if (errors.length > 0) return { errors };

  await db
    .update(kits)
    .set({
      status: "live",
      version: kit.version + 1,
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .where(eq(kits.id, kitId));

  revalidatePath(`/admin/kits/${kitId}`);
  revalidatePath("/admin/kits");
  return { errors: [] };
}

export async function archiveKitAction(formData: FormData) {
  await requireAdmin();
  const kitId = Number(formData.get("kit_id"));
  if (!kitId) return;

  const db = getDb();
  await db.update(kits).set({ status: "archived", updatedAt: new Date().toISOString() }).where(eq(kits.id, kitId));
  revalidatePath(`/admin/kits/${kitId}`);
  revalidatePath("/admin/kits");
}

export async function duplicateKitAction(formData: FormData) {
  await requireAdmin();
  const kitId = Number(formData.get("kit_id"));
  const academicYear = String(formData.get("academic_year") ?? "").trim();
  if (!kitId || !academicYear) return;

  const db = getDb();
  const [source] = await db.select().from(kits).where(eq(kits.id, kitId)).limit(1);
  if (!source) return;
  const items = await db.select().from(kitItems).where(eq(kitItems.kitId, kitId));

  const [newKit] = await db
    .insert(kits)
    .values({
      schoolId: source.schoolId,
      gradeId: source.gradeId,
      listId: source.listId,
      academicYear,
      name: source.name.includes(source.academicYear)
        ? source.name.replace(source.academicYear, academicYear)
        : `${source.name} (${academicYear})`,
      status: "draft",
      basePrice: source.basePrice,
      cogs: source.cogs,
      marginPct: source.marginPct,
      labelingAvailable: source.labelingAvailable,
    })
    .returning({ id: kits.id });

  const clonedRows = items.map((i) => ({
    kitId: newKit.id,
    skuId: i.skuId,
    qty: i.qty,
    unitPrice: i.unitPrice,
    lineTotal: i.lineTotal,
    subject: i.subject,
    isCore: i.isCore,
    isOptional: i.isOptional,
    sourceListItemId: i.sourceListItemId,
    substitutionAllowed: i.substitutionAllowed,
    sortOrder: i.sortOrder,
  }));
  for (const batch of chunk(clonedRows, KIT_ITEM_INSERT_BATCH_SIZE)) {
    await db.insert(kitItems).values(batch);
  }

  revalidatePath("/admin/kits");
  redirect(`/admin/kits/${newKit.id}`);
}
