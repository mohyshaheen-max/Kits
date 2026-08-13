import Link from "next/link";
import RegisterForm from "./register-form";

export default function AccountRegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">Create an account</h1>
        <p className="mt-1 text-sm text-neutral-500">Save children and addresses, and track your orders.</p>
        <RegisterForm />
        <p className="mt-4 text-center text-sm text-neutral-500">
          Already have an account?{" "}
          <Link href="/account/login" className="font-medium text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
