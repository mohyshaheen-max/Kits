"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/admin/form-controls";
import type { skus } from "@/db/schema";

type Sku = typeof skus.$inferSelect;
type FormState = { error?: string } | undefined;

export default function SkuForm({
  sku,
  action,
  submitLabel,
  pendingLabel,
}: {
  sku?: Sku;
  action: (state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  pendingLabel: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4 rounded-md border border-line bg-surface p-4">
      {sku && <input type="hidden" name="id" value={sku.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="Code" htmlFor="code" hint="Unique. Uppercased automatically.">
          <input
            id="code"
            name="code"
            defaultValue={sku?.code}
            required
            placeholder="CALC-CASIO-FX991ESPLUS"
            className={`${inputClass} font-mono`}
          />
        </Field>
        <Field label="Category" htmlFor="category">
          <input id="category" name="category" defaultValue={sku?.category} required className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Name" htmlFor="name">
          <input id="name" name="name" defaultValue={sku?.name} required className={inputClass} />
        </Field>
        <Field label="Name (Arabic)" htmlFor="name_ar">
          <input id="name_ar" name="name_ar" defaultValue={sku?.nameAr ?? ""} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Spec" htmlFor="spec">
          <input id="spec" name="spec" defaultValue={sku?.spec ?? ""} className={inputClass} />
        </Field>
        <Field label="Size" htmlFor="size">
          <input id="size" name="size" defaultValue={sku?.size ?? ""} className={inputClass} />
        </Field>
        <Field label="Colour" htmlFor="colour">
          <input id="colour" name="colour" defaultValue={sku?.colour ?? ""} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Brand" htmlFor="brand">
          <input id="brand" name="brand" defaultValue={sku?.brand ?? ""} className={inputClass} />
        </Field>
        <Field label="Tier" htmlFor="tier">
          <select id="tier" name="tier" defaultValue={sku?.tier ?? "GEN"} className={inputClass}>
            <option value="GEN">GEN — generic, any brand</option>
            <option value="BRAND">BRAND — a specific brand</option>
            <option value="ANY">ANY — brand shown, any allowed</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Cost" htmlFor="unit_cost" hint="EGP, what KITS pays.">
          <input
            id="unit_cost"
            name="unit_cost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={sku?.unitCost ?? 0}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <Field label="Price" htmlFor="unit_price" hint="EGP, what the customer pays.">
          <input
            id="unit_price"
            name="unit_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={sku?.unitPrice ?? 0}
            className={`${inputClass} font-mono`}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-600">
        <input type="checkbox" name="active" value="1" defaultChecked={sku?.active ?? true} className="accent-teal-600" />
        Active — visible in the General Store and available for kits
      </label>

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
