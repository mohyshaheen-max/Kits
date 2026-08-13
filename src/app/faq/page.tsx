import Link from "next/link";
import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { faqCategories, faqEntries } from "@/db/schema";
import { getCurrentCustomer } from "@/lib/customer-session";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";

export const dynamic = "force-dynamic";

export default async function FaqPage() {
  const db = getDb();
  const [categories, entries, customer] = await Promise.all([
    db.select().from(faqCategories).orderBy(asc(faqCategories.sortOrder)),
    db.select().from(faqEntries).orderBy(asc(faqEntries.sortOrder)),
    getCurrentCustomer(),
  ]);
  const entriesByCategory = new Map<number, typeof entries>();
  for (const e of entries) {
    if (!entriesByCategory.has(e.categoryId)) entriesByCategory.set(e.categoryId, []);
    entriesByCategory.get(e.categoryId)!.push(e);
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader customerName={customer?.name} />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-neutral-900">Frequently asked questions</h1>

        <div className="mt-8 space-y-8">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">{cat.name}</h2>
              <div className="mt-3 space-y-2">
                {(entriesByCategory.get(cat.id) ?? []).map((e) => (
                  <details key={e.id} className="group rounded-lg border border-neutral-200 bg-white p-4">
                    <summary className="cursor-pointer text-sm font-medium text-neutral-900">{e.question}</summary>
                    <p className="mt-2 text-sm text-neutral-600">{e.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-400">
              No FAQ entries yet.
            </p>
          )}
        </div>

        <div className="mt-10 rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">
          <p className="font-medium text-neutral-900">Still need help?</p>
          <p className="mt-1">
            <Link href="/support" className="text-indigo-600 hover:underline">
              Contact support
            </Link>{" "}
            or email support@kits.example.
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
