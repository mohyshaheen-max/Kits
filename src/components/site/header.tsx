import Link from "next/link";
import Image from "next/image";

export default function SiteHeader({ customerName }: { customerName?: string | null }) {
  return (
    <header
      className="sticky top-0 z-10 text-white"
      style={{ background: "linear-gradient(120deg, var(--teal-900) 42%, var(--teal-500) 58%)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-mark.png" alt="KiTS" width={128} height={62} className="h-7 w-auto" priority />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:opacity-80">
            Schools
          </Link>
          <Link href="/store" className="hover:opacity-80">
            Store
          </Link>
          <Link href="/faq" className="hover:opacity-80">
            Help
          </Link>
          {customerName ? (
            <Link href="/account" className="hover:opacity-80">
              {customerName.split(" ")[0]} · My account
            </Link>
          ) : (
            <Link href="/account/login" className="hover:opacity-80">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
