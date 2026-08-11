"use client";

import { useActionState } from "react";
import { publishKitAction } from "@/lib/actions/kits";

export default function PublishButton({ kitId }: { kitId: number }) {
  const [state, formAction, pending] = useActionState(publishKitAction, undefined);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="kit_id" value={kitId} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {pending ? "Publishing..." : "Publish"}
        </button>
      </form>
      {state?.errors && state.errors.length > 0 && (
        <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <p className="font-medium">Can&apos;t publish yet:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            {state.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {state?.errors && state.errors.length === 0 && (
        <p className="mt-2 text-sm font-medium text-emerald-700">Published.</p>
      )}
    </div>
  );
}
