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
        className="w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
      />
      {state?.error && <p className="text-sm text-error">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Reply"}
      </button>
    </form>
  );
}
