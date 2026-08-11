"use client";

import { useMemo, useState } from "react";

type Item = {
  id: number;
  skuName: string;
  skuBrand: string | null;
  category: string;
  subject: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  isOptional: boolean;
};

const LABELING_FEE = 120;
const DELIVERY_FEE = { SCHOOL_BATCH: 25, HOME: 45 } as const;
type Delivery = keyof typeof DELIVERY_FEE;

export default function Configurator({
  schoolName,
  gradeLabel,
  kitName,
  labelingAvailable,
  items,
}: {
  schoolName: string;
  gradeLabel: string;
  kitName: string;
  labelingAvailable: boolean;
  items: Item[];
}) {
  const [step, setStep] = useState<"configure" | "review">("configure");
  const [included, setIncluded] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.filter((i) => i.isOptional).map((i) => [i.id, true]))
  );
  const [labeling, setLabeling] = useState(false);
  const [delivery, setDelivery] = useState<Delivery>("SCHOOL_BATCH");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [touched, setTouched] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of items) {
      if (!map.has(item.subject)) map.set(item.subject, []);
      map.get(item.subject)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const itemsTotal = useMemo(
    () => items.reduce((sum, i) => (i.isOptional && !included[i.id] ? sum : sum + i.lineTotal), 0),
    [items, included]
  );
  const labelingCost = labeling ? LABELING_FEE : 0;
  const deliveryCost = DELIVERY_FEE[delivery];
  const total = itemsTotal + labelingCost + deliveryCost;

  const canContinue = childName.trim().length > 0 && childClass.trim().length > 0;

  function toggleItem(id: number) {
    setIncluded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (step === "review") {
    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <button onClick={() => setStep("configure")} className="text-xs text-neutral-400 hover:text-neutral-700">
          ← Back to kit
        </button>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Review your order</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {schoolName} — {gradeLabel}
        </p>

        <div className="mt-6 space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Child</span>
            <span className="font-medium text-neutral-900">
              {childName} · {childClass}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Items</span>
            <span className="font-medium text-neutral-900">{itemsTotal.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Labeling</span>
            <span className="font-medium text-neutral-900">
              {labeling ? `${LABELING_FEE.toFixed(2)} EGP` : "Not added"}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-500">Delivery ({delivery === "SCHOOL_BATCH" ? "school batch" : "home"})</span>
            <span className="font-medium text-neutral-900">{deliveryCost.toFixed(2)} EGP</span>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3 text-base">
            <span className="font-semibold text-neutral-900">Total</span>
            <span className="font-semibold text-neutral-900">{total.toFixed(2)} EGP</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          This is a front-end preview. Payment and order submission aren&apos;t wired up yet — this screen shows
          exactly what checkout will total once that lands.
        </div>

        <button
          disabled
          className="mt-4 w-full cursor-not-allowed rounded-md bg-neutral-300 px-4 py-3 text-sm font-medium text-neutral-500"
        >
          Place order (coming soon)
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:flex lg:gap-10">
      <div className="lg:flex-1">
        <p className="text-sm font-medium text-neutral-500">
          {schoolName} — {gradeLabel}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{kitName}</h1>

        <div className="mt-6 space-y-6">
          {grouped.map(([subject, subjectItems]) => (
            <div key={subject} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {subject}
              </div>
              <ul className="divide-y divide-neutral-100">
                {subjectItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      {item.isOptional ? (
                        <input
                          type="checkbox"
                          checked={included[item.id] ?? true}
                          onChange={() => toggleItem(item.id)}
                          className="h-4 w-4"
                        />
                      ) : (
                        <span className="h-4 w-4 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {item.skuName}
                          {item.isOptional && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              optional
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-neutral-400">
                          Qty {item.qty}
                          {item.skuBrand ? ` · ${item.skuBrand}` : ""}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-sm font-medium ${
                        item.isOptional && !included[item.id] ? "text-neutral-300 line-through" : "text-neutral-900"
                      }`}
                    >
                      {item.lineTotal.toFixed(2)} EGP
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 lg:mt-0 lg:w-80 lg:shrink-0">
        <div className="sticky top-8 space-y-5 rounded-lg border border-neutral-200 bg-white p-5">
          {labelingAvailable && (
            <label className="flex items-center justify-between text-sm">
              <span>
                <span className="font-medium text-neutral-900">Add labeling</span>
                <span className="block text-xs text-neutral-400">Child&apos;s name on every item</span>
              </span>
              <input
                type="checkbox"
                checked={labeling}
                onChange={(e) => setLabeling(e.target.checked)}
                className="h-4 w-4"
              />
            </label>
          )}

          <div>
            <p className="text-sm font-medium text-neutral-900">Delivery</p>
            <div className="mt-2 space-y-2">
              <label className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delivery"
                    checked={delivery === "SCHOOL_BATCH"}
                    onChange={() => setDelivery("SCHOOL_BATCH")}
                  />
                  School batch
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    cheaper
                  </span>
                </span>
                <span className="text-neutral-500">{DELIVERY_FEE.SCHOOL_BATCH} EGP</span>
              </label>
              <label className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="delivery"
                    checked={delivery === "HOME"}
                    onChange={() => setDelivery("HOME")}
                  />
                  Home delivery
                </span>
                <span className="text-neutral-500">{DELIVERY_FEE.HOME} EGP</span>
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-900">Child details</p>
            <p className="text-xs text-neutral-400">Required for labelling and school batch delivery.</p>
            <div className="mt-2 space-y-2">
              <input
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="Child's full name"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
              <input
                value={childClass}
                onChange={(e) => setChildClass(e.target.value)}
                placeholder="Class / section"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
              {touched && !canContinue && (
                <p className="text-xs text-red-600">Child&apos;s name and class are required.</p>
              )}
            </div>
          </div>

          <div className="space-y-1 border-t border-neutral-200 pt-3 text-sm">
            <div className="flex justify-between text-neutral-500">
              <span>Items</span>
              <span>{itemsTotal.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Labeling</span>
              <span>{labelingCost.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Delivery</span>
              <span>{deliveryCost.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>{total.toFixed(2)} EGP</span>
            </div>
          </div>

          <button
            onClick={() => {
              setTouched(true);
              if (canContinue) setStep("review");
            }}
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Continue to checkout
          </button>
        </div>
      </div>
    </div>
  );
}
