import Link from "next/link";
import LoginForm from "./login-form";

export default function AccountLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">Sign in</h1>
        <p className="mt-1 text-sm text-neutral-500">Access your saved children, addresses and order history.</p>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-neutral-500">
          New here?{" "}
          <Link href="/account/register" className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
