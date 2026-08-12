import Link from "next/link";
import { eq, asc } from "drizzle-orm";
import { getDb } from "@/db";
import { schools } from "@/db/schema";

// Queries D1 on every request — must not be statically prerendered at
// build time, when no Cloudflare request context exists yet.
export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();
  const activeSchools = await db
    .select()
    .from(schools)
    .where(eq(schools.status, "active"))
    .orderBy(asc(schools.name));

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm font-medium text-neutral-500">KITS</p>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">School supply kits, ready to order.</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Find your school below to see this year&apos;s kit for your child&apos;s grade, priced and ready to go.
      </p>

      <div className="mt-8 space-y-2">
        {activeSchools.map((s) => (
          <Link
            key={s.id}
            href={`/s/${s.referralSlug}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-5 py-4 hover:border-neutral-400"
          >
            <div>
              <p className="font-medium text-neutral-900">{s.name}</p>
              {s.district && <p className="text-xs text-neutral-400">{s.district}</p>}
            </div>
            <span className="text-sm text-neutral-400">→</span>
          </Link>
        ))}
        {activeSchools.length === 0 && (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-400">
            No schools published yet.
          </p>
        )}
      </div>

      <Link
        href="/store"
        className="mt-4 flex items-center justify-between rounded-lg border border-dashed border-neutral-300 bg-white px-5 py-4 hover:border-neutral-400"
      >
        <div>
          <p className="font-medium text-neutral-900">General Store</p>
          <p className="text-xs text-neutral-400">Buy individual items — no school kit required</p>
        </div>
        <span className="text-sm text-neutral-400">→</span>
      </Link>

      <p className="mt-10 text-center text-xs text-neutral-400">
        <Link href="/admin/login" className="hover:text-neutral-600 hover:underline">
          Staff sign in
        </Link>
      </p>
    </div>
  );
}
