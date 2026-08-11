import Link from "next/link";
import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { kits, schools, grades } from "@/db/schema";
import { eq } from "drizzle-orm";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-600",
  review: "bg-amber-100 text-amber-700",
  live: "bg-emerald-100 text-emerald-700",
  archived: "bg-neutral-100 text-neutral-400",
};

export default async function KitsPage() {
  const db = getDb();
  const rows = await db
    .select({
      id: kits.id,
      name: kits.name,
      status: kits.status,
      basePrice: kits.basePrice,
      marginPct: kits.marginPct,
      version: kits.version,
      academicYear: kits.academicYear,
      schoolName: schools.name,
      gradeLabel: grades.label,
    })
    .from(kits)
    .innerJoin(schools, eq(kits.schoolId, schools.id))
    .innerJoin(grades, eq(kits.gradeId, grades.id))
    .orderBy(desc(kits.updatedAt));

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Kits</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Kits are generated from a school list, then edited and priced here. Open a school&apos;s list to generate
        one.
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Kit</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Version</th>
              <th className="px-4 py-2 font-medium">Base price</th>
              <th className="px-4 py-2 font-medium">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((k) => (
              <tr key={k.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/kits/${k.id}`} className="font-medium text-neutral-900 hover:underline">
                    {k.name}
                  </Link>
                  <p className="text-xs text-neutral-400">
                    {k.schoolName} · {k.gradeLabel} · {k.academicYear}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[k.status]}`}>
                    {k.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-600">v{k.version}</td>
                <td className="px-4 py-3 text-neutral-900">{k.basePrice.toFixed(2)} EGP</td>
                <td className="px-4 py-3 text-neutral-600">{k.marginPct.toFixed(1)}%</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-neutral-400">
                  No kits yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
