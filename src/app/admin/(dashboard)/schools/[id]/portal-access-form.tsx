"use client";

import { useActionState } from "react";
import { createSchoolAdminAction } from "@/lib/actions/schools";
import { inputClass } from "@/components/admin/form-controls";

export default function PortalAccessForm({ schoolId }: { schoolId: number }) {
  const [state, formAction, pending] = useActionState(createSchoolAdminAction, undefined);

  return (
    <form action={formAction} className="border-t border-neutral-200 p-3">
      <input type="hidden" name="school_id" value={schoolId} />
      <div className="grid grid-cols-4 items-end gap-2">
        <div>
          <label className="block text-xs text-neutral-500">Email</label>
          <input name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Name</label>
          <input name="name" className={inputClass} />
        </div>
        <div>
          <label className="block text-xs text-neutral-500">Password (share with them)</label>
          <input name="password" type="text" required minLength={8} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="h-[38px] rounded-md bg-neutral-900 px-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "Adding..." : "Add login"}
        </button>
      </div>
      {state?.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
