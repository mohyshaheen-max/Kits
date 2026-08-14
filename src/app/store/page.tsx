import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skus, products } from "@/db/schema";
import { getAccountContext } from "@/lib/customer-session";
import StoreCart from "./store-cart";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const db = getDb();
  const [rows, account] = await Promise.all([
    db
      .select({
        skuId: skus.id,
        name: skus.name,
        brand: skus.brand,
        size: skus.size,
        colour: skus.colour,
        unitPrice: skus.unitPrice,
        productId: products.id,
        productName: products.name,
        category: products.category,
      })
      .from(skus)
      .innerJoin(products, eq(skus.productId, products.id))
      .where(and(eq(skus.active, true), eq(products.active, true)))
      .orderBy(asc(products.category), asc(products.name)),
    getAccountContext(),
  ]);

  type StoreProduct = {
    id: number;
    name: string;
    category: string;
    variants: {
      id: number;
      name: string;
      brand: string | null;
      size: string | null;
      colour: string | null;
      unitPrice: number;
    }[];
  };

  const storeProducts: StoreProduct[] = [];
  const byProduct = new Map<number, StoreProduct>();

  for (const r of rows) {
    let product = byProduct.get(r.productId);
    if (!product) {
      product = { id: r.productId, name: r.productName, category: r.category, variants: [] };
      byProduct.set(r.productId, product);
      storeProducts.push(product);
    }
    product.variants.push({
      id: r.skuId,
      name: r.name,
      brand: r.brand,
      size: r.size,
      colour: r.colour,
      unitPrice: r.unitPrice,
    });
  }

  for (const p of storeProducts) p.variants.sort((a, b) => a.unitPrice - b.unitPrice);

  return <StoreCart products={storeProducts} account={account} />;
}
