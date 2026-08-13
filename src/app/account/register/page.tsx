import Link from "next/link";
import RegisterForm from "./register-form";

export default function AccountRegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-surface p-8">
        <h1 className="font-display text-lg font-semibold text-ink-900">Create an account</h1>
        <p className="mt-1 text-sm text-ink-600">Save children and addresses, and track your orders.</p>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-ink-600">
          Already have an account?{" "}
          <Link href="/account/login" className="font-medium text-teal-700 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
