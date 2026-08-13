import Link from "next/link";

export default function SiteHeader({ customerName }: { customerName?: string | null }) {
  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            K
          </span>
          <span className="text-lg font-semibold tracking-tight text-neutral-900">KITS</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium text-neutral-600">
          <Link href="/" className="hover:text-neutral-900">
            Schools
          </Link>
          <Link href="/store" className="hover:text-neutral-900">
            Store
          </Link>
          {customerName ? (
            <Link href="/account" className="hover:text-neutral-900">
              {customerName.split(" ")[0]} · My account
            </Link>
          ) : (
            <Link href="/account/login" className="hover:text-neutral-900">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
