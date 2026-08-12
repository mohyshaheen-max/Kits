import { asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, schools, grades } from "@/db/schema";
import PrintButton from "@/components/admin/print-button";

export default async function DeliveryRunPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      childName: orders.childName,
      childClass: orders.childClass,
      deliveryMethod: orders.deliveryMethod,
      deliveryAddress: orders.deliveryAddress,
      parentName: orders.parentName,
      parentPhone: orders.parentPhone,
      schoolId: orders.schoolId,
      schoolName: schools.name,
      gradeLabel: grades.label,
    })
    .from(orders)
    .leftJoin(schools, eq(orders.schoolId, schools.id))
    .leftJoin(grades, eq(orders.gradeId, grades.id))
    .where(inArray(orders.fulfilmentStatus, ["packed"]))
    .orderBy(asc(schools.name), asc(grades.sortOrder));

  const grouped = new Map<string, typeof rows>();
  for (const r of rows) {
    const key = r.schoolName ?? "General Store";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(r);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <style>{`@media print { .no-print { display: none; } }`}</style>

      <div className="no-print flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Delivery run sheet</h1>
          <p className="mt-1 text-sm text-neutral-500">Every packed order, grouped by school, ready to go out.</p>
        </div>
        <PrintButton />
      </div>

      {Array.from(grouped.entries()).map(([schoolName, schoolRows]) => (
        <div key={schoolName} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-900">
            {schoolName}
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-neutral-400">
              <tr>
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Child</th>
                <th className="px-4 py-2 font-medium">Method</th>
                <th className="px-4 py-2 font-medium">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {schoolRows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 text-neutral-900">{r.orderNumber}</td>
                  <td className="px-4 py-2 text-neutral-600">
                    {r.childName} · {r.gradeLabel} {r.childClass}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">
                    {r.deliveryMethod === "SCHOOL_BATCH" ? "School batch" : `Home — ${r.deliveryAddress ?? ""}`}
                  </td>
                  <td className="px-4 py-2 text-neutral-600">
                    {r.parentName} · {r.parentPhone}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-400">
          Nothing packed and ready for delivery yet.
        </p>
      )}
    </div>
  );
}
