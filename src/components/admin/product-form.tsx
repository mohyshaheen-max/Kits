"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/admin/form-controls";
import type { products } from "@/db/schema";

type Product = typeof products.$inferSelect;
type FormState = { error?: string } | undefined;

export default function ProductForm({
  product,
  action,
  submitLabel,
  pendingLabel,
}: {
  product?: Product;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="space-y-4 rounded-md border border-line bg-surface p-4">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" htmlFor="name" hint="The family name shoppers browse by.">
          <input id="name" name="name" defaultValue={product?.name} required placeholder="Colour pencils" className={inputClass} />
        </Field>
        <Field label="Name (Arabic)" htmlFor="name_ar">
          <input id="name_ar" name="name_ar" defaultValue={product?.nameAr ?? ""} className={inputClass} />
        </Field>
      </div>

      <Field label="Category" htmlFor="category">
        <input id="category" name="category" defaultValue={product?.category} required className={inputClass} />
      </Field>

      {product && (
        <label className="flex items-center gap-2 text-sm text-ink-600">
          <input
            type="checkbox"
            name="active"
            value="1"
            defaultChecked={product.active}
            className="accent-teal-600"
          />
          Active — visible in the General Store
        </label>
      )}

      {state?.error && <p className="text-sm text-error">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
    </form>
  );
}
