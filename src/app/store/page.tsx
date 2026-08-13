import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skus } from "@/db/schema";
import { getAccountContext } from "@/lib/customer-session";
import StoreCart from "./store-cart";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const db = getDb();
  const [allSkus, account] = await Promise.all([
    db.select().from(skus).where(eq(skus.active, true)).orderBy(asc(skus.category), asc(skus.name)),
    getAccountContext(),
  ]);

  const items = allSkus.map((s) => ({
    id: s.id,
    name: s.name,
    category: s.category,
    brand: s.brand,
    unitPrice: s.unitPrice,
  }));

  return <StoreCart items={items} account={account} />;
}
