"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/account";

const fieldClass =
  "mt-1 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500";

export default function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-4 rounded-md border border-line bg-surface p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink-600">
            Name
          </label>
          <input id="name" name="name" defaultValue={name} required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-ink-600">
            Phone
          </label>
          <input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} className={fieldClass} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-error">{state.error}</p>}
      {state?.ok && <p className="text-sm text-ok">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
