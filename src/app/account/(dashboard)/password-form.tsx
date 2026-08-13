"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/account";
import { Field, inputClass } from "@/components/admin/form-controls";

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Current password" htmlFor="current_password">
          <input id="current_password" name="current_password" type="password" required className={inputClass} />
        </Field>
        <Field label="New password" htmlFor="new_password">
          <input id="new_password" name="new_password" type="password" required minLength={8} className={inputClass} />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">Password updated.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Updating..." : "Change password"}
      </button>
    </form>
  );
}
