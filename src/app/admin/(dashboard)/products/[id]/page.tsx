import { notFound } from "next/navigation";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { products, skus } from "@/db/schema";
import ProductForm from "@/components/admin/product-form";
import { updateProductAction } from "@/lib/actions/products";
import { toggleSkuActiveAction } from "@/lib/actions/skus";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  if (!productId) notFound();

  const db = getDb();
  const [[product], variants] = await Promise.all([
    db.select().from(products).where(eq(products.id, productId)).limit(1),
    db.select().from(skus).where(eq(skus.productId, productId)).orderBy(asc(skus.unitPrice)),
  ]);
  if (!product) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/skus" className="text-xs text-ink-400 hover:text-ink-600">
        ← SKU catalogue
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-ink-900">{product.name}</h1>
      <p className="mt-1 text-sm text-ink-400">{product.category}</p>

      <div className="mt-3">
        <ProductForm product={product} action={updateProductAction} submitLabel="Save details" pendingLabel="Saving..." />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-900">Variants</h2>
        <Link
          href={`/admin/skus/new?product_id=${product.id}`}
          className="rounded-md bg-teal-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-teal-700"
        >
          Add variant
        </Link>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-400">
            <tr>
              <th className="px-4 py-2 font-medium">Code</th>
              <th className="px-4 py-2 font-medium">Size</th>
              <th className="px-4 py-2 font-medium">Brand</th>
              <th className="px-4 py-2 font-medium">Colour</th>
              <th className="px-4 py-2 text-right font-medium">Cost</th>
              <th className="px-4 py-2 text-right font-medium">Price</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-2">
            {variants.map((v) => (
              <tr key={v.id} className={`hover:bg-teal-050 ${!v.active ? "opacity-50" : ""}`}>
                <td className="px-4 py-2">
                  <Link href={`/admin/skus/${v.id}`} className="font-mono text-xs text-ink-900 hover:underline">
                    {v.code}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-600">{v.size ?? "—"}</td>
                <td className="px-4 py-2 text-ink-600">{v.brand ?? "—"}</td>
                <td className="px-4 py-2 text-ink-600">{v.colour ?? "—"}</td>
                <td className="px-4 py-2 text-right font-mono text-ink-600">{v.unitCost.toFixed(2)} EGP</td>
                <td className="px-4 py-2 text-right font-mono text-ink-900">{v.unitPrice.toFixed(2)} EGP</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-sm px-2 py-0.5 text-xs font-medium ${
                      v.active ? "bg-ok-bg text-ok" : "bg-canvas text-ink-400"
                    }`}
                  >
                    {v.active ? "active" : "inactive"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <form action={toggleSkuActiveAction}>
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="active" value={v.active ? "1" : "0"} />
                    <button type="submit" className="text-xs font-medium text-teal-700 hover:underline">
                      {v.active ? "Deactivate" : "Activate"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {variants.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-sm text-ink-400">
                  No variants yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
