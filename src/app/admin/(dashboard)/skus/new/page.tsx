import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { products } from "@/db/schema";
import SkuForm from "@/components/admin/sku-form";
import { createSkuAction } from "@/lib/actions/skus";

export default async function NewSkuPage({
  searchParams,
}: {
  searchParams: Promise<{ product_id?: string }>;
}) {
  const { product_id } = await searchParams;
  const db = getDb();
  const allProducts = await db.select().from(products).orderBy(asc(products.name));

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-ink-900">New SKU</h1>
      <p className="mt-1 text-sm text-ink-400">Add a purchasable variant to a product.</p>
      <SkuForm
        products={allProducts}
        defaultProductId={product_id ? Number(product_id) : undefined}
        action={createSkuAction}
        submitLabel="Create SKU"
        pendingLabel="Creating..."
      />
    </div>
  );
}
