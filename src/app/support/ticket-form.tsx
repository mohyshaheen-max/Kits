"use client";

import { useActionState } from "react";
import { createTicketAction } from "@/lib/actions/support";

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
      <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
        Thanks — we&apos;ve got your message and will get back to you soon.
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      {!loggedIn && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="guest_name" className="block text-sm font-medium text-neutral-700">
              Your name
            </label>
            <input
              id="guest_name"
              name="guest_name"
              defaultValue={defaultName}
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="guest_email" className="block text-sm font-medium text-neutral-700">
              Email
            </label>
            <input
              id="guest_email"
              name="guest_email"
              type="email"
              defaultValue={defaultEmail}
              required
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="order_number" className="block text-sm font-medium text-neutral-700">
          Order number (optional)
        </label>
        <input
          id="order_number"
          name="order_number"
          defaultValue={defaultOrderNumber}
          placeholder="KITS-..."
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-neutral-700">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-neutral-700">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
