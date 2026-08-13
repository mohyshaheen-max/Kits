import LoginForm from "./login-form";

export default function PortalLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-sm rounded-md border border-line bg-surface p-8">
        <h1 className="font-display text-lg font-semibold text-ink-900">KiTS School Portal</h1>
        <p className="mt-1 text-sm text-ink-400">Sign in to see your referral tools, orders and commission.</p>
        <LoginForm />
      </div>
    </div>
  );
}
