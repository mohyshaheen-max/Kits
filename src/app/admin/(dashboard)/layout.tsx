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
  { href: "/admin/pick-lists", label: "Pick lists" },
  { href: "/admin/delivery-run", label: "Delivery run" },
];

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="flex">
        <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-4 py-4">
            <span className="text-sm font-semibold tracking-tight text-neutral-900">KITS Admin</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-md px-3 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-neutral-200 px-4 py-3">
            <p className="truncate text-xs text-neutral-500">{admin.email}</p>
            <form action={logoutAction}>
              <button type="submit" className="mt-1 text-xs font-medium text-neutral-500 hover:text-neutral-900">
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
