import { and, eq } from "drizzle-orm";
import type { Db } from "@/db";
import { skus, schoolBrandRules } from "@/db/schema";

// Mirrors the Kit Builder's publish-time rule checks, applied here to a
// candidate list instead of a whole kit: a FORBID rule blocks a brand
// outright — a stock shortage never justifies shipping into it. A REQUIRE
// rule (one or more brands "required OR") restricts substitutes to that
// set. A BRAND-tier SKU with no rule at all still blocks, flagged for
// manual review, per the spec's substitution business rule #3.
export async function getAllowedSubstitutes(db: Db, schoolId: number, original: { id: number; category: string }) {
  const [candidates, rules] = await Promise.all([
    db.select().from(skus).where(and(eq(skus.category, original.category), eq(skus.active, true))),
    db
      .select()
      .from(schoolBrandRules)
      .where(and(eq(schoolBrandRules.schoolId, schoolId), eq(schoolBrandRules.skuCategory, original.category))),
  ]);

  const forbidBrands = new Set(rules.filter((r) => r.rule === "FORBID").map((r) => r.brand.toLowerCase()));
  const requireBrands = new Set(rules.filter((r) => r.rule === "REQUIRE").map((r) => r.brand.toLowerCase()));

  return candidates.filter((c) => {
    if (c.id === original.id) return false;
    const brand = c.brand?.toLowerCase();
    if (brand && forbidBrands.has(brand)) return false;
    if (requireBrands.size > 0) return !!brand && requireBrands.has(brand);
    if (c.tier === "BRAND") return false;
    return true;
  });
}
