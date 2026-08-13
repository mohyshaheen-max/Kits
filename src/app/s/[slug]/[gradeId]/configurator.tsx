"use client";

import { useActionState, useMemo, useState } from "react";
import { createOrderAction, type CheckoutState } from "@/lib/actions/orders";
import { LABELING_FEE, DELIVERY_FEE, type DeliveryMethod } from "@/lib/pricing";
import { subjectColor } from "@/lib/subject-color";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";

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

type Account = {
  name: string;
  phone: string | null;
  email: string | null;
  children: { id: number; fullName: string; classSection: string | null }[];
  addresses: { id: number; label: string | null; line: string }[];
} | null;

export default function Configurator({
  kitId,
  schoolName,
  gradeLabel,
  kitName,
  labelingAvailable,
  items,
  account,
}: {
  kitId: number;
  schoolName: string;
  gradeLabel: string;
  kitName: string;
  labelingAvailable: boolean;
  items: Item[];
  account: Account;
}) {
  const [step, setStep] = useState<"configure" | "review">("configure");
  const [included, setIncluded] = useState<Record<number, boolean>>(() =>
    Object.fromEntries(items.filter((i) => i.isOptional).map((i) => [i.id, true]))
  );
  const [labeling, setLabeling] = useState(false);
  const [delivery, setDelivery] = useState<DeliveryMethod>("SCHOOL_BATCH");
  const [savedChildId, setSavedChildId] = useState<string>("");
  const [childName, setChildName] = useState("");
  const [childClass, setChildClass] = useState("");
  const [touched, setTouched] = useState(false);

  const [parentName, setParentName] = useState(account?.name ?? "");
  const [parentPhone, setParentPhone] = useState(account?.phone ?? "");
  const [parentEmail, setParentEmail] = useState(account?.email ?? "");
  const [savedAddressId, setSavedAddressId] = useState<string>("");
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

  const [state, formAction, pending] = useActionState<CheckoutState | undefined, FormData>(createOrderAction, undefined);

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
  const includedOptionalIds = items.filter((i) => i.isOptional && included[i.id]).map((i) => i.id);

  function toggleItem(id: number) {
    setIncluded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (step === "review") {
    return (
      <div className="min-h-screen bg-canvas">
        <SiteHeader customerName={account?.name} />
        <div className="mx-auto max-w-xl px-6 py-16">
          <button onClick={() => setStep("configure")} className="text-xs text-ink-400 hover:text-ink-600">
            ← Back to kit
          </button>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Checkout</h1>
          <p className="mt-1 text-sm text-ink-600">
            {schoolName} — {gradeLabel}
          </p>

          <form action={formAction} className="mt-6 space-y-6">
            <input type="hidden" name="kit_id" value={kitId} />
            <input type="hidden" name="included_optional_ids" value={includedOptionalIds.join(",")} />
            <input type="hidden" name="labeling" value={labeling ? "1" : "0"} />
            <input type="hidden" name="delivery" value={delivery} />
            <input type="hidden" name="child_name" value={childName} />
            <input type="hidden" name="child_class" value={childClass} />

            <div className="rounded-md border border-line bg-surface p-5">
              <p className="text-sm font-medium text-ink-900">Order summary</p>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-600">Child</span>
                  <span className="font-medium text-ink-900">
                    {childName} · {childClass}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Items</span>
                  <span className="font-mono font-medium text-ink-900">{itemsTotal.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">Labeling</span>
                  <span className="font-mono font-medium text-ink-900">
                    {labeling ? `${LABELING_FEE.toFixed(2)} EGP` : "Not added"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-600">
                    Delivery ({delivery === "SCHOOL_BATCH" ? "school batch" : "home"})
                  </span>
                  <span className="font-mono font-medium text-ink-900">{deliveryCost.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 text-base">
                  <span className="font-semibold text-ink-900">Total</span>
                  <span className="font-mono font-semibold text-teal-700">{total.toFixed(2)} EGP</span>
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
                {delivery === "HOME" && (
                  <>
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
                  </>
                )}
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
          <p className="text-sm font-medium text-teal-700">
            {schoolName} — {gradeLabel}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">{kitName}</h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-ink-400 uppercase">{items.length} items · Standard kit</p>

          <div className="mt-6 space-y-6">
            {grouped.map(([subject, subjectItems]) => (
              <div key={subject} className="flex overflow-hidden rounded-md border border-line bg-surface">
                <div className="w-[3px] shrink-0" style={{ backgroundColor: subjectColor(subject) }} />
                <div className="flex-1">
                  <div className="border-b border-line-2 bg-canvas px-4 py-2 text-xs font-medium tracking-wide text-ink-400 uppercase">
                    {subject}
                  </div>
                  <ul className="divide-y divide-line-2">
                    {subjectItems.map((item) => (
                      <li key={item.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.isOptional ? (
                            <input
                              type="checkbox"
                              checked={included[item.id] ?? true}
                              onChange={() => toggleItem(item.id)}
                              className="h-5 w-5 rounded-sm border-line accent-teal-600"
                            />
                          ) : (
                            <span className="h-5 w-5 shrink-0" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-ink-900">
                              {item.skuName}
                              {item.isOptional && (
                                <span className="ml-2 rounded-sm bg-canvas px-2 py-0.5 text-xs font-medium text-ink-600">
                                  optional
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-ink-400">
                              <span className="font-mono">×{item.qty}</span>
                              {item.skuBrand && (
                                <span className="ml-2 rounded-sm bg-canvas px-1.5 py-0.5 text-[11px] font-medium text-ink-600">
                                  {item.skuBrand.toUpperCase()}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <p
                          className={`font-mono text-sm font-medium ${
                            item.isOptional && !included[item.id] ? "text-ink-400 line-through" : "text-ink-900"
                          }`}
                        >
                          {item.lineTotal.toFixed(2)} EGP
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 lg:mt-0 lg:w-80 lg:shrink-0">
          <div className="sticky top-24 space-y-5 rounded-md border border-line bg-surface p-5 shadow-[var(--shadow-token)]">
            {labelingAvailable && (
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
            )}

            <div>
              <p className="text-sm font-medium text-ink-900">Delivery</p>
              <div className="mt-2 space-y-2">
                <label className="flex items-center justify-between rounded-sm border border-line px-3 py-2 text-sm has-[:checked]:border-teal-500 has-[:checked]:bg-teal-050">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === "SCHOOL_BATCH"}
                      onChange={() => setDelivery("SCHOOL_BATCH")}
                      className="accent-teal-600"
                    />
                    Collect at school
                    <span className="rounded-sm bg-ok-bg px-2 py-0.5 text-xs font-medium text-ok">cheaper</span>
                  </span>
                  <span className="font-mono text-ink-600">{DELIVERY_FEE.SCHOOL_BATCH} EGP</span>
                </label>
                <label className="flex items-center justify-between rounded-sm border border-line px-3 py-2 text-sm has-[:checked]:border-teal-500 has-[:checked]:bg-teal-050">
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="delivery"
                      checked={delivery === "HOME"}
                      onChange={() => setDelivery("HOME")}
                      className="accent-teal-600"
                    />
                    Home delivery
                  </span>
                  <span className="font-mono text-ink-600">{DELIVERY_FEE.HOME} EGP</span>
                </label>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink-900">Child details</p>
              <p className="text-xs text-ink-400">Required for labelling and school collection.</p>
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
                {touched && !canContinue && (
                  <p className="text-xs text-error">Child&apos;s name and class are required.</p>
                )}
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
                <span>Delivery</span>
                <span className="font-mono">{deliveryCost.toFixed(2)} EGP</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-ink-900">
                <span>Total</span>
                <span className="font-mono text-teal-700">{total.toFixed(2)} EGP</span>
              </div>
            </div>

            <button
              onClick={() => {
                setTouched(true);
                if (canContinue) setStep("review");
              }}
              className="cut-tr w-full rounded-md bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
            >
              Continue to checkout
            </button>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
