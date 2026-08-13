"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/account";

const fieldClass =
  "mt-1 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500";

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-4 rounded-md border border-line bg-surface p-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="current_password" className="block text-sm font-medium text-ink-600">
            Current password
          </label>
          <input id="current_password" name="current_password" type="password" required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="new_password" className="block text-sm font-medium text-ink-600">
            New password
          </label>
          <input id="new_password" name="new_password" type="password" required minLength={8} className={fieldClass} />
        </div>
      </div>
      {state?.error && <p className="text-sm text-error">{state.error}</p>}
      {state?.ok && <p className="text-sm text-ok">Password updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Updating..." : "Change password"}
      </button>
    </form>
  );
}
