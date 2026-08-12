import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { orders, orderItems, schools, grades } from "@/db/schema";
import PrintButton from "@/components/admin/print-button";

export default async function OrderLabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const orderId = Number(id);
  if (!orderId) notFound();

  const db = getDb();
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
  if (!order) notFound();

  const [school, grade, lines] = await Promise.all([
    order.schoolId ? db.select().from(schools).where(eq(schools.id, order.schoolId)).then((r) => r[0]) : undefined,
    order.gradeId ? db.select().from(grades).where(eq(grades.id, order.gradeId)).then((r) => r[0]) : undefined,
    db.select().from(orderItems).where(eq(orderItems.orderId, orderId)),
  ]);

  const copies = Math.max(1, lines.reduce((sum, l) => sum + (l.pickedQty ?? l.qty), 0));

  return (
    <div className="p-6">
      <style>{`
        @page { size: 62mm 40mm; margin: 0; }
        @media print {
          .no-print { display: none; }
          .label { break-after: page; }
        }
        @media screen {
          .label { border: 1px dashed #d4d4d4; margin-bottom: 12px; }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-neutral-900">Labels — {order.orderNumber}</h1>
          <p className="text-sm text-neutral-500">
            {copies} label{copies === 1 ? "" : "s"} (one per item). Sized for a 62×40mm thermal roll — adjust in your
            printer dialog if yours differs.
          </p>
        </div>
        <PrintButton />
      </div>

      {Array.from({ length: copies }).map((_, i) => (
        <div key={i} className="label flex h-[151px] w-[234px] flex-col justify-center gap-1 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-400">KITS</p>
          <p className="text-lg font-semibold leading-tight text-neutral-900">{order.childName}</p>
          <p className="text-sm text-neutral-700">{order.childClass}</p>
          <p className="text-xs text-neutral-500">{school?.name ?? "General Store"}</p>
          <p className="text-xs text-neutral-400">
            {grade ? `${grade.label} · ` : ""}
            {order.orderNumber}
          </p>
        </div>
      ))}
    </div>
  );
}
