import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { skus } from "@/db/schema";
import { toggleSkuActiveAction } from "@/lib/actions/skus";

export default async function SkusPage() {
  const db = getDb();
  const all = await db.select().from(skus).orderBy(asc(skus.category), asc(skus.name));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">SKU catalogue</h1>
          <p className="mt-1 text-sm text-ink-400">{all.length} SKUs</p>
        </div>
        <Link
          href="/admin/skus/new"
          className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          New SKU
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Brand</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 text-right font-medium">Cost</th>
              <th className="px-4 py-2 text-right font-medium">Price</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {all.map((s) => (
              <tr key={s.id} className={`hover:bg-teal-050 ${!s.active ? "opacity-50" : ""}`}>
                <td className="px-4 py-2">
                  <Link href={`/admin/skus/${s.id}`} className="font-mono text-xs text-ink-900 hover:underline">
                    {s.code}
                  </Link>
                </td>
                <td className="px-4 py-2">
                  <Link href={`/admin/skus/${s.id}`} className="text-ink-900 hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-600">{s.category}</td>
                <td className="px-4 py-2 text-ink-600">{s.brand ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                      s.tier === "BRAND" ? "bg-teal-100 text-teal-800" : "bg-canvas text-ink-600"
                    }`}
                  >
                    {s.tier}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-mono text-ink-600">{s.unitCost.toFixed(2)} EGP</td>
                <td className="px-4 py-2 text-right font-mono text-ink-900">{s.unitPrice.toFixed(2)} EGP</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                      s.active ? "bg-ok-bg text-ok" : "bg-canvas text-ink-400"
                    }`}
                  >
                    {s.active ? "active" : "inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={toggleSkuActiveAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="active" value={s.active ? "1" : "0"} />
                    <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
                      {s.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {all.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-sm text-ink-400">
                  No SKUs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
