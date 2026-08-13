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

const MARGIN_WARN_THRESHOLD = 30; // %
const MARGIN_ERROR_THRESHOLD = 20; // %

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-canvas text-ink-600",
  review: "bg-warn-bg text-warn",
  live: "bg-ok-bg text-ok",
  archived: "bg-canvas text-ink-400",
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

  const marginError = totals.basePrice > 0 && totals.marginPct < MARGIN_ERROR_THRESHOLD;
  const marginWarning = totals.basePrice > 0 && !marginError && totals.marginPct < MARGIN_WARN_THRESHOLD;
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
          <Link href="/admin/kits" className="text-xs text-ink-400 hover:text-ink-600">
            ← Kits
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-ink-900">{kit.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-ink-400">
            <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[kit.status]}`}>
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
                className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
              >
                View storefront →
              </Link>
              <form action={archiveKitAction}>
                <input type="hidden" name="kit_id" value={kit.id} />
                <button type="submit" className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-600 hover:bg-teal-050">
                  Archive
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Cost panel */}
      <div className="rounded-md border border-line bg-surface p-4">
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-ink-400">Retail (base price)</p>
            <p className="font-mono text-lg font-semibold text-ink-900">{totals.basePrice.toFixed(2)} EGP</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">COGS</p>
            <p className="font-mono text-lg font-semibold text-ink-900">{totals.cogs.toFixed(2)} EGP</p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Margin</p>
            <p
              className={`font-mono text-lg font-semibold ${
                marginError ? "text-error" : marginWarning ? "text-warn" : "text-ink-900"
              }`}
            >
              {totals.marginPct.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-ink-400">Brand-mandated share</p>
            <p className="font-mono text-lg font-semibold text-ink-900">{totals.brandSharePct.toFixed(1)}%</p>
          </div>
        </div>

        {marginError && (
          <p className="mt-3 rounded-md bg-error-bg px-3 py-2 text-sm text-error">
            Margin is below the {MARGIN_ERROR_THRESHOLD}% threshold.
          </p>
        )}
        {marginWarning && (
          <p className="mt-3 rounded-md bg-warn-bg px-3 py-2 text-sm text-warn">
            Margin is below the {MARGIN_WARN_THRESHOLD}% threshold.
          </p>
        )}
        {violatingRows.length > 0 && (
          <p className="mt-3 rounded-md bg-error-bg px-3 py-2 text-sm text-error">
            {violatingRows.length} line(s) use a brand this school FORBIDs:{" "}
            {violatingRows.map((r) => r.sku.name).join(", ")}.
          </p>
        )}
        {requireRules.length > 0 && (
          <p className="mt-3 text-xs text-ink-400">
            This school REQUIREs: {requireRules.map((r) => `${r.brand} (${r.skuCategory})`).join(", ")}.
          </p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-6">
        {Array.from(grouped.entries()).map(([subject, subjectRows]) => (
          <div key={subject} className="overflow-hidden rounded-md border border-line bg-surface">
            <div className="border-b border-line bg-canvas px-4 py-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
              {subject}
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-ink-400">
                <tr>
                  <th className="px-4 py-2 font-medium">SKU</th>
                  <th className="px-4 py-2 text-right font-medium">Qty</th>
                  <th className="px-4 py-2 text-right font-medium">Unit price</th>
                  <th className="px-4 py-2 text-right font-medium">Line total</th>
                  <th className="px-4 py-2 font-medium">Core</th>
                  <th className="px-4 py-2 font-medium">Optional</th>
                  <th className="px-4 py-2 font-medium">Sub. allowed</th>
                  <th className="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {subjectRows.map(({ item, sku }) => {
                  const violates = sku.brand && forbidByCategoryBrand.has(`${sku.category}::${sku.brand.toLowerCase()}`);
                  return (
                    <tr key={item.id} className={violates ? "bg-error-bg/50" : undefined}>
                      <td className="px-4 py-2">
                        <form action={updateKitItemAction} id={`item-${item.id}`} className="contents">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="kit_id" value={kit.id} />
                        </form>
                        <p className="font-medium text-ink-900">{sku.name}</p>
                        <p className="font-mono text-xs text-ink-400">
                          {sku.code} · {sku.tier}
                          {sku.brand ? ` · ${sku.brand}` : ""}
                        </p>
                        {violates && <p className="text-xs font-medium text-error">FORBIDden brand at this school</p>}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          form={`item-${item.id}`}
                          name="qty"
                          type="number"
                          min={0}
                          defaultValue={item.qty ?? ""}
                          placeholder="null"
                          className="w-20 rounded-sm border border-line px-2 py-1 text-right font-mono text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-right">
                        <input
                          form={`item-${item.id}`}
                          name="unit_price"
                          type="number"
                          step="0.01"
                          defaultValue={item.unitPrice}
                          className="w-20 rounded-sm border border-line px-2 py-1 text-right font-mono text-sm"
                        />
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-ink-600">
                        {item.qty === null ? "—" : (item.qty * item.unitPrice).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          type="checkbox"
                          name="is_core"
                          value="1"
                          defaultChecked={item.isCore}
                          className="accent-teal-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          type="checkbox"
                          name="is_optional"
                          value="1"
                          defaultChecked={item.isOptional}
                          className="accent-teal-600"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          form={`item-${item.id}`}
                          type="checkbox"
                          name="substitution_allowed"
                          value="1"
                          defaultChecked={item.substitutionAllowed}
                          className="accent-teal-600"
                        />
                      </td>
                      <td className="space-x-2 px-4 py-2 text-right">
                        <input type="hidden" form={`item-${item.id}`} name="subject" value={item.subject ?? ""} />
                        <button form={`item-${item.id}`} type="submit" className="text-xs font-medium text-ink-600 hover:underline">
                          Save
                        </button>
                        <form action={removeKitItemAction} className="inline">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="kit_id" value={kit.id} />
                          <button type="submit" className="text-xs text-ink-400 hover:text-error">
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
          <p className="rounded-md border border-dashed border-line bg-surface p-6 text-center text-sm text-ink-400">
            No items in this kit yet.
          </p>
        )}
      </div>

      {/* Add item */}
      <details className="rounded-md border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-ink-900">Add item to kit</summary>
        <form action={addKitItemAction} className="mt-4 grid grid-cols-5 items-end gap-3">
          <input type="hidden" name="kit_id" value={kit.id} />
          <div className="col-span-2">
            <label className="block text-xs text-ink-400">SKU</label>
            <select name="sku_id" required className={inputClass}>
              {allSkus.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.category} — {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink-400">Qty</label>
            <input name="qty" type="number" min={0} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs text-ink-400">Subject</label>
            <input name="subject" className={inputClass} />
          </div>
          <div className="flex items-center gap-2 pb-2">
            <label className="flex items-center gap-1 text-xs text-ink-600">
              <input type="checkbox" name="is_optional" value="1" className="accent-teal-600" /> Optional
            </label>
            <button type="submit" className="rounded-md bg-teal-600 px-3 py-2 text-xs font-medium text-white hover:bg-teal-700">
              Add
            </button>
          </div>
        </form>
      </details>

      {/* Duplicate to next year */}
      <details className="rounded-md border border-line bg-surface p-4">
        <summary className="cursor-pointer text-sm font-medium text-ink-900">Duplicate to next academic year</summary>
        <form action={duplicateKitAction} className="mt-4 flex items-end gap-3">
          <input type="hidden" name="kit_id" value={kit.id} />
          <div>
            <label className="block text-xs text-ink-400">New academic year</label>
            <input name="academic_year" required placeholder="2027/28" className={inputClass} />
          </div>
          <button type="submit" className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700">
            Duplicate as draft
          </button>
        </form>
      </details>

      <p className="text-xs text-ink-400">
        {school?.name} · {grade?.label}
      </p>
    </div>
  );
}
