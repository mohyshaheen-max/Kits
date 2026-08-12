"use client";

import { useActionState, useMemo, useState } from "react";
import { createGeneralOrderAction, type CheckoutState } from "@/lib/actions/orders";
import { LABELING_FEE, DELIVERY_FEE } from "@/lib/pricing";

type Sku = { id: number; name: string; category: string; brand: string | null; unitPrice: number };

export default function StoreCart({ items }: { items: Sku[] }) {
  const [step, setStep] = useState<"browse" | "checkout">("browse");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [labeling, setLabeling] = useState(false);

  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "COD">("COD");

  const [state, formAction, pending] = useActionState<CheckoutState | undefined, FormData>(
    createGeneralOrderAction,
    undefined
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Sku[]>();
    for (const item of items) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => ({ sku: items.find((i) => i.id === Number(id))!, qty })),
    [cart, items]
  );

  const itemsTotal = cartLines.reduce((sum, l) => sum + l.qty * l.sku.unitPrice, 0);
  const labelingCost = labeling ? LABELING_FEE : 0;
  const deliveryCost = DELIVERY_FEE.HOME;
  const total = itemsTotal + labelingCost + deliveryCost;
  const cartCount = cartLines.reduce((sum, l) => sum + l.qty, 0);

  const canCheckout = childName.trim().length > 0 && childClass.trim().length > 0 && cartLines.length > 0;

  function setQty(skuId: number, qty: number) {
    setCart((prev) => ({ ...prev, [skuId]: Math.max(0, qty) }));
  }

  if (step === "checkout") {
    const itemsJson = JSON.stringify(cartLines.map((l) => ({ skuId: l.sku.id, qty: l.qty })));

    return (
      <div className="mx-auto max-w-xl px-6 py-16">
        <button onClick={() => setStep("browse")} className="text-xs text-neutral-400 hover:text-neutral-700">
          ← Back to store
        </button>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Checkout</h1>

        <form action={formAction} className="mt-6 space-y-6">
          <input type="hidden" name="items_json" value={itemsJson} />
          <input type="hidden" name="labeling" value={labeling ? "1" : "0"} />
          <input type="hidden" name="child_name" value={childName} />
          <input type="hidden" name="child_class" value={childClass} />

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-900">Order summary</p>
            <ul className="mt-3 divide-y divide-neutral-100 text-sm">
              {cartLines.map((l) => (
                <li key={l.sku.id} className="flex justify-between py-1.5">
                  <span className="text-neutral-600">
                    {l.sku.name} × {l.qty}
                  </span>
                  <span className="text-neutral-900">{(l.qty * l.sku.unitPrice).toFixed(2)} EGP</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 space-y-1 border-t border-neutral-200 pt-3 text-sm">
              <div className="flex justify-between text-neutral-500">
                <span>Items</span>
                <span>{itemsTotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Labeling</span>
                <span>{labelingCost.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-neutral-500">
                <span>Delivery (home)</span>
                <span>{deliveryCost.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
                <span>Total</span>
                <span>{total.toFixed(2)} EGP</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-900">Your details</p>
            <div className="mt-3 space-y-3">
              <input
                name="parent_name"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                required
                placeholder="Your full name"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
              <input
                name="parent_phone"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                required
                type="tel"
                placeholder="Phone number"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
              <input
                name="parent_email"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
                type="email"
                placeholder="Email (optional)"
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
              <textarea
                name="delivery_address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                placeholder="Delivery address"
                rows={2}
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className="text-sm font-medium text-neutral-900">Payment</p>
            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
                <input
                  type="radio"
                  name="payment_method"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                Cash on delivery
              </label>
              <label className="flex items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 text-sm has-[:checked]:border-neutral-900">
                <input
                  type="radio"
                  name="payment_method"
                  value="CARD"
                  checked={paymentMethod === "CARD"}
                  onChange={() => setPaymentMethod("CARD")}
                />
                Card (test mode — no real charge)
              </label>
            </div>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {pending ? "Placing order..." : "Place order"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:flex lg:gap-10">
      <div className="lg:flex-1">
        <p className="text-sm font-medium text-neutral-500">KITS</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">General Store</h1>
        <p className="mt-1 text-sm text-neutral-500">Browse individual items — no school kit required.</p>

        <div className="mt-6 space-y-6">
          {grouped.map(([category, categoryItems]) => (
            <div key={category} className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {category}
              </div>
              <ul className="divide-y divide-neutral-100">
                {categoryItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                      <p className="text-xs text-neutral-400">
                        {item.unitPrice.toFixed(2)} EGP{item.brand ? ` · ${item.brand}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, (cart[item.id] ?? 0) - 1)}
                        className="h-7 w-7 rounded-md border border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-100"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm text-neutral-900">{cart[item.id] ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, (cart[item.id] ?? 0) + 1)}
                        className="h-7 w-7 rounded-md border border-neutral-300 text-sm text-neutral-600 hover:bg-neutral-100"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 lg:mt-0 lg:w-80 lg:shrink-0">
        <div className="sticky top-8 space-y-5 rounded-lg border border-neutral-200 bg-white p-5">
          <p className="text-sm font-medium text-neutral-900">Cart ({cartCount})</p>

          <label className="flex items-center justify-between text-sm">
            <span>
              <span className="font-medium text-neutral-900">Add labeling</span>
              <span className="block text-xs text-neutral-400">Child&apos;s name on every item</span>
            </span>
            <input type="checkbox" checked={labeling} onChange={(e) => setLabeling(e.target.checked)} className="h-4 w-4" />
          </label>

          <div>
            <p className="text-sm font-medium text-neutral-900">Child details</p>
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
              <span>Delivery (home)</span>
              <span>{deliveryCost.toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
              <span>Total</span>
              <span>{total.toFixed(2)} EGP</span>
            </div>
          </div>

          <button
            onClick={() => canCheckout && setStep("checkout")}
            disabled={!canCheckout}
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            {cartLines.length === 0 ? "Add items to continue" : "Continue to checkout"}
          </button>
        </div>
      </div>
    </div>
  );
}
