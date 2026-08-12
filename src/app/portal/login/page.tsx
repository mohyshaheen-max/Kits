import LoginForm from "./login-form";

export default function PortalLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
        <h1 className="text-lg font-semibold text-neutral-900">KITS School Portal</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to see your referral tools, orders and commission.</p>
        <LoginForm />
      </div>
    </div>
  );
}
