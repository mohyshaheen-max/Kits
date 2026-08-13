import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, schoolLists, kits } from "@/db/schema";

export default async function SchoolsPage() {
  const db = getDb();

  const [allSchools, gradeCounts, listCounts, kitCounts] = await Promise.all([
    db.select().from(schools).orderBy(schools.name),
    db.select({ schoolId: grades.schoolId, n: sql<number>`count(*)` }).from(grades).groupBy(grades.schoolId),
    db
      .select({ schoolId: schoolLists.schoolId, n: sql<number>`count(*)` })
      .from(schoolLists)
      .groupBy(schoolLists.schoolId),
    db.select({ schoolId: kits.schoolId, n: sql<number>`count(*)` }).from(kits).groupBy(kits.schoolId),
  ]);

  const gradeMap = Object.fromEntries(gradeCounts.map((g) => [g.schoolId, g.n]));
  const listMap = Object.fromEntries(listCounts.map((l) => [l.schoolId, l.n]));
  const kitMap = Object.fromEntries(kitCounts.map((k) => [k.schoolId, k.n]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Schools</h1>
          <p className="mt-1 text-sm text-ink-400">{allSchools.length} schools</p>
        </div>
        <Link
          href="/admin/schools/new"
          className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          New school
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Tier</th>
              <th className="px-4 py-3 font-medium">District</th>
              <th className="px-4 py-3 font-medium">Grades</th>
              <th className="px-4 py-3 font-medium">Lists</th>
              <th className="px-4 py-3 font-medium">Kits</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {allSchools.map((s) => (
              <tr key={s.id} className="hover:bg-teal-050">
                <td className="px-4 py-3">
                  <Link href={`/admin/schools/${s.id}`} className="font-medium text-ink-900 hover:underline">
                    {s.name}
                  </Link>
                  <p className="text-xs text-ink-400">/s/{s.referralSlug}</p>
                </td>
                <td className="px-4 py-3 text-ink-600">{s.tier}</td>
                <td className="px-4 py-3 text-ink-600">{s.district ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-ink-600">{gradeMap[s.id] ?? 0}</td>
                <td className="px-4 py-3 font-mono text-ink-600">{listMap[s.id] ?? 0}</td>
                <td className="px-4 py-3 font-mono text-ink-600">{kitMap[s.id] ?? 0}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                      s.status === "active" ? "bg-ok-bg text-ok" : "bg-canvas text-ink-400"
                    }`}
                  >
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
