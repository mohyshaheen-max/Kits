"use client";

import { useActionState } from "react";
import { cancelOrderAction } from "@/lib/actions/orders";

export default function CancelOrderButton({ orderId }: { orderId: number }) {
  const [state, formAction, pending] = useActionState(cancelOrderAction, undefined);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="order_id" value={orderId} />
      {state?.error && <p className="mb-2 text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        onClick={(e) => {
          if (!confirm("Cancel this order? This can't be undone.")) e.preventDefault();
        }}
        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {pending ? "Cancelling..." : "Cancel order"}
      </button>
    </form>
  );
}
