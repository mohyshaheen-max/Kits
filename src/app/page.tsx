import Link from "next/link";
import { eq, asc, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { schools, kits } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/customer-session";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";

// Queries D1 on every request — must not be statically prerendered at
// build time, when no Cloudflare request context exists yet.
export const dynamic = "force-dynamic";

const TIER_STYLE: Record<string, string> = {
  A: "bg-teal-100 text-teal-800",
  B: "bg-canvas text-ink-600",
  C: "bg-canvas text-ink-600",
};

export default async function Home() {
  const db = getDb();
  const [activeSchools, kitCounts, customer] = await Promise.all([
    db.select().from(schools).where(eq(schools.status, "active")).orderBy(asc(schools.name)),
    db
      .select({ schoolId: kits.schoolId, n: sql<number>`count(*)` })
      .from(kits)
      .where(eq(kits.status, "live"))
      .groupBy(kits.schoolId),
    getCurrentCustomer(),
  ]);
  const kitCountBySchool = Object.fromEntries(kitCounts.map((k) => [k.schoolId, k.n]));

  return (
    <div className="min-h-screen bg-canvas">
      <SiteHeader customerName={customer?.name} />

      <section className="bg-surface px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl">
            School supplies, sorted.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-600">
            Pick your child&apos;s school and grade to get this year&apos;s exact supply kit — priced, itemised, and
            delivered to your door or straight to school.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <a
              href="#schools"
              className="cut-tr rounded-md bg-teal-600 px-6 py-3 text-sm font-medium text-white hover:bg-teal-700"
            >
              Find your school
            </a>
            <Link
              href="/store"
              className="rounded-md border border-teal-700 px-6 py-3 text-sm font-medium text-teal-700 hover:bg-teal-050"
            >
              Browse the store
            </Link>
          </div>
        </div>
      </section>

      <section id="schools" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-xl font-semibold text-ink-900">Find your school</h2>
        <p className="mt-1 text-sm text-ink-400">Every kit is priced from the school&apos;s actual supply list.</p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeSchools.map((s) => (
            <Link
              key={s.id}
              href={`/s/${s.referralSlug}`}
              className="group flex items-center justify-between rounded-md border border-line bg-surface p-5 transition hover:border-teal-400"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink-900">{s.name}</p>
                  <span className={`rounded-sm px-2 py-0.5 text-xs font-medium ${TIER_STYLE[s.tier]}`}>
                    Tier {s.tier}
                  </span>
                </div>
                {s.district && <p className="mt-0.5 text-sm text-ink-600">{s.district}</p>}
                <p className="mt-2 text-xs text-ink-400">
                  {kitCountBySchool[s.id] ?? 0} kit{(kitCountBySchool[s.id] ?? 0) === 1 ? "" : "s"} available
                </p>
              </div>
              <span className="text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700">→</span>
            </Link>
          ))}
          {activeSchools.length === 0 && (
            <p className="col-span-full rounded-md border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-400">
              No schools published yet.
            </p>
          )}
        </div>

        <Link
          href="/store"
          className="group mt-4 flex items-center justify-between rounded-md border border-dashed border-line bg-surface p-5 transition hover:border-teal-400"
        >
          <div>
            <p className="font-medium text-ink-900">General Store</p>
            <p className="mt-0.5 text-sm text-ink-600">Buy individual items — no school kit required</p>
          </div>
          <span className="text-ink-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700">→</span>
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
