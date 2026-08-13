"use client";

import { useActionState, useMemo, useState } from "react";
import { createGeneralOrderAction, type CheckoutState } from "@/lib/actions/orders";
import { LABELING_FEE, DELIVERY_FEE } from "@/lib/pricing";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";

type Sku = { id: number; name: string; category: string; brand: string | null; unitPrice: number };

type Account = {
  name: string;
  phone: string | null;
  email: string | null;
  children: { id: number; fullName: string; classSection: string | null }[];
  addresses: { id: number; label: string | null; line: string }[];
} | null;

export default function StoreCart({ items, account }: { items: Sku[]; account: Account }) {
  const [step, setStep] = useState<"browse" | "checkout">("browse");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [labeling, setLabeling] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc">("name");

  const [parentName, setParentName] = useState(account?.name ?? "");
  const [parentPhone, setParentPhone] = useState(account?.phone ?? "");
  const [parentEmail, setParentEmail] = useState(account?.email ?? "");
  const [savedChildId, setSavedChildId] = useState("");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [savedAddressId, setSavedAddressId] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CARD" | "COD">("COD");

  function selectSavedChild(id: string) {
    setSavedChildId(id);
    const child = account?.children.find((c) => String(c.id) === id);
    if (child) {
      setChildName(child.fullName);
      setChildClass(child.classSection ?? "");
    }
  }

  function selectSavedAddress(id: string) {
    setSavedAddressId(id);
    const address = account?.addresses.find((a) => String(a.id) === id);
    if (address) setDeliveryAddress(address.line);
  }

  const [state, formAction, pending] = useActionState<CheckoutState | undefined, FormData>(
    createGeneralOrderAction,
    undefined
  );

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);

  const filtersActive = search.trim().length > 0 || category !== "" || sortBy !== "name";

  const filteredItems = useMemo(() => {
    let result = items;
    if (category) result = result.filter((i) => i.category === category);
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (i) => i.name.toLowerCase().includes(q) || (i.brand ?? "").toLowerCase().includes(q)
      );
    }
    const sorted = [...result];
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "price-asc") sorted.sort((a, b) => a.unitPrice - b.unitPrice);
    else if (sortBy === "price-desc") sorted.sort((a, b) => b.unitPrice - a.unitPrice);
    return sorted;
  }, [items, category, search, sortBy]);

  // Grouped-by-category browse view only in the neutral default state; any
  // active search, sort, or category filter collapses to a flat result list.
  const grouped = useMemo(() => {
    if (filtersActive) return [] as [string, Sku[]][];
    const map = new Map<string, Sku[]>();
    for (const item of filteredItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category)!.push(item);
    }
    return Array.from(map.entries());
  }, [filteredItems, filtersActive]);

  function clearFilters() {
    setSearch("");
    setCategory("");
    setSortBy("name");
  }

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
      <div className="min-h-screen bg-canvas">
        <SiteHeader customerName={account?.name} />
        <div className="mx-auto max-w-xl px-6 py-16">
          <button onClick={() => setStep("browse")} className="text-xs text-ink-400 hover:text-ink-600">
            ← Back to store
          </button>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Checkout</h1>

          <form action={formAction} className="mt-6 space-y-6">
            <input type="hidden" name="items_json" value={itemsJson} />
            <input type="hidden" name="labeling" value={labeling ? "1" : "0"} />
            <input type="hidden" name="child_name" value={childName} />
            <input type="hidden" name="child_class" value={childClass} />

            <div className="rounded-md border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink-900">Order summary</p>
              <ul className="mt-3 divide-y divide-line-2 text-sm">
                {cartLines.map((l) => (
                  <li key={l.sku.id} className="flex items-center justify-between py-1.5">
                    <span className="text-ink-600">
                      {l.sku.name} <span className="font-mono">×{l.qty}</span>
                    </span>
                    <span className="font-mono text-ink-900">{(l.qty * l.sku.unitPrice).toFixed(2)} EGP</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Items</span>
                  <span className="font-mono">{itemsTotal.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Labeling</span>
                  <span className="font-mono">{labelingCost.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Delivery (home)</span>
                  <span className="font-mono">{deliveryCost.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink-900">
                  <span>Total</span>
                  <span className="font-mono text-teal-700">{total.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink-900">Your details</p>
              <div className="mt-3 space-y-3">
                <input
                  name="parent_name"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  required
                  placeholder="Your full name"
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                />
                <input
                  name="parent_phone"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  required
                  type="tel"
                  placeholder="Phone number"
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                />
                <input
                  name="parent_email"
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  type="email"
                  placeholder="Email (optional)"
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                />
                {account && account.addresses.length > 0 && (
                  <select
                    value={savedAddressId}
                    onChange={(e) => selectSavedAddress(e.target.value)}
                    className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                  >
                    <option value="">Enter new address...</option>
                    {account.addresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label ? `${a.label} — ` : ""}
                        {a.line}
                      </option>
                    ))}
                  </select>
                )}
                <textarea
                  name="delivery_address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  required
                  placeholder="Delivery address"
                  rows={2}
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                />
              </div>
            </div>

            <div className="rounded-md border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink-900">Payment</p>
              <div className="mt-3 space-y-2">
                <label className="flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-sm has-[:checked]:border-teal-500 has-[:checked]:bg-teal-050">
                  <input
                    type="radio"
                    name="payment_method"
                    value="COD"
                    checked={paymentMethod === "COD"}
                    onChange={() => setPaymentMethod("COD")}
                    className="accent-teal-600"
                  />
                  Cash on delivery
                </label>
                <label className="flex items-center gap-2 rounded-sm border border-line px-3 py-2 text-sm has-[:checked]:border-teal-500 has-[:checked]:bg-teal-050">
                  <input
                    type="radio"
                    name="payment_method"
                    value="CARD"
                    checked={paymentMethod === "CARD"}
                    onChange={() => setPaymentMethod("CARD")}
                    className="accent-teal-600"
                  />
                  Card (test mode — no real charge)
                </label>
              </div>
            </div>

            {state?.error && (
              <p className="rounded-sm border border-error bg-error-bg px-3 py-2 text-sm text-error">{state.error}</p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="cut-tr w-full rounded-md bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {pending ? "Placing order..." : "Place order"}
            </button>
          </form>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader customerName={account?.name} />
      <div className="mx-auto max-w-4xl px-6 py-12 lg:flex lg:gap-10">
        <div className="lg:flex-1">
          <p className="text-sm font-medium text-teal-700">General Store</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Buy items individually</h1>
          <p className="mt-1 text-sm text-ink-600">No school kit required.</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="flex-1 rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
            >
              <option value="name">Sort: Name A–Z</option>
              <option value="price-asc">Sort: Price low to high</option>
              <option value="price-desc">Sort: Price high to low</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory("")}
              className={`rounded-sm px-3 py-1.5 text-xs font-medium ${
                category === "" ? "bg-teal-100 text-teal-800" : "border border-line text-ink-600 hover:bg-teal-050"
              }`}
            >
              All <span className="font-mono">({items.length})</span>
            </button>
            {categories.map(([catName, count]) => (
              <button
                key={catName}
                type="button"
                onClick={() => setCategory(catName)}
                className={`rounded-sm px-3 py-1.5 text-xs font-medium ${
                  category === catName
                    ? "bg-teal-100 text-teal-800"
                    : "border border-line text-ink-600 hover:bg-teal-050"
                }`}
              >
                {catName} <span className="font-mono">({count})</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-ink-400">
              <span className="font-mono">{filteredItems.length}</span> item{filteredItems.length === 1 ? "" : "s"}
            </p>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="text-xs font-medium text-teal-700 hover:underline">
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-4 space-y-6">
            {filteredItems.length === 0 && (
              <div className="rounded-md border border-line bg-surface p-8 text-center">
                <p className="text-sm font-medium text-ink-900">No items match your search.</p>
                <p className="mt-1 text-sm text-ink-400">Try a different term or clear your filters.</p>
                <button type="button" onClick={clearFilters} className="mt-3 text-sm font-medium text-teal-700 hover:underline">
                  Clear filters
                </button>
              </div>
            )}

            {filtersActive
              ? filteredItems.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {filteredItems.map((item) => (
                      <StoreItemRow key={item.id} item={item} qty={cart[item.id] ?? 0} onQtyChange={setQty} showCategory />
                    ))}
                  </div>
                )
              : grouped.map(([catName, categoryItems]) => (
                  <div key={catName}>
                    <h2 className="mb-3 text-xs font-medium tracking-wide text-ink-400 uppercase">{catName}</h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {categoryItems.map((item) => (
                        <StoreItemRow key={item.id} item={item} qty={cart[item.id] ?? 0} onQtyChange={setQty} />
                      ))}
                    </div>
                  </div>
                ))}
          </div>
        </div>

        <div className="mt-8 lg:mt-0 lg:w-80 lg:shrink-0">
          <div className="sticky top-24 space-y-5 rounded-md border border-line bg-surface p-5 shadow-[var(--shadow-token)]">
            <p className="text-sm font-medium text-ink-900">
              Cart (<span className="font-mono">{cartCount}</span>)
            </p>

            <label className="flex items-center justify-between text-sm">
              <span>
                <span className="font-medium text-ink-900">Add name labels</span>
                <span className="block text-xs text-ink-400">Child&apos;s name on every item</span>
              </span>
              <input
                type="checkbox"
                checked={labeling}
                onChange={(e) => setLabeling(e.target.checked)}
                className="h-5 w-5 rounded-sm border-line accent-teal-600"
              />
            </label>

            <div>
              <p className="text-sm font-medium text-ink-900">Child details</p>
              <div className="mt-2 space-y-2">
                {account && account.children.length > 0 && (
                  <select
                    value={savedChildId}
                    onChange={(e) => selectSavedChild(e.target.value)}
                    className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                  >
                    <option value="">Enter new child...</option>
                    {account.children.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                        {c.classSection ? ` · ${c.classSection}` : ""}
                      </option>
                    ))}
                  </select>
                )}
                <input
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Child's full name"
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                />
                <input
                  value={childClass}
                  onChange={(e) => setChildClass(e.target.value)}
                  placeholder="Class / section"
                  className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
                />
              </div>
            </div>

            <div className="space-y-1 border-t border-line pt-3 text-sm">
              <div className="flex justify-between text-ink-600">
                <span>Items</span>
                <span className="font-mono">{itemsTotal.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Labeling</span>
                <span className="font-mono">{labelingCost.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between text-ink-600">
                <span>Delivery (home)</span>
                <span className="font-mono">{deliveryCost.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink-900">
                <span>Total</span>
                <span className="font-mono text-teal-700">{total.toFixed(2)} EGP</span>
              </div>
            </div>

            <button
              onClick={() => canCheckout && setStep("checkout")}
              disabled={!canCheckout}
              className="cut-tr w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {cartLines.length === 0 ? "Add items to continue" : "Continue to checkout"}
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function StoreItemRow({
  item,
  qty,
  onQtyChange,
  showCategory,
}: {
  item: Sku;
  qty: number;
  onQtyChange: (skuId: number, qty: number) => void;
  showCategory?: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-surface p-4">
      <div>
        <p className="text-sm font-medium text-ink-900">{item.name}</p>
        <p className="text-xs text-ink-400">
          <span className="font-mono">{item.unitPrice.toFixed(2)} EGP</span>
          {showCategory ? ` · ${item.category}` : ""}
          {item.brand ? ` · ${item.brand}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onQtyChange(item.id, qty - 1)}
          className="h-7 w-7 rounded-sm border border-line text-sm text-ink-600 hover:bg-canvas"
        >
          −
        </button>
        <span className="w-6 text-center font-mono text-sm text-ink-900">{qty}</span>
        <button
          type="button"
          onClick={() => onQtyChange(item.id, qty + 1)}
          className="h-7 w-7 rounded-sm border border-line text-sm text-ink-600 hover:bg-canvas"
        >
          +
        </button>
      </div>
    </div>
  );
}
