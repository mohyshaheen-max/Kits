import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { returns, returnItems, orders, orderItems, skus, refundLogs } from "@/db/schema";
import { declineReturnAction, approveReturnAction } from "@/lib/actions/returns";

const CONDITIONS = ["good", "damaged", "rejected"] as const;

export default async function AdminReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const returnId = Number(id);
  if (!returnId) notFound();

  const db = getDb();
  const [ret] = await db.select().from(returns).where(eq(returns.id, returnId)).limit(1);
  if (!ret) notFound();

  const [order, lines, logs] = await Promise.all([
    db.select().from(orders).where(eq(orders.id, ret.orderId)).then((r) => r[0]),
    db
      .select({ line: returnItems, orderItem: orderItems, sku: skus })
      .from(returnItems)
      .innerJoin(orderItems, eq(returnItems.orderItemId, orderItems.id))
      .innerJoin(skus, eq(orderItems.skuId, skus.id))
      .where(eq(returnItems.returnId, returnId)),
    db.select().from(refundLogs).where(eq(refundLogs.returnId, returnId)),
  ]);

  const suggestedRefund = lines.reduce((sum, { line, orderItem }) => sum + line.qty * orderItem.unitPrice, 0);

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-neutral-500">{order?.orderNumber}</p>
      <h1 className="mt-1 text-xl font-semibold text-neutral-900">Return #{ret.id}</h1>
      <p className="mt-1 text-sm text-neutral-600">
        {ret.reason}
        {ret.message && <span className="text-neutral-400"> — {ret.message}</span>}
      </p>

      <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-2 font-medium">Item</th>
              <th className="px-4 py-2 font-medium">Qty</th>
              <th className="px-4 py-2 font-medium">Line value</th>
              <th className="px-4 py-2 font-medium">Condition</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {lines.map(({ line, orderItem, sku }) => (
              <tr key={line.id}>
                <td className="px-4 py-2 font-medium text-neutral-900">{sku.name}</td>
                <td className="px-4 py-2 text-neutral-600">{line.qty}</td>
                <td className="px-4 py-2 text-neutral-600">{(line.qty * orderItem.unitPrice).toFixed(2)} EGP</td>
                <td className="px-4 py-2">
                  {ret.status === "requested" ? (
                    <select
                      name={`condition_${line.id}`}
                      form="approve-form"
                      defaultValue="good"
                      className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                    >
                      {CONDITIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-neutral-600">{line.condition}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ret.status === "requested" ? (
        <div className="mt-6 space-y-4">
          <form id="approve-form" action={approveReturnAction} className="rounded-lg border border-neutral-200 bg-white p-4">
            <input type="hidden" name="id" value={ret.id} />
            <input type="hidden" name="order_id" value={ret.orderId} />
            <label className="block text-sm font-medium text-neutral-700">Refund amount</label>
            <p className="text-xs text-neutral-400">Suggested (full value of selected items): {suggestedRefund.toFixed(2)} EGP</p>
            <input
              name="refund_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={suggestedRefund.toFixed(2)}
              className="mt-2 w-40 rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
            />
            <div className="mt-3">
              <button
                type="submit"
                className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Approve & process
              </button>
            </div>
          </form>

          <form action={declineReturnAction}>
            <input type="hidden" name="id" value={ret.id} />
            <button type="submit" className="text-sm text-neutral-500 hover:text-red-600">
              Decline this return
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4 text-sm">
          <p className="font-medium text-neutral-900">
            {ret.status === "approved" ? "Approved" : "Declined"} by {ret.decidedBy} on{" "}
            {ret.decidedAt ? new Date(ret.decidedAt).toLocaleString() : ""}
          </p>
          {logs.map((l) => (
            <p key={l.id} className="mt-1 text-neutral-600">
              Refund logged: {l.amount.toFixed(2)} EGP
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
