import Link from "next/link";
import { headers } from "next/headers";
import { and, asc, eq, notInArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, kits, orders } from "@/db/schema";
import { requireSchoolPortal } from "@/lib/school-session";

export const dynamic = "force-dynamic";

export default async function PortalDashboardPage() {
  const schoolAdmin = await requireSchoolPortal();
  const db = getDb();

  const [school] = await db.select().from(schools).where(eq(schools.id, schoolAdmin.schoolId)).limit(1);
  if (!school) {
    return <p className="text-sm text-neutral-500">Your school could not be found — contact KITS support.</p>;
  }

  const [liveKits, [commission]] = await Promise.all([
    db
      .select({ kitId: kits.id, gradeId: kits.gradeId, gradeLabel: grades.label, sortOrder: grades.sortOrder })
      .from(kits)
      .innerJoin(grades, eq(kits.gradeId, grades.id))
      .where(and(eq(kits.schoolId, school.id), eq(kits.status, "live")))
      .orderBy(asc(grades.sortOrder)),
    db
      .select({
        subtotalSum: sql<number>`coalesce(sum(${orders.subtotal}), 0)`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(
        and(
          eq(orders.referralSchoolId, school.id),
          notInArray(orders.fulfilmentStatus, ["cancelled"]),
          notInArray(orders.paymentStatus, ["failed", "refunded"])
        )
      ),
  ]);

  const h = await headers();
  const host = h.get("host") ?? "";
  const proto = host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https";
  const referralUrl = `${proto}://${host}/s/${school.referralSlug}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(referralUrl)}`;
  const commissionEarned = commission.subtotalSum * school.commissionRate;

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">{school.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">Referral tools, orders and commission for your school.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Orders via your link</p>
          <p className="mt-2 text-2xl font-semibold text-neutral-900">{commission.orderCount}</p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">Commission earned</p>
          <p className="mt-2 text-2xl font-semibold text-indigo-700">{commissionEarned.toFixed(2)} EGP</p>
          <p className="mt-1 text-xs text-indigo-500">
            {(school.commissionRate * 100).toFixed(1)}% of order subtotal
            {school.commissionActiveUntil ? ` · active until ${school.commissionActiveUntil}` : ""}
          </p>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Your referral link</h2>
        <div className="mt-3 flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="Referral QR code"
            width={140}
            height={140}
            className="rounded-lg border border-neutral-200"
          />
          <div className="min-w-0">
            <p className="break-all rounded-md bg-neutral-50 px-3 py-2 text-sm text-neutral-700">{referralUrl}</p>
            <p className="mt-2 text-xs text-neutral-500">
              Share this link or the QR code with parents. Orders placed through it are tracked automatically for
              your commission.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold text-neutral-900">Live kits</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">Grade</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {liveKits.map((k) => (
                <tr key={k.kitId}>
                  <td className="px-4 py-2 font-medium text-neutral-900">{k.gradeLabel}</td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/s/${school.referralSlug}/${k.gradeId}`}
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
              {liveKits.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-sm text-neutral-400">
                    No kits published yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
