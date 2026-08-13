"use client";

import { useActionState, useState } from "react";
import { requestReturnAction } from "@/lib/actions/returns";
import { categoryIcon } from "@/lib/category-icon";

type Item = { id: number; name: string; category: string; qty: number };

const REASONS = ["Wrong item", "Damaged / defective", "No longer needed", "Doesn't fit", "Other"];

export default function ReturnForm({ orderId, items }: { orderId: number; items: Item[] }) {
  const [state, formAction, pending] = useActionState(requestReturnAction, undefined);
  const [qtys, setQtys] = useState<Record<number, number>>({});

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
        Return requested — we&apos;ll review it and follow up.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <input type="hidden" name="order_id" value={orderId} />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <ul className="divide-y divide-neutral-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={(qtys[item.id] ?? 0) > 0}
                onChange={(e) => setQtys((prev) => ({ ...prev, [item.id]: e.target.checked ? item.qty : 0 }))}
                className="h-4 w-4 accent-indigo-600"
              />
              <span className="text-lg leading-none">{categoryIcon(item.category)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                <p className="text-xs text-neutral-400">Ordered qty {item.qty}</p>
              </div>
              <input
                type="number"
                name={`qty_${item.id}`}
                min={0}
                max={item.qty}
                value={qtys[item.id] ?? 0}
                onChange={(e) =>
                  setQtys((prev) => ({ ...prev, [item.id]: Math.max(0, Math.min(item.qty, Number(e.target.value))) }))
                }
                disabled={(qtys[item.id] ?? 0) === 0}
                className="w-16 rounded-md border border-neutral-300 px-2 py-1 text-sm disabled:bg-neutral-100"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
        <label htmlFor="reason" className="block text-sm font-medium text-neutral-900">
          Reason
        </label>
        <select
          id="reason"
          name="reason"
          required
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        >
          <option value="">Choose a reason...</option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label htmlFor="message" className="mt-4 block text-sm font-medium text-neutral-900">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="mt-2 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit return request"}
      </button>
    </form>
  );
}
