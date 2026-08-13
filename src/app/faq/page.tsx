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
    <div className="min-h-screen bg-canvas">
      <SiteHeader customerName={customer?.name} />
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Frequently asked questions</h1>

        <div className="mt-8 space-y-8">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h2 className="text-xs font-medium tracking-wide text-ink-400 uppercase">{cat.name}</h2>
              <div className="mt-3 space-y-2">
                {(entriesByCategory.get(cat.id) ?? []).map((e) => (
                  <details key={e.id} className="group rounded-md border border-line bg-surface p-4">
                    <summary className="cursor-pointer text-sm font-medium text-ink-900">{e.question}</summary>
                    <p className="mt-2 text-sm text-ink-600">{e.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="rounded-md border border-dashed border-line bg-surface p-8 text-center text-sm text-ink-400">
              No FAQ entries yet.
            </p>
          )}
        </div>

        <div className="mt-10 rounded-md border border-line bg-surface p-5 text-sm text-ink-600">
          <p className="font-medium text-ink-900">Still need help?</p>
          <p className="mt-1">
            <Link href="/support" className="text-teal-700 hover:underline">
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
