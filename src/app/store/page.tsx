import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skus } from "@/db/schema";
import StoreCart from "./store-cart";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const db = getDb();
  const allSkus = await db.select().from(skus).where(eq(skus.active, true)).orderBy(asc(skus.category), asc(skus.name));

  const items = allSkus.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    brand: s.brand,
    unitPrice: s.unitPrice,
  }));

  return <StoreCart items={items} />;
}
