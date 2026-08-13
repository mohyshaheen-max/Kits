"use client";

import { useActionState } from "react";
import { updateSchoolAction } from "@/lib/actions/schools";
import { Field, inputClass } from "@/components/admin/form-controls";
import type { schools } from "@/db/schema";

type School = typeof schools.$inferSelect;

export default function SchoolDetailsForm({ school }: { school: School }) {
  const [state, formAction, pending] = useActionState(updateSchoolAction, undefined);

  return (
    <form action={formAction} className="mt-3 space-y-4 rounded-md border border-line bg-surface p-4">
      <input type="hidden" name="id" value={school.id} />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" htmlFor="name">
          <input id="name" name="name" defaultValue={school.name} required className={inputClass} />
        </Field>
        <Field label="Name (Arabic)" htmlFor="name_ar">
          <input id="name_ar" name="name_ar" defaultValue={school.nameAr ?? ""} className={inputClass} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Tier" htmlFor="tier">
          <select id="tier" name="tier" defaultValue={school.tier} className={inputClass}>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </Field>
        <Field label="District" htmlFor="district">
          <input id="district" name="district" defaultValue={school.district ?? ""} className={inputClass} />
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue={school.status} className={inputClass}>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Contact name" htmlFor="contact_name">
          <input id="contact_name" name="contact_name" defaultValue={school.contactName ?? ""} className={inputClass} />
        </Field>
        <Field label="Contact phone" htmlFor="contact_phone">
          <input id="contact_phone" name="contact_phone" defaultValue={school.contactPhone ?? ""} className={inputClass} />
        </Field>
        <Field label="Contact email" htmlFor="contact_email">
          <input
            id="contact_email"
            name="contact_email"
            type="email"
            defaultValue={school.contactEmail ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      {state?.error && <p className="text-sm text-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save details"}
      </button>
    </form>
  );
}
