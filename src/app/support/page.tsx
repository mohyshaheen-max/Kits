import { getCurrentCustomer } from "@/lib/customer-session";
import SiteHeader from "@/components/site/header";
import SiteFooter from "@/components/site/footer";
import TicketForm from "./ticket-form";

export const dynamic = "force-dynamic";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const customer = await getCurrentCustomer();

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader customerName={customer?.name} />
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-neutral-900">Contact support</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Tell us what&apos;s going on and we&apos;ll get back to you. Check the{" "}
          <a href="/faq" className="text-indigo-600 hover:underline">
            FAQ
          </a>{" "}
          first — your answer might already be there.
        </p>

        <TicketForm
          loggedIn={!!customer}
          defaultName={customer?.name ?? ""}
          defaultEmail={customer?.email ?? ""}
          defaultOrderNumber={order ?? ""}
        />

        <div className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-600 shadow-sm">
          <p className="font-medium text-neutral-900">Other ways to reach us</p>
          <p className="mt-2">Email: support@kits.example</p>
          <p>WhatsApp: +20 100 000 0000</p>
          <p>Hours: Sunday–Thursday, 9am–5pm</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
