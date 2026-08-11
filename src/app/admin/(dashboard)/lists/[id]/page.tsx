import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { schoolLists, schools, grades, listItems, skus, kits } from "@/db/schema";
import { updateListStatusAction, addListItemAction, deleteListItemAction } from "@/lib/actions/lists";
import { generateKitFromListAction } from "@/lib/actions/kits";
import { inputClass } from "@/components/admin/form-controls";

export default async function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const listId = Number(id);
  if (!listId) notFound();

  const db = getDb();
  const [list] = await db
    .select({
      id: schoolLists.id,
      schoolId: schoolLists.schoolId,
      gradeId: schoolLists.gradeId,
      academicYear: schoolLists.academicYear,
      status: schoolLists.status,
      schoolName: schools.name,
      gradeLabel: grades.label,
    })
    .from(schoolLists)
    .innerJoin(schools, eq(schoolLists.schoolId, schools.id))
    .innerJoin(grades, eq(schoolLists.gradeId, grades.id))
    .where(eq(schoolLists.id, listId))
    .limit(1);
  if (!list) notFound();

  const [items, allSkus, existingKits] = await Promise.all([
    db.select().from(listItems).where(eq(listItems.listId, listId)).orderBy(asc(listItems.id)),
    db.select().from(skus).where(eq(skus.active, true)).orderBy(asc(skus.category), asc(skus.name)),
    db.select().from(kits).where(eq(kits.listId, listId)),
  ]);

  const skuMap = Object.fromEntries(allSkus.map((s) => [s.id, s]));
  const unresolvedNullQty = items.filter((i) => !i.isExcluded && i.qty === null).length;
  const excludedCount = items.filter((i) => i.isExcluded).length;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link href={`/admin/schools/${list.schoolId}`} className="text-xs text-neutral-400 hover:text-neutral-700">
          ← {list.schoolName}
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">
          {list.schoolName} — {list.gradeLabel} — {list.academicYear}
        </h1>
        <div className="mt-2 flex items-center gap-3">
          <form action={updateListStatusAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={list.id} />
            <select name="status" defaultValue={list.status} className="rounded-md border border-neutral-300 px-2 py-1 text-xs">
              <option value="draft">draft</option>
              <option value="live">live</option>
              <option value="archived">archived</option>
            </select>
            <button type="submit" className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
              Update status
            </button>
          </form>
          {unresolvedNullQty > 0 && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {unresolvedNullQty} item(s) missing a quantity
            </span>
          )}
          {excludedCount > 0 && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
              {excludedCount} excluded
            </span>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        {existingKits.length > 0 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-600">
              {existingKits.length} kit{existingKits.length > 1 ? "s" : ""} generated from this list.
            </p>
            <div className="flex gap-3">
              {existingKits.map((k) => (
                <Link key={k.id} href={`/admin/kits/${k.id}`} className="text-sm font-medium text-neutral-900 hover:underline">
                  Open {k.name} →
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <form action={generateKitFromListAction} className="flex items-center justify-between">
            <input type="hidden" name="list_id" value={list.id} />
            <p className="text-sm text-neutral-600">
              No kit yet. Generating copies every sellable line into an editable kit and auto-drops exclusions.
            </p>
            <button
              type="submit"
              className="shrink-0 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Generate kit from list
            </button>
          </form>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Subject</th>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Flags</th>
              <th className="px-4 py-2 font-medium">Notes</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => {
              const sku = item.skuId ? skuMap[item.skuId] : undefined;
              return (
                <tr key={item.id} className={item.isExcluded ? "bg-red-50/40" : ""}>
                  <td className="px-4 py-2 text-neutral-600">{item.subject ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-900">
                    {sku ? sku.name : item.rawText}
                    {item.isExcluded && (
                      <p className="text-xs text-red-600">{item.exclusionReason}</p>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {item.isExcluded ? (
                      "—"
                    ) : item.qty === null ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        NULL
                      </span>
                    ) : (
                      item.qty
                    )}
                  </td>
                  <td className="px-4 py-2 space-x-1">
                    {item.isOptional && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        optional
                      </span>
                    )}
                    {item.isExcluded && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        excluded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-neutral-500">{item.notes ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteListItemAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <input type="hidden" name="list_id" value={list.id} />
                      <button type="submit" className="text-xs text-neutral-500 hover:text-red-600">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-sm text-neutral-400">
                  No items yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <details className="rounded-lg border border-neutral-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-medium text-neutral-900">Add item</summary>
        <form action={addListItemAction} className="mt-4 space-y-3">
          <input type="hidden" name="list_id" value={list.id} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-500">SKU (leave blank for excluded/unmapped items)</label>
              <select name="sku_id" className={inputClass} defaultValue="">
                <option value="">— none —</option>
                {allSkus.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.category} — {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Raw text (for excluded/unmapped items)</label>
              <input name="raw_text" className={inputClass} placeholder="e.g. Arabic Language Textbook" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-neutral-500">Qty (blank = unspecified)</label>
              <input name="qty" type="number" min={0} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Subject</label>
              <input name="subject" className={inputClass} />
            </div>
            <div className="flex items-end gap-2 pb-2">
              <label className="flex items-center gap-1 text-xs text-neutral-600">
                <input type="checkbox" name="is_optional" value="1" /> Optional
              </label>
            </div>
            <div className="flex items-end gap-2 pb-2">
              <label className="flex items-center gap-1 text-xs text-neutral-600">
                <input type="checkbox" name="is_excluded" value="1" /> Excluded
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Exclusion reason (if excluded)</label>
            <input name="exclusion_reason" className={inputClass} placeholder="Textbook — bookshop supply chain, not stationery" />
          </div>
          <div>
            <label className="block text-xs text-neutral-500">Notes</label>
            <input name="notes" className={inputClass} />
          </div>
          <button
            type="submit"
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Add item
          </button>
        </form>
      </details>
    </div>
  );
}
