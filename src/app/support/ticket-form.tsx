"use client";

import { useActionState } from "react";
import { createTicketAction } from "@/lib/actions/support";

const fieldClass =
  "mt-1 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500";

export default function TicketForm({
  loggedIn,
  defaultName,
  defaultEmail,
  defaultOrderNumber,
}: {
  loggedIn: boolean;
  defaultName: string;
  defaultEmail: string;
  defaultOrderNumber: string;
}) {
  const [state, formAction, pending] = useActionState(createTicketAction, undefined);

  if (state?.ok) {
    return (
      <div className="mt-6 rounded-md border border-ok bg-ok-bg p-4 text-sm text-ok">
        Thanks — we&apos;ve got your message and will get back to you soon.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-md border border-line bg-surface p-5">
      {!loggedIn && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="guest_name" className="block text-sm font-medium text-ink-600">
              Your name
            </label>
            <input id="guest_name" name="guest_name" defaultValue={defaultName} required className={fieldClass} />
          </div>
          <div>
            <label htmlFor="guest_email" className="block text-sm font-medium text-ink-600">
              Email
            </label>
            <input
              id="guest_email"
              name="guest_email"
              type="email"
              defaultValue={defaultEmail}
              required
              className={fieldClass}
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="order_number" className="block text-sm font-medium text-ink-600">
          Order number (optional)
        </label>
        <input
          id="order_number"
          name="order_number"
          defaultValue={defaultOrderNumber}
          placeholder="KITS-..."
          className={fieldClass}
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-ink-600">
          Subject
        </label>
        <input id="subject" name="subject" required className={fieldClass} />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-ink-600">
          Message
        </label>
        <textarea id="message" name="message" required rows={5} className={fieldClass} />
      </div>

      {state?.error && (
        <p className="rounded-sm border border-error bg-error-bg px-3 py-2 text-sm text-error">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="cut-tr w-full rounded-md bg-teal-600 px-4 py-3 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
