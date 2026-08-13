import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, skus } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/customer-session";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";
import ReturnForm from "./return-form";

export const dynamic = "force-dynamic";

export default async function RequestReturnPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!order) notFound();

  const customer = await getCurrentCustomer();
  if (!customer || order.customerId !== customer.id) redirect(`/orders/${orderNumber}`);
  if (order.fulfilmentStatus !== "delivered") redirect(`/orders/${orderNumber}`);

  const items = await db
    .select({ item: orderItems, sku: skus })
    .from(orderItems)
    .innerJoin(skus, eq(orderItems.skuId, skus.id))
    .where(eq(orderItems.orderId, order.id));

  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader customerName={customer.name} />
      <div className="mx-auto max-w-xl px-6 py-16">
        <p className="text-sm text-ink-600">{order.orderNumber}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Request a return</h1>
        <p className="mt-1 text-sm text-ink-600">Select the items you&apos;d like to return and tell us why.</p>

        <ReturnForm
          orderId={order.id}
          items={items.map(({ item, sku }) => ({
            id: item.id,
            name: sku.name,
            category: sku.category,
            qty: item.qty,
          }))}
        />
      </div>
      <SiteFooter />
    </div>
  );
}
