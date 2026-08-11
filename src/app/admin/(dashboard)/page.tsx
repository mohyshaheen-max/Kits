import Link from "next/link";
import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, skus, kits, schoolLists } from "@/db/schema";

export default async function AdminOverviewPage() {
  const db = getDb();

  const [[schoolCount], [skuCount], [listCount], kitRows] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(schools),
    db.select({ n: sql<number>`count(*)` }).from(skus),
    db.select({ n: sql<number>`count(*)` }).from(schoolLists),
    db.select({ status: kits.status, n: sql<number>`count(*)` }).from(kits).groupBy(kits.status),
  ]);

  const kitCounts = Object.fromEntries(kitRows.map((r) => [r.status, r.n]));
  const totalKits = kitRows.reduce((sum, r) => sum + Number(r.n), 0);

  const cards = [
    { label: "Schools", value: schoolCount?.n ?? 0, href: "/admin/schools" },
    { label: "SKUs in catalogue", value: skuCount?.n ?? 0, href: "/admin/skus" },
    { label: "School lists", value: listCount?.n ?? 0, href: "/admin/schools" },
    { label: "Kits", value: totalKits, href: "/admin/kits" },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">Overview</h1>
      <p className="mt-1 text-sm text-neutral-500">Where things stand across schools, catalogue and kits.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300"
          >
            <p className="text-2xl font-semibold text-neutral-900">{c.value}</p>
            <p className="mt-1 text-xs text-neutral-500">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-900">Kits by status</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {(["draft", "review", "live", "archived"] as const).map((status) => (
            <div key={status} className="rounded-md border border-neutral-200 bg-white px-4 py-3">
              <p className="text-lg font-semibold text-neutral-900">{kitCounts[status] ?? 0}</p>
              <p className="text-xs capitalize text-neutral-500">{status}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-500">
        Start by creating a school, entering its list, then generating a kit from it in the Kit Builder.
      </div>
    </div>
  );
}
