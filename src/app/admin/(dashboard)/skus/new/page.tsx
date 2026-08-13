import SkuForm from "@/components/admin/sku-form";
import { createSkuAction } from "@/lib/actions/skus";

export default function NewSkuPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold text-ink-900">New SKU</h1>
      <p className="mt-1 text-sm text-ink-400">Add an item to the catalogue before using it in a kit or list.</p>
      <SkuForm action={createSkuAction} submitLabel="Create SKU" pendingLabel="Creating..." />
    </div>
  );
}
