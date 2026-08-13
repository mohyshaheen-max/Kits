import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center">
        <p className="font-display text-sm font-bold text-ink-900">KiTS</p>
        <p className="text-xs text-ink-400">Standardized supply fulfillment system.</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-teal-700">
          <Link href="/faq" className="hover:underline">
            FAQ
          </Link>
          <Link href="/support" className="hover:underline">
            Help
          </Link>
          <Link href="/admin/login" className="text-ink-400 hover:text-teal-700 hover:underline">
            Staff sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
