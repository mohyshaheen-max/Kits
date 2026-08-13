"use client";

import { useActionState } from "react";
import { replyTicketAction } from "@/lib/actions/support";

export default function ReplyForm({ ticketId }: { ticketId: number }) {
  const [state, formAction, pending] = useActionState(replyTicketAction, undefined);

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <textarea
        name="body"
        required
        rows={3}
        placeholder="Write a reply..."
        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Reply"}
      </button>
    </form>
  );
}
