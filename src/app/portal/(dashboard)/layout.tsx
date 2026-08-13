import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { schools } from "@/db/schema";
import { requireSchoolPortal } from "@/lib/school-session";
import { schoolLogoutAction } from "@/lib/actions/school-auth";

const NAV = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/orders", label: "Orders" },
  { href: "/portal/request", label: "Request list update" },
];

export default async function PortalDashboardLayout({ children }: { children: React.ReactNode }) {
  const schoolAdmin = await requireSchoolPortal();
  const db = getDb();
  const [school] = await db.select().from(schools).where(eq(schools.id, schoolAdmin.schoolId)).limit(1);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex">
        <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-surface">
          <div className="border-b border-line px-4 py-4">
            <span className="font-display text-sm font-bold tracking-tight text-ink-900">KiTS Portal</span>
            {school && <p className="mt-0.5 truncate text-xs text-ink-400">{school.name}</p>}
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-sm px-3 py-2 text-sm font-medium text-ink-600 hover:bg-teal-050 hover:text-teal-800"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-line px-4 py-3">
            <p className="truncate text-xs text-ink-400">{schoolAdmin.email}</p>
            <form action={schoolLogoutAction}>
              <button type="submit" className="mt-1 text-xs font-medium text-ink-400 hover:text-ink-900">
                Sign out
              </button>
            </form>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
