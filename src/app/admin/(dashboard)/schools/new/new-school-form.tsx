"use client";

import { useActionState } from "react";
import { createSchoolAction } from "@/lib/actions/schools";
import { Field, inputClass } from "@/components/admin/form-controls";

export default function NewSchoolForm() {
  const [state, formAction, pending] = useActionState(createSchoolAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <Field label="Name" htmlFor="name">
        <input id="name" name="name" required className={inputClass} placeholder="Al Hoda Language School" />
      </Field>
      <Field label="Name (Arabic)" htmlFor="name_ar">
        <input id="name_ar" name="name_ar" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Tier" htmlFor="tier">
          <select id="tier" name="tier" defaultValue="B" className={inputClass}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </Field>
        <Field label="District" htmlFor="district">
          <input id="district" name="district" className={inputClass} />
        </Field>
      </div>
      <Field label="Referral slug" htmlFor="referral_slug" hint="Used for the parent link /s/[slug]. Leave blank to derive from name.">
        <input id="referral_slug" name="referral_slug" className={inputClass} placeholder="al-hoda" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Contact name" htmlFor="contact_name">
          <input id="contact_name" name="contact_name" className={inputClass} />
        </Field>
        <Field label="Contact phone" htmlFor="contact_phone">
          <input id="contact_phone" name="contact_phone" className={inputClass} />
        </Field>
      </div>
      <Field label="Contact email" htmlFor="contact_email">
        <input id="contact_email" name="contact_email" type="email" className={inputClass} />
      </Field>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Creating..." : "Create school"}
      </button>
    </form>
  );
}
