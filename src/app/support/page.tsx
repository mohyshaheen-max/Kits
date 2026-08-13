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
    <div className="min-h-screen bg-canvas">
      <SiteHeader customerName={customer?.name} />
      <div className="mx-auto max-w-xl px-6 py-16">
        <h1 className="font-display text-2xl font-semibold text-ink-900">Contact support</h1>
        <p className="mt-1 text-sm text-ink-600">
          Tell us what&apos;s going on and we&apos;ll get back to you. Check the{" "}
          <a href="/faq" className="text-teal-700 hover:underline">
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

        <div className="mt-8 rounded-md border border-line bg-surface p-5 text-sm text-ink-600">
          <p className="font-medium text-ink-900">Other ways to reach us</p>
          <p className="mt-2">Email: support@kits.example</p>
          <p>WhatsApp: +20 100 000 0000</p>
          <p>Hours: Sunday–Thursday, 9am–5pm</p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
