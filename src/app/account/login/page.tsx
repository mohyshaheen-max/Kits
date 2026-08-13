import Link from "next/link";
import LoginForm from "./login-form";

export default function AccountLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-surface p-8">
        <h1 className="font-display text-lg font-semibold text-ink-900">Sign in</h1>
        <p className="mt-1 text-sm text-ink-600">Access your saved children, addresses and order history.</p>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-ink-600">
          New here?{" "}
          <Link href="/account/register" className="font-medium text-teal-700 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
