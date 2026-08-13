"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/customer-auth";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-ink-600">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-1 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-ink-600">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 w-full rounded-sm border border-line px-3 py-2 text-sm focus:outline-2 focus:outline-offset-1 focus:outline-teal-500"
        />
      </div>
      {state?.error && (
        <p className="rounded-sm border border-error bg-error-bg px-3 py-2 text-sm text-error">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="cut-tr w-full rounded-md bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
