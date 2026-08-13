import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { children, addresses, schools, grades } from "@/db/schema";
import { requireCustomer } from "@/lib/customer-session";
import { deleteAddressAction, addAddressAction } from "@/lib/actions/account";
import { inputClass } from "@/components/admin/form-controls";
import ProfileForm from "./profile-form";
import PasswordForm from "./password-form";
import ChildrenSection from "./children-section";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await requireCustomer();
  const db = getDb();

  const [childRows, addressRows, activeSchools, allGrades] = await Promise.all([
    db.select().from(children).where(eq(children.customerId, customer.id)),
    db.select().from(addresses).where(eq(addresses.customerId, customer.id)),
    db.select().from(schools).where(eq(schools.status, "active")).orderBy(asc(schools.name)),
    db.select().from(grades).where(eq(grades.active, true)).orderBy(asc(grades.sortOrder)),
  ]);

  const schoolMap = new Map(activeSchools.map((s) => [s.id, s.name]));
  const gradeMap = new Map(allGrades.map((g) => [g.id, g.label]));
  const gradesBySchool = activeSchools.map((s) => ({
    id: s.id,
    name: s.name,
    grades: allGrades.filter((g) => g.schoolId === s.id).map((g) => ({ id: g.id, label: g.label })),
  }));

  const childList = childRows.map((c) => ({
    id: c.id,
    fullName: c.fullName,
    classSection: c.classSection,
    schoolName: c.schoolId ? (schoolMap.get(c.schoolId) ?? null) : null,
    gradeLabel: c.gradeId ? (gradeMap.get(c.gradeId) ?? null) : null,
  }));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Profile</h2>
        <ProfileForm name={customer.name} phone={customer.phone} />
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Password</h2>
        <PasswordForm />
      </section>

      <ChildrenSection childList={childList} schools={gradesBySchool} />

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Addresses</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Label</th>
                <th className="px-4 py-2 font-medium">Address</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {addressRows.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-2 font-medium text-neutral-900">{a.label ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-600">{a.line}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={deleteAddressAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="text-xs text-neutral-500 hover:text-red-600">
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {addressRows.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-sm text-neutral-400">
                    No saved addresses yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <form action={addAddressAction} className="grid grid-cols-4 items-end gap-2 border-t border-neutral-200 p-3">
            <div>
              <label className="block text-xs text-neutral-500">Label</label>
              <input name="label" placeholder="Home" className={inputClass} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-neutral-500">Address</label>
              <input name="line" required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-neutral-500">Phone (optional)</label>
              <input name="phone" type="tel" className={inputClass} />
            </div>
            <button
              type="submit"
              className="col-span-4 h-[38px] rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Add address
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
