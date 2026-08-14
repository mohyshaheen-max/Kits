"use client";

import { useMemo, useState } from "react";

export type Variant = {
  id: number;
  name: string;
  brand: string | null;
  size: string | null;
  colour: string | null;
  unitPrice: number;
};

export type StoreProduct = {
  id: number;
  name: string;
  category: string;
  variants: Variant[];
};

function uniqueValues(variants: Variant[], key: "brand" | "size" | "colour"): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of variants) {
    const val = v[key];
    if (val && !seen.has(val)) {
      seen.add(val);
      out.push(val);
    }
  }
  return out;
}

const selectClass = "rounded-sm border border-line px-2 py-1 text-xs focus:outline-2 focus:outline-offset-1 focus:outline-teal-500";

export default function ProductPicker({
  product,
  cart,
  onQtyChange,
}: {
  product: StoreProduct;
  cart: Record<number, number>;
  onQtyChange: (skuId: number, qty: number) => void;
}) {
  const variants = product.variants;
  const defaultVariant = variants[0];

  const sizes = useMemo(() => uniqueValues(variants, "size"), [variants]);
  const brands = useMemo(() => uniqueValues(variants, "brand"), [variants]);
  const colours = useMemo(() => uniqueValues(variants, "colour"), [variants]);

  const hasSizeAxis = sizes.length > 1;
  const hasBrandAxis = brands.length > 1;
  const hasColourAxis = colours.length > 1;
  // Pack-count variants ("12pk"/"24pk") get the bulk checkbox; a paper-size
  // or format axis ("A4"/"A5") isn't a "bulk" concept, so it's a plain select.
  const isBulkPack = hasSizeAxis && sizes.every((s) => /pk$/i.test(s));

  const [bulk, setBulk] = useState(false);
  const [size, setSize] = useState(defaultVariant.size ?? "");
  const [brand, setBrand] = useState(defaultVariant.brand ?? "");
  const [colour, setColour] = useState(defaultVariant.colour ?? "");

  const activeSize = isBulkPack ? (bulk ? size : defaultVariant.size) : size;

  const resolved =
    variants.find(
      (v) =>
        (!hasSizeAxis || v.size === activeSize) &&
        (!hasBrandAxis || v.brand === brand) &&
        (!hasColourAxis || v.colour === colour)
    ) ?? defaultVariant;

  const qty = cart[resolved.id] ?? 0;

  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-900">{product.name}</p>
          <p className="text-xs text-ink-400">
            <span className="font-mono">{resolved.unitPrice.toFixed(2)} EGP</span>
            {resolved.brand ? ` · ${resolved.brand}` : ""}
            {resolved.colour ? ` · ${resolved.colour}` : ""}
            {resolved.size && !isBulkPack ? ` · ${resolved.size}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onQtyChange(resolved.id, qty - 1)}
            className="h-7 w-7 rounded-sm border border-line text-sm text-ink-600 hover:bg-canvas"
          >
            −
          </button>
          <span className="w-6 text-center font-mono text-sm text-ink-900">{qty}</span>
          <button
            type="button"
            onClick={() => onQtyChange(resolved.id, qty + 1)}
            className="h-7 w-7 rounded-sm border border-line text-sm text-ink-600 hover:bg-canvas"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {isBulkPack && (
          <label className="flex items-center gap-1.5 text-xs text-ink-600">
            <input type="checkbox" checked={bulk} onChange={(e) => setBulk(e.target.checked)} className="accent-teal-600" />
            Bulk pack
          </label>
        )}
        {isBulkPack && bulk && (
          <select value={size} onChange={(e) => setSize(e.target.value)} className={selectClass}>
            {sizes.map((s) => (
              <option key={s} value={s}>
                {s.replace(/pk$/i, "")} pack
              </option>
            ))}
          </select>
        )}
        {hasSizeAxis && !isBulkPack && (
          <label className="text-xs text-ink-600">
            Size
            <select value={size} onChange={(e) => setSize(e.target.value)} className={`ml-1.5 ${selectClass}`}>
              {sizes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
        {hasBrandAxis && (
          <label className="text-xs text-ink-600">
            Brand
            <select value={brand} onChange={(e) => setBrand(e.target.value)} className={`ml-1.5 ${selectClass}`}>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
        )}
        {hasColourAxis && (
          <label className="text-xs text-ink-600">
            Colour
            <select value={colour} onChange={(e) => setColour(e.target.value)} className={`ml-1.5 ${selectClass}`}>
              {colours.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}
