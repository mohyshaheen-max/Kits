"use client";

import { useActionState, useState } from "react";
import { requestReturnAction } from "@/lib/actions/returns";

type Item = { id: number; name: string; category: string; qty: number };

const REASONS = ["Wrong item", "Damaged / defective", "No longer needed", "Doesn't fit", "Other"];

export default function ReturnForm({ orderId, items }: { orderId: number; items: Item[] }) {
  const [state, formAction, pending] = useActionState(requestReturnAction, undefined);
  const [qtys, setQtys] = useState<Record<number, number>>({});

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-md border border-ok bg-ok-bg p-4 text-sm text-ok">
        Return requested — we&apos;ll review it and follow up.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-6">
      <input type="hidden" name="order_id" value={orderId} />

      <div className="overflow-hidden rounded-md border border-line bg-surface">
        <ul className="divide-y divide-line-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={(qtys[item.id] ?? 0) > 0}
                onChange={(e) => setQtys((prev) => ({ ...prev, [item.id]: e.target.checked ? item.qty : 0 }))}
                className="h-5 w-5 rounded-sm border-line accent-teal-600"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-ink-900">{item.name}</p>
                <p className="text-xs text-ink-400">
                  Ordered qty <span className="font-mono">{item.qty}</span>
                </p>
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
                className="w-16 rounded-sm border border-line px-2 py-1 font-mono text-sm disabled:bg-canvas"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-md border border-line bg-surface p-5">
        <label htmlFor="reason" className="block text-sm font-medium text-ink-900">
          Reason
        </label>
        <select
          id="reason"
          name="reason"
          required
          className="mt-2 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
        >
          <option value="">Choose a reason...</option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label htmlFor="message" className="mt-4 block text-sm font-medium text-ink-900">
          Message (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          className="mt-2 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
        />
      </div>

      {state?.error && (
        <p className="rounded-sm border border-error bg-error-bg px-3 py-2 text-sm text-error">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="cut-tr w-full rounded-md bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Submitting..." : "Submit return request"}
      </button>
    </form>
  );
}
