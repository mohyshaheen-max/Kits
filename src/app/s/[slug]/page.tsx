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
    <div className="min-h-screen bg-canvas">
      <SiteHeader customerName={customer?.name} />

      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-sm font-medium text-teal-700">{school.name}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink-900">Pick your child&apos;s grade</h1>
        <p className="mt-2 text-sm text-ink-600">
          Each kit is itemised and priced from {school.name}&apos;s actual supply list for this year.
        </p>

        <div className="mt-8 space-y-2">
          {liveKits.map((k) => (
            <Link
              key={k.kitId}
              href={`/s/${slug}/${k.gradeId}`}
              className="group flex items-center justify-between rounded-md border border-line bg-surface px-5 py-4 transition hover:border-teal-400"
            >
              <div>
                <p className="font-medium text-ink-900">{k.gradeLabel}</p>
                <p className="text-xs text-ink-400">{k.academicYear}</p>
              </div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium text-teal-700">
                  from {k.basePrice.toFixed(0)} EGP
                </p>
                <span className="text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700">
                  →
                </span>
              </div>
            </Link>
          ))}
          {liveKits.length === 0 && (
            <p className="rounded-md border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-400">
              No kits are published for {school.name} yet — check back soon.
            </p>
          )}
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}
