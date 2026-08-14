import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { products, skus } from "@/db/schema";

export default async function SkusPage() {
  const db = getDb();
  const [allProducts, allSkus] = await Promise.all([
    db.select().from(products).orderBy(asc(products.category), asc(products.name)),
    db.select().from(skus),
  ]);

  const variantsByProduct = new Map<number, typeof allSkus>();
  for (const s of allSkus) {
    if (!s.productId) continue;
    if (!variantsByProduct.has(s.productId)) variantsByProduct.set(s.productId, []);
    variantsByProduct.get(s.productId)!.push(s);
  }
  for (const variants of variantsByProduct.values()) variants.sort((a, b) => a.unitPrice - b.unitPrice);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">SKU catalogue</h1>
          <p className="mt-1 text-sm text-ink-400">
            {allProducts.length} products, {allSkus.length} SKU variants
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          New product
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Product</th>
              <th className="px-4 py-2 font-medium">Category</th>
              <th className="px-4 py-2 font-medium">Variants</th>
              <th className="px-4 py-2 text-right font-medium">Price range</th>
              <th className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {allProducts.map((p) => {
              const variants = variantsByProduct.get(p.id) ?? [];
              const prices = variants.map((v) => v.unitPrice);
              const priceLabel =
                prices.length === 0
                  ? "—"
                  : Math.min(...prices) === Math.max(...prices)
                    ? `${Math.min(...prices).toFixed(2)} EGP`
                    : `${Math.min(...prices).toFixed(2)}–${Math.max(...prices).toFixed(2)} EGP`;

              return (
                <tr key={p.id} className={`hover:bg-teal-050 ${!p.active ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium text-ink-900 hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{p.category}</td>
                  <td className="px-4 py-3 font-mono text-ink-600">{variants.length}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink-900">{priceLabel}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                        p.active ? "bg-ok-bg text-ok" : "bg-canvas text-ink-400"
                      }`}
                    >
                      {p.active ? "active" : "inactive"}
                    </span>
                  </td>
                </tr>
              );
            })}
            {allProducts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-sm text-ink-400">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
