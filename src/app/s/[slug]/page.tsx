import { notFound } from "next/navigation";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, grades, kits } from "@/db/schema";

export default async function SchoolLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const db = getDb();
  const [school] = await db.select().from(schools).where(eq(schools.referralSlug, slug)).limit(1);
  if (!school || school.status !== "active") notFound();

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
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-medium text-neutral-500">KITS</p>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{school.name}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Pick your child&apos;s grade to see this year&apos;s kit, priced and ready to order.
      </p>

      <div className="mt-8 space-y-2">
        {liveKits.map((k) => (
          <Link
            key={k.kitId}
            href={`/s/${slug}/${k.gradeId}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-400"
          >
            <div>
              <p className="font-medium text-neutral-900">{k.gradeLabel}</p>
              <p className="text-xs text-neutral-400">{k.academicYear}</p>
            </div>
            <p className="text-sm font-semibold text-neutral-900">from {k.basePrice.toFixed(0)} EGP</p>
          </Link>
        ))}
        {liveKits.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-400">
            No kits are published for {school.name} yet — check back soon.
          </p>
        )}
      </div>
    </div>
  );
}
