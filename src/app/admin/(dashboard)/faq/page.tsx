import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { faqCategories, faqEntries } from "@/db/schema";
import {
  createFaqCategoryAction,
  deleteFaqCategoryAction,
  createFaqEntryAction,
  deleteFaqEntryAction,
} from "@/lib/actions/faq";
import { inputClass } from "@/components/admin/form-controls";

export default async function AdminFaqPage() {
  const db = getDb();
  const [categories, entries] = await Promise.all([
    db.select().from(faqCategories).orderBy(asc(faqCategories.sortOrder)),
    db.select().from(faqEntries).orderBy(asc(faqEntries.sortOrder)),
  ]);
  const entriesByCategory = new Map<number, typeof entries>();
  for (const e of entries) {
    if (!entriesByCategory.has(e.categoryId)) entriesByCategory.set(e.categoryId, []);
    entriesByCategory.get(e.categoryId)!.push(e);
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">FAQ</h1>
        <p className="mt-1 text-sm text-ink-400">Shown to everyone at /faq.</p>
      </div>

      <form action={createFaqCategoryAction} className="flex items-end gap-2">
        <div className="flex-1">
          <label className="block text-xs text-ink-400">New category</label>
          <input name="name" required placeholder="Orders & delivery" className={inputClass} />
        </div>
        <button
          type="submit"
          className="h-[38px] rounded-md bg-teal-600 px-3 text-sm font-medium text-white hover:bg-teal-700"
        >
          Add category
        </button>
      </form>

      {categories.map((cat) => (
        <section key={cat.id} className="rounded-md border border-line bg-surface">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-semibold text-ink-900">{cat.name}</h2>
            <form action={deleteFaqCategoryAction}>
              <input type="hidden" name="id" value={cat.id} />
              <button type="submit" className="text-xs text-ink-400 hover:text-error">
                Remove category
              </button>
            </form>
          </div>
          <ul className="divide-y divide-line-2">
            {(entriesByCategory.get(cat.id) ?? []).map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-ink-900">{e.question}</p>
                  <p className="mt-1 text-ink-400">{e.answer}</p>
                </div>
                <form action={deleteFaqEntryAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="shrink-0 text-xs text-ink-400 hover:text-error">
                    Remove
                  </button>
                </form>
              </li>
            ))}
            {(entriesByCategory.get(cat.id) ?? []).length === 0 && (
              <li className="px-4 py-3 text-sm text-ink-400">No questions yet.</li>
            )}
          </ul>
          <form action={createFaqEntryAction} className="space-y-2 border-t border-line p-3">
            <input type="hidden" name="category_id" value={cat.id} />
            <input name="question" required placeholder="Question" className={inputClass} />
            <textarea name="answer" required rows={2} placeholder="Answer" className={inputClass} />
            <button
              type="submit"
              className="rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              Add question
            </button>
          </form>
        </section>
      ))}
      {categories.length === 0 && <p className="text-sm text-ink-400">No categories yet.</p>}
    </div>
  );
}
