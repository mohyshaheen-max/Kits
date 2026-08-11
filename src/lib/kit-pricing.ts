export type PricedLine = {
  qty: number | null;
  unitPrice: number;
  skuTier: "GEN" | "BRAND" | "ANY";
  skuCost: number;
};

export function computeKitTotals(items: PricedLine[]) {
  let basePrice = 0;
  let cogs = 0;
  let brandLineTotal = 0;

  for (const item of items) {
    const qty = item.qty ?? 0;
    const lineTotal = qty * item.unitPrice;
    const lineCost = qty * item.skuCost;
    basePrice += lineTotal;
    cogs += lineCost;
    if (item.skuTier === "BRAND") brandLineTotal += lineTotal;
  }

  const marginPct = basePrice > 0 ? ((basePrice - cogs) / basePrice) * 100 : 0;
  const brandSharePct = basePrice > 0 ? (brandLineTotal / basePrice) * 100 : 0;

  return { basePrice, cogs, marginPct, brandSharePct };
}
