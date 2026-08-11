import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, sql, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, schoolBrandRules, schoolLists } from "@/db/schema";
import {
  createGradeAction,
  toggleGradeActiveAction,
  createBrandRuleAction,
  deleteBrandRuleAction,
} from "@/lib/actions/schools";
import { createListAction } from "@/lib/actions/lists";
import SchoolDetailsForm from "./school-details-form";
import { inputClass } from "@/components/admin/form-controls";

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schoolId = Number(id);
  if (!schoolId) notFound();

  const db = getDb();
  const [school] = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
  if (!school) notFound();

  const [schoolGrades, brandRules, lists] = await Promise.all([
    db.select().from(grades).where(eq(grades.schoolId, schoolId)).orderBy(asc(grades.sortOrder)),
    db.select().from(schoolBrandRules).where(eq(schoolBrandRules.schoolId, schoolId)),
    db
      .select({
        id: schoolLists.id,
        academicYear: schoolLists.academicYear,
        status: schoolLists.status,
        gradeId: schoolLists.gradeId,
        gradeLabel: grades.label,
        itemCount: sql<number>`(select count(*) from list_items where list_items.list_id = school_lists.id)`,
      })
      .from(schoolLists)
      .innerJoin(grades, eq(schoolLists.gradeId, grades.id))
      .where(eq(schoolLists.schoolId, schoolId)),
  ]);

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <Link href="/admin/schools" className="text-xs text-neutral-400 hover:text-neutral-700">
          ← Schools
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-neutral-900">{school.name}</h1>
        <p className="text-sm text-neutral-500">/s/{school.referralSlug}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Details</h2>
        <SchoolDetailsForm school={school} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Grades</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2 font-medium">Curriculum</th>
                <th className="px-4 py-2 font-medium">Active</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {schoolGrades.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2 font-medium text-neutral-900">{g.label}</td>
                  <td className="px-4 py-2 text-neutral-600">{g.curriculum ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        g.active ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-500"
                      }`}
                    >
                      {g.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={toggleGradeActiveAction}>
                      <input type="hidden" name="id" value={g.id} />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <input type="hidden" name="active" value={g.active ? "1" : "0"} />
                      <button type="submit" className="text-xs text-neutral-500 hover:text-neutral-900">
                        {g.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {schoolGrades.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-neutral-400">
                    No grades yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <form action={createGradeAction} className="flex items-end gap-2 border-t border-neutral-200 p-3">
            <input type="hidden" name="school_id" value={schoolId} />
            <div className="flex-1">
              <label className="block text-xs text-neutral-500">Label</label>
              <input name="label" required placeholder="Year 5" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-500">Curriculum</label>
              <input name="curriculum" placeholder="National" className={inputClass} />
            </div>
            <div className="w-20">
              <label className="block text-xs text-neutral-500">Order</label>
              <input name="sort_order" type="number" defaultValue={schoolGrades.length} className={inputClass} />
            </div>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Add grade
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Brand rules</h2>
        <p className="mt-1 text-xs text-neutral-500">
          REQUIRE restricts substitutes to the same brand. FORBID blocks a brand outright — it beats a stock
          shortage.
        </p>
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Brand</th>
                <th className="px-4 py-2 font-medium">Rule</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {brandRules.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-neutral-900">{r.skuCategory}</td>
                  <td className="px-4 py-2 text-neutral-900">{r.brand}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.rule === "FORBID" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {r.rule}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-500">{r.note ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteBrandRuleAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <button type="submit" className="text-xs text-neutral-500 hover:text-red-600">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {brandRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-neutral-400">
                    No brand rules yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <form action={createBrandRuleAction} className="grid grid-cols-5 items-end gap-2 border-t border-neutral-200 p-3">
            <input type="hidden" name="school_id" value={schoolId} />
            <div>
              <label className="block text-xs text-neutral-500">Category</label>
              <input name="sku_category" required placeholder="Paint" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Brand</label>
              <input name="brand" required placeholder="Jovi" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Rule</label>
              <select name="rule" className={inputClass} defaultValue="FORBID">
                <option value="REQUIRE">REQUIRE</option>
                <option value="FORBID">FORBID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Note</label>
              <input name="note" className={inputClass} />
            </div>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Add rule
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Lists</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Academic year</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Items</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {lists.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-neutral-900">{l.gradeLabel}</td>
                  <td className="px-4 py-2 text-neutral-600">{l.academicYear}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.status === "live"
                          ? "bg-emerald-100 text-emerald-700"
                          : l.status === "archived"
                            ? "bg-neutral-100 text-neutral-500"
                            : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{l.itemCount}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/lists/${l.id}`} className="text-xs font-medium text-neutral-700 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {lists.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-neutral-400">
                    No lists yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <form action={createListAction} className="flex items-end gap-2 border-t border-neutral-200 p-3">
            <input type="hidden" name="school_id" value={schoolId} />
            <div className="flex-1">
              <label className="block text-xs text-neutral-500">Grade</label>
              <select name="grade_id" required className={inputClass}>
                {schoolGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-neutral-500">Academic year</label>
              <input name="academic_year" required placeholder="2026/27" className={inputClass} />
            </div>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              New list
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
