import Link from "next/link";
import { requireCustomer } from "@/lib/customer-session";
import { logoutAction } from "@/lib/actions/customer-auth";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";

export default async function AccountDashboardLayout({ children }: { children: React.ReactNode }) {
  const customer = await requireCustomer();

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader customerName={customer.name} />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">My account</h1>
            <p className="text-sm text-neutral-500">{customer.email}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="text-sm text-neutral-500 hover:text-neutral-900">
              Sign out
            </button>
          </form>
        </div>
        <nav className="mb-8 flex gap-6 border-b border-neutral-200 text-sm font-medium text-neutral-600">
          <Link href="/account" className="pb-3 hover:text-neutral-900">
            Profile
          </Link>
          <Link href="/account/orders" className="pb-3 hover:text-neutral-900">
            Orders
          </Link>
          <Link href="/account/support" className="pb-3 hover:text-neutral-900">
            Support
          </Link>
        </nav>
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
