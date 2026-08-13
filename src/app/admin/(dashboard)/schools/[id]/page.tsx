import { notFound } from "next/navigation";
import Link from "next/link";
import { eq, sql, asc, desc } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, schoolBrandRules, schoolLists, schoolAdmins, listUpdateRequests } from "@/db/schema";
import {
  createGradeAction,
  toggleGradeActiveAction,
  createBrandRuleAction,
  deleteBrandRuleAction,
  resetSchoolAdminPasswordAction,
  deleteSchoolAdminAction,
  updateListUpdateRequestStatusAction,
} from "@/lib/actions/schools";
import { createListAction } from "@/lib/actions/lists";
import SchoolDetailsForm from "./school-details-form";
import PortalAccessForm from "./portal-access-form";
import { inputClass } from "@/components/admin/form-controls";

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const schoolId = Number(id);
  if (!schoolId) notFound();

  const db = getDb();
  const [school] = await db.select().from(schools).where(eq(schools.id, schoolId)).limit(1);
  if (!school) notFound();

  const [schoolGrades, brandRules, lists, portalLogins, updateRequests] = await Promise.all([
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
    db.select().from(schoolAdmins).where(eq(schoolAdmins.schoolId, schoolId)),
    db
      .select({
        id: listUpdateRequests.id,
        note: listUpdateRequests.note,
        status: listUpdateRequests.status,
        createdAt: listUpdateRequests.createdAt,
        gradeLabel: grades.label,
      })
      .from(listUpdateRequests)
      .leftJoin(grades, eq(listUpdateRequests.gradeId, grades.id))
      .where(eq(listUpdateRequests.schoolId, schoolId))
      .orderBy(desc(listUpdateRequests.createdAt)),
  ]);

  return (
    <div className="max-w-4xl space-y-10">
      <div>
        <Link href="/admin/schools" className="text-xs text-ink-400 hover:text-ink-600">
          ← Schools
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-ink-900">{school.name}</h1>
        <p className="text-sm text-ink-400">/s/{school.referralSlug}</p>
      </div>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">Details</h2>
        <SchoolDetailsForm school={school} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">Grades</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2 font-medium">Curriculum</th>
                <th className="px-4 py-2 font-medium">Active</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {schoolGrades.map((g) => (
                <tr key={g.id}>
                  <td className="px-4 py-2 font-medium text-ink-900">{g.label}</td>
                  <td className="px-4 py-2 text-ink-600">{g.curriculum ?? "—"}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        g.active ? "bg-ok-bg text-ok" : "bg-canvas text-ink-400"
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
                      <button type="submit" className="text-xs text-ink-400 hover:text-ink-900">
                        {g.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {schoolGrades.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-ink-400">
                    No grades yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <form action={createGradeAction} className="flex items-end gap-2 border-t border-line p-3">
            <input type="hidden" name="school_id" value={schoolId} />
            <div className="flex-1">
              <label className="block text-xs text-ink-400">Label</label>
              <input name="label" required placeholder="Year 5" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-ink-400">Curriculum</label>
              <input name="curriculum" placeholder="National" className={inputClass} />
            </div>
            <div className="w-20">
              <label className="block text-xs text-ink-400">Order</label>
              <input name="sort_order" type="number" defaultValue={schoolGrades.length} className={inputClass} />
            </div>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              Add grade
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">Brand rules</h2>
        <p className="mt-1 text-xs text-ink-400">
          REQUIRE restricts substitutes to the same brand. FORBID blocks a brand outright — it beats a stock
          shortage.
        </p>
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-2 font-medium">Category</th>
                <th className="px-4 py-2 font-medium">Brand</th>
                <th className="px-4 py-2 font-medium">Rule</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {brandRules.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-ink-900">{r.skuCategory}</td>
                  <td className="px-4 py-2 text-ink-900">{r.brand}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        r.rule === "FORBID" ? "bg-error-bg text-error" : "bg-teal-100 text-teal-800"
                      }`}
                    >
                      {r.rule}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink-400">{r.note ?? "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteBrandRuleAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <button type="submit" className="text-xs text-ink-400 hover:text-error">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {brandRules.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-ink-400">
                    No brand rules yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <form action={createBrandRuleAction} className="grid grid-cols-5 items-end gap-2 border-t border-line p-3">
            <input type="hidden" name="school_id" value={schoolId} />
            <div>
              <label className="block text-xs text-ink-400">Category</label>
              <input name="sku_category" required placeholder="Paint" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-ink-400">Brand</label>
              <input name="brand" required placeholder="Jovi" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-ink-400">Rule</label>
              <select name="rule" className={inputClass} defaultValue="FORBID">
                <option value="REQUIRE">REQUIRE</option>
                <option value="FORBID">FORBID</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-400">Note</label>
              <input name="note" className={inputClass} />
            </div>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              Add rule
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">Lists</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Academic year</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Items</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {lists.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-ink-900">{l.gradeLabel}</td>
                  <td className="px-4 py-2 text-ink-600">{l.academicYear}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        l.status === "live"
                          ? "bg-ok-bg text-ok"
                          : l.status === "archived"
                            ? "bg-canvas text-ink-400"
                            : "bg-warn-bg text-warn"
                      }`}
                    >
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-ink-600">{l.itemCount}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/lists/${l.id}`} className="text-xs font-medium text-ink-600 hover:underline">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
              {lists.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-sm text-ink-400">
                    No lists yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <form action={createListAction} className="flex items-end gap-2 border-t border-line p-3">
            <input type="hidden" name="school_id" value={schoolId} />
            <div className="flex-1">
              <label className="block text-xs text-ink-400">Grade</label>
              <select name="grade_id" required className={inputClass}>
                {schoolGrades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs text-ink-400">Academic year</label>
              <input name="academic_year" required placeholder="2026/27" className={inputClass} />
            </div>
            <button
              type="submit"
              className="h-[38px] rounded-md bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              New list
            </button>
          </form>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">School Portal access</h2>
        <p className="mt-1 text-xs text-ink-400">
          Logins for {school.name}&apos;s staff at <code>/portal/login</code> — referral link, orders and commission
          only. They never see prices, cost, or other schools.
        </p>
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Reset password</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {portalLogins.map((pa) => (
                <tr key={pa.id}>
                  <td className="px-4 py-2 font-medium text-ink-900">{pa.email}</td>
                  <td className="px-4 py-2 text-ink-600">{pa.name ?? "—"}</td>
                  <td className="px-4 py-2">
                    <form action={resetSchoolAdminPasswordAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={pa.id} />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <input
                        name="password"
                        type="text"
                        placeholder="New password"
                        required
                        minLength={8}
                        className="w-36 rounded-md border border-line px-2 py-1 text-xs focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                      />
                      <button type="submit" className="text-xs text-ink-400 hover:text-ink-900">
                        Reset
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteSchoolAdminAction}>
                      <input type="hidden" name="id" value={pa.id} />
                      <input type="hidden" name="school_id" value={schoolId} />
                      <button type="submit" className="text-xs text-ink-400 hover:text-error">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {portalLogins.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-ink-400">
                    No portal logins yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PortalAccessForm schoolId={schoolId} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">List update requests</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
              <tr>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium">Note</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-2">
              {updateRequests.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-ink-900">{r.gradeLabel ?? "All grades"}</td>
                  <td className="px-4 py-2 text-ink-600">{r.note}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        r.status === "done"
                          ? "bg-ok-bg text-ok"
                          : r.status === "acknowledged"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-warn-bg text-warn"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <form action={updateListUpdateRequestStatusAction} className="inline-flex gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="school_id" value={schoolId} />
                      {r.status !== "acknowledged" && (
                        <button
                          type="submit"
                          name="status"
                          value="acknowledged"
                          className="text-xs text-ink-400 hover:text-ink-900"
                        >
                          Acknowledge
                        </button>
                      )}
                      {r.status !== "done" && (
                        <button
                          type="submit"
                          name="status"
                          value="done"
                          className="text-xs text-ink-400 hover:text-ink-900"
                        >
                          Mark done
                        </button>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
              {updateRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-center text-sm text-ink-400">
                    No requests yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
