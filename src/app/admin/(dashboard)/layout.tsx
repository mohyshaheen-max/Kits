import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { logoutAction } from "@/lib/actions/auth";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/schools", label: "Schools" },
  { href: "/admin/skus", label: "SKU catalogue" },
  { href: "/admin/kits", label: "Kits" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/returns", label: "Returns" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/pick-lists", label: "Pick lists" },
  { href: "/admin/delivery-run", label: "Delivery run" },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex">
        <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-line bg-surface">
          <div className="border-b border-line px-4 py-4">
            <span className="font-display text-sm font-bold tracking-tight text-ink-900">KiTS Admin</span>
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
            <p className="truncate text-xs text-ink-400">{admin.email}</p>
            <form action={logoutAction}>
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
