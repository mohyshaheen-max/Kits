"use client";

import { useActionState } from "react";
import { requestListUpdateAction } from "@/lib/actions/school-portal";
import { inputClass } from "@/components/admin/form-controls";

export default function RequestForm({ grades }: { grades: { id: number; label: string }[] }) {
  const [state, formAction, pending] = useActionState(requestListUpdateAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div>
        <label htmlFor="grade_id" className="block text-sm font-medium text-neutral-700">
          Grade (optional)
        </label>
        <select id="grade_id" name="grade_id" className={inputClass} defaultValue="">
          <option value="">All grades</option>
          {grades.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-neutral-700">
          What needs to change?
        </label>
        <textarea id="note" name="note" required rows={5} className={inputClass} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">Request sent — we&apos;ll be in touch.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
