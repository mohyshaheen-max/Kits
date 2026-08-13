import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 px-6 py-8 text-center">
        <p className="text-sm font-semibold text-neutral-900">KITS</p>
        <p className="text-xs text-neutral-400">School supply kits, from list to doorstep.</p>
        <div className="mt-2 flex items-center gap-4 text-xs text-neutral-400">
          <Link href="/faq" className="hover:text-neutral-600 hover:underline">
            FAQ
          </Link>
          <Link href="/support" className="hover:text-neutral-600 hover:underline">
            Help
          </Link>
          <Link href="/admin/login" className="hover:text-neutral-600 hover:underline">
            Staff sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
