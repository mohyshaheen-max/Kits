import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { kits, kitItems, skus, schools, grades, schoolLists, schoolBrandRules } from "@/db/schema";
import {
  updateKitItemAction,
  addKitItemAction,
  removeKitItemAction,
  archiveKitAction,
  duplicateKitAction,
} from "@/lib/actions/kits";
import { computeKitTotals } from "@/lib/kit-pricing";
import { inputClass } from "@/components/admin/form-controls";
import PublishButton from "./publish-button";

const MARGIN_WARNING_THRESHOLD = 30; // %

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  review: "bg-amber-100 text-amber-700",
  live: "bg-emerald-100 text-emerald-700",
  archived: "bg-neutral-100 text-neutral-400",
};

export default async function KitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kitId = Number(id);
  if (!kitId) notFound();

  const db = getDb();
  const [kit] = await db.select().from(kits).where(eq(kits.id, kitId)).limit(1);
  if (!kit) notFound();

  const [school, grade, list, rows, forbidRules, allSkus] = await Promise.all([
    db.select().from(schools).where(eq(schools.id, kit.schoolId)).then((r) => r[0]),
    db.select().from(grades).where(eq(grades.id, kit.gradeId)).then((r) => r[0]),
    db.select().from(schoolLists).where(eq(schoolLists.id, kit.listId)).then((r) => r[0]),
    db
      .select({ item: kitItems, sku: skus })
      .from(kitItems)
      .innerJoin(skus, eq(kitItems.skuId, skus.id))
      .where(eq(kitItems.kitId, kitId))
      .orderBy(asc(kitItems.sortOrder), asc(kitItems.id)),
    db.select().from(schoolBrandRules).where(eq(schoolBrandRules.schoolId, kit.schoolId)),
    db.select().from(skus).where(eq(skus.active, true)).orderBy(asc(skus.category), asc(skus.name)),
  ]);

  const totals = computeKitTotals(
    rows.map(({ item, sku }) => ({ qty: item.qty, unitPrice: item.unitPrice, skuTier: sku.tier, skuCost: sku.unitCost }))
  );

  const forbidByCategoryBrand = new Map(
    forbidRules.filter((r) => r.rule === "FORBID").map((r) => [`${r.skuCategory}::${r.brand.toLowerCase()}`, r])
  );
  const requireRules = forbidRules.filter((r) => r.rule === "REQUIRE");

  const marginWarning = totals.basePrice > 0 && totals.marginPct < MARGIN_WARNING_THRESHOLD;
  const violatingRows = rows.filter(
    ({ sku }) => sku.brand && forbidByCategoryBrand.has(`${sku.category}::${sku.brand.toLowerCase()}`)
  );

  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.item.subject ?? "General";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(row);
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/kits" className="text-xs text-neutral-400 hover:text-neutral-700">
            ← Kits
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-neutral-900">{kit.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[kit.status]}`}>
              {kit.status}
            </span>
            <span>v{kit.version}</span>
            <Link href={`/admin/lists/${kit.listId}`} className="hover:underline">
              source list: {list?.academicYear}
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {kit.status !== "live" && <PublishButton kitId={kit.id} />}
          {kit.status === "live" && (
            <>
              <Link
                href={`/s/${school?.referralSlug}/${kit.gradeId}`}
                target="_blank"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                View storefront →
              </Link>
              <form action={archiveKitAction}>
                <input type="hidden" name="kit_id" value={kit.id} />
                <button type="submit" className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100">
                  Archive
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Cost panel */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-neutral-500">Retail (base price)</p>
            <p className="text-lg font-semibold text-neutral-900">{totals.basePrice.toFixed(2)} EGP</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">COGS</p>
            <p className="text-lg font-semibold text-neutral-900">{totals.cogs.toFixed(2)} EGP</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Margin</p>
            <p className={`text-lg font-semibold ${marginWarning ? "text-amber-600" : "text-neutral-900"}`}>
              {totals.marginPct.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Brand-mandated share</p>
            <p className="text-lg font-semibold text-neutral-900">{totals.brandSharePct.toFixed(1)}%</p>
          </div>
        </div>

        {marginWarning && (
          <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
            Margin is below the {MARGIN_WARNING_THRESHOLD}% threshold.
          </p>
        )}
        {violatingRows.length > 0 && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {violatingRows.length} line(s) use a brand this school FORBIDs:{" "}
            {violatingRows.map((r) => r.sku.name).join(", ")}.
          </p>
        )}
        {requireRules.length > 0 && (
          <p className="mt-3 text-xs text-neutral-500">
            This school REQUIREs: {requireRules.map((r) => `${r.brand} (${r.skuCategory})`).join(", ")}.
          </p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([subject, subjectRows]) => (
          <div key={subject} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              {subject}
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-neutral-400">
                <tr>
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 font-medium">Qty</th>
                  <th className="px-4 py-2 font-medium">Unit price</th>
                  <th className="px-4 py-2 font-medium">Line total</th>
                  <th className="px-4 py-2 font-medium">Core</th>
                  <th className="px-4 py-2 font-medium">Optional</th>
                  <th className="px-4 py-2 font-medium">Sub. allowed</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {subjectRows.map(({ item, sku }) => {
                  const violates = sku.brand && forbidByCategoryBrand.has(`${sku.category}::${sku.brand.toLowerCase()}`);
                  return (
                    <tr key={item.id} className={violates ? "bg-red-50/50" : undefined}>
                      <td className="px-4 py-2">
                        <form action={updateKitItemAction} id={`item-${item.id}`} className="contents">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="kit_id" value={kit.id} />
                        </form>
                        <p className="font-medium text-neutral-900">{sku.name}</p>
                        <p className="text-xs text-neutral-400">
                          {sku.code} · {sku.tier}
                          {sku.brand ? ` · ${sku.brand}` : ""}
                        </p>
                        {violates && <p className="text-xs font-medium text-red-600">FORBIDden brand at this school</p>}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          name="qty"
                          type="number"
                          min={0}
                          defaultValue={item.qty ?? ""}
                          placeholder="null"
                          className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          name="unit_price"
                          type="number"
                          step="0.01"
                          defaultValue={item.unitPrice}
                          className="w-20 rounded-md border border-neutral-300 px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-neutral-600">
                        {item.qty === null ? "—" : (item.qty * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          type="checkbox"
                          name="is_core"
                          value="1"
                          defaultChecked={item.isCore}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          type="checkbox"
                          name="is_optional"
                          value="1"
                          defaultChecked={item.isOptional}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          type="checkbox"
                          name="substitution_allowed"
                          value="1"
                          defaultChecked={item.substitutionAllowed}
                        />
                      </td>
                      <td className="space-x-2 px-4 py-2 text-right">
                        <input type="hidden" form={`item-${item.id}`} name="subject" value={item.subject ?? ""} />
                        <button form={`item-${item.id}`} type="submit" className="text-xs font-medium text-neutral-700 hover:underline">
                          Save
                        </button>
                        <form action={removeKitItemAction} className="inline">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="kit_id" value={kit.id} />
                          <button type="submit" className="text-xs text-neutral-400 hover:text-red-600">
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-400">
            No items in this kit yet.
          </p>
        )}
      </div>

      {/* Add item */}
      <details className="rounded-lg border border-neutral-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-900">Add item to kit</summary>
        <form action={addKitItemAction} className="mt-4 grid grid-cols-5 items-end gap-3">
          <input type="hidden" name="kit_id" value={kit.id} />
          <div className="col-span-2">
            <label className="block text-xs text-neutral-500">SKU</label>
            <select name="sku_id" required className={inputClass}>
              {allSkus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.category} — {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Qty</label>
            <input name="qty" type="number" min={0} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Subject</label>
            <input name="subject" className={inputClass} />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <label className="flex items-center gap-1 text-xs text-neutral-600">
              <input type="checkbox" name="is_optional" value="1" /> Optional
            </label>
            <button type="submit" className="rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-neutral-800">
              Add
            </button>
          </div>
        </form>
      </details>

      {/* Duplicate to next year */}
      <details className="rounded-lg border border-neutral-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-900">Duplicate to next academic year</summary>
        <form action={duplicateKitAction} className="mt-4 flex items-end gap-3">
          <input type="hidden" name="kit_id" value={kit.id} />
          <div>
            <label className="block text-xs text-neutral-500">New academic year</label>
            <input name="academic_year" required placeholder="2027/28" className={inputClass} />
          </div>
          <button type="submit" className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
            Duplicate as draft
          </button>
        </form>
      </details>

      <p className="text-xs text-neutral-400">
        {school?.name} · {grade?.label}
      </p>
    </div>
  );
}
