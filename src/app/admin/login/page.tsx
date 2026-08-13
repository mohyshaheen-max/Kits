import Image from "next/image";
import LoginForm from "./login-form";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-surface p-8">
        <Image src="/logo-mark-teal.png" alt="KiTS" width={128} height={62} className="h-8 w-auto" priority />
        <p className="mt-3 text-sm font-medium text-ink-900">Admin</p>
        <p className="mt-1 text-sm text-ink-400">Sign in to manage schools, lists and kits.</p>
        <LoginForm />
      </div>
    </div>
  );
}
