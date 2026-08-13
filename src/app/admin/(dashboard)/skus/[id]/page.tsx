import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { skus } from "@/db/schema";
import SkuForm from "@/components/admin/sku-form";
import { updateSkuAction } from "@/lib/actions/skus";

export default async function SkuDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const skuId = Number(id);
  if (!skuId) notFound();

  const db = getDb();
  const [sku] = await db.select().from(skus).where(eq(skus.id, skuId)).limit(1);
  if (!sku) notFound();

  return (
    <div className="max-w-2xl">
      <Link href="/admin/skus" className="text-xs text-ink-400 hover:text-ink-600">
        ← SKU catalogue
      </Link>
      <h1 className="mt-1 text-xl font-semibold text-ink-900">{sku.name}</h1>
      <p className="mt-1 font-mono text-sm text-ink-400">{sku.code}</p>
      <SkuForm sku={sku} action={updateSkuAction} submitLabel="Save changes" pendingLabel="Saving..." />
    </div>
  );
}
