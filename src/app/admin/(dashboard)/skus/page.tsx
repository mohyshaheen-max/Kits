import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { skus } from "@/db/schema";

export default async function SkusPage() {
  const db = getDb();
  const all = await db.select().from(skus).orderBy(asc(skus.category), asc(skus.name));

  return (
    <div>
      <h1 className="text-xl font-semibold text-neutral-900">SKU catalogue</h1>
      <p className="mt-1 text-sm text-neutral-500">{all.length} SKUs. Seeded from fixtures for now.</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Brand</th>
              <th className="px-4 py-2 font-medium">Tier</th>
              <th className="px-4 py-2 font-medium">Cost</th>
              <th className="px-4 py-2 font-medium">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {all.map((s) => (
              <tr key={s.id} className={!s.active ? "opacity-40" : ""}>
                <td className="px-4 py-2 font-mono text-xs text-neutral-500">{s.code}</td>
                <td className="px-4 py-2 text-neutral-900">{s.name}</td>
                <td className="px-4 py-2 text-neutral-600">{s.category}</td>
                <td className="px-4 py-2 text-neutral-600">{s.brand ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      s.tier === "BRAND"
                        ? "bg-purple-100 text-purple-700"
                        : s.tier === "ANY"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {s.tier}
                  </span>
                </td>
                <td className="px-4 py-2 text-neutral-600">{s.unitCost.toFixed(2)} EGP</td>
                <td className="px-4 py-2 text-neutral-900">{s.unitPrice.toFixed(2)} EGP</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
