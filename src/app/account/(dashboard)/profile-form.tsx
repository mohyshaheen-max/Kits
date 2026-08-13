"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/lib/actions/account";
import { Field, inputClass } from "@/components/admin/form-controls";

export default function ProfileForm({ name, phone }: { name: string; phone: string | null }) {
  const [state, formAction, pending] = useActionState(updateProfileAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-4 rounded-lg border border-neutral-200 bg-white p-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" htmlFor="name">
          <input id="name" name="name" defaultValue={name} required className={inputClass} />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <input id="phone" name="phone" type="tel" defaultValue={phone ?? ""} className={inputClass} />
        </Field>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
