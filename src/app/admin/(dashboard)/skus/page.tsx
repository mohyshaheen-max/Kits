import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { skus } from "@/db/schema";

export default async function SkusPage() {
  const db = getDb();
  const all = await db.select().from(skus).orderBy(asc(skus.category), asc(skus.name));

  return (
    <div>
      <h1 className="text-xl font-semibold text-ink-900">SKU catalogue</h1>
      <p className="mt-1 text-sm text-ink-400">{all.length} SKUs. Seeded from fixtures for now.</p>

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
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {all.map((s) => (
              <tr key={s.id} className={!s.active ? "opacity-40" : ""}>
                <td className="px-4 py-2 font-mono text-xs text-ink-400">{s.code}</td>
                <td className="px-4 py-2 text-ink-900">{s.name}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
