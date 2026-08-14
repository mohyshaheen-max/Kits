import ProductForm from "@/components/admin/product-form";
import { createProductAction } from "@/lib/actions/products";

export default function NewProductPage() {
  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-ink-900">New product</h1>
      <p className="mt-1 text-sm text-ink-400">
        The family a shopper browses by, e.g. &quot;Colour pencils&quot; or &quot;Glue stick&quot;. Add its variants
        (pack size, brand, colour) after creating it.
      </p>
      <div className="mt-6">
        <ProductForm action={createProductAction} submitLabel="Create product" pendingLabel="Creating..." />
      </div>
    </div>
  );
}
