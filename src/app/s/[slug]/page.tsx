import { notFound } from "next/navigation";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, kits } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/customer-session";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";

export default async function SchoolLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const db = getDb();
  const [school] = await db.select().from(schools).where(eq(schools.referralSlug, slug)).limit(1);
  if (!school || school.status !== "active") notFound();

  const customer = await getCurrentCustomer();

  const liveKits = await db
    .select({
      kitId: kits.id,
      gradeId: kits.gradeId,
      gradeLabel: grades.label,
      sortOrder: grades.sortOrder,
      basePrice: kits.basePrice,
      academicYear: kits.academicYear,
    })
    .from(kits)
    .innerJoin(grades, eq(kits.gradeId, grades.id))
    .where(and(eq(kits.schoolId, school.id), eq(kits.status, "live")))
    .orderBy(asc(grades.sortOrder));

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader customerName={customer?.name} />

      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm font-medium text-indigo-600">{school.name}</p>
        <h1 className="mt-1 text-2xl font-semibold text-neutral-900">Pick your child&apos;s grade</h1>
        <p className="mt-2 text-sm text-neutral-500">
          Each kit is itemised and priced from {school.name}&apos;s actual supply list for this year.
        </p>

        <div className="mt-8 space-y-2">
          {liveKits.map((k) => (
            <Link
              key={k.kitId}
              href={`/s/${slug}/${k.gradeId}`}
              className="group flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <p className="font-semibold text-neutral-900">{k.gradeLabel}</p>
                <p className="text-xs text-neutral-400">{k.academicYear}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-indigo-600">from {k.basePrice.toFixed(0)} EGP</p>
                <span className="text-neutral-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-600">
                  →
                </span>
              </div>
            </Link>
          ))}
          {liveKits.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
              No kits are published for {school.name} yet — check back soon.
            </p>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
