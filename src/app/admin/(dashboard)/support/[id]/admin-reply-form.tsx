"use client";

import { useState } from "react";
import { adminReplyTicketAction } from "@/lib/actions/support";

export default function AdminReplyForm({ ticketId }: { ticketId: number }) {
  const [isInternal, setIsInternal] = useState(false);

  return (
    <form action={adminReplyTicketAction} className="mt-4 space-y-2">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <input type="hidden" name="is_internal_note" value={isInternal ? "1" : "0"} />
      <textarea
        name="body"
        required
        rows={3}
        placeholder={isInternal ? "Internal note (not visible to customer)..." : "Reply to customer..."}
        className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none ${
          isInternal ? "border-amber-300 bg-amber-50 focus:border-amber-500" : "border-neutral-300 focus:border-neutral-500"
        }`}
      />
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={isInternal}
            onChange={(e) => setIsInternal(e.target.checked)}
            className="h-4 w-4"
          />
          Internal note (staff only)
        </label>
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {isInternal ? "Add note" : "Send reply"}
        </button>
      </div>
    </form>
  );
}
