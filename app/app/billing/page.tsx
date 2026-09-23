import { downgradePlan } from "@/app/actions/billing";
import { Card, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { PRO_PRICE_LABEL } from "@/lib/defaults";

export const metadata = { title: "Plan" };

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; error?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

  return (
    <div>
      <PageHeader
        eyebrow="Free and Pro"
        title={user.plan === "PRO" ? "You’re on Pro." : "You’re on Free."}
        description="Free covers a real tracking practice. Pro removes the 200-entry month cap and turns on the Google Calendar connection."
      />
      {params.error ? <div className="mb-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      {params.status === "upgraded" ? <div className="mb-4"><Notice tone="good">Pro is on. No card was charged — checkout is stubbed.</Notice></div> : null}
      {params.status === "free" ? <div className="mb-4"><Notice>You’re back on Free.</Notice></div> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={user.plan === "FREE" ? "ring-2 ring-ink" : ""}>
          <p className="text-sm text-muted">Free</p>
          <p className="mt-2 font-serif text-4xl">$0</p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
            <li>Day, month, and year</li>
            <li>Check-ins and insights</li>
            <li>XLSX import, CSV and XLSX export</li>
            <li>200 entries per month</li>
          </ul>
          {user.plan === "PRO" ? (
            <form action={downgradePlan} className="mt-6">
              <button className="rounded-full border border-line px-4 py-2 text-sm">Move to Free</button>
            </form>
          ) : <p className="mt-6 text-sm font-medium">Current plan</p>}
        </Card>
        <Card className={user.plan === "PRO" ? "ring-2 ring-accent" : ""}>
          <p className="text-sm text-muted">Pro</p>
          <p className="mt-2 font-serif text-4xl">{PRO_PRICE_LABEL}<span className="text-lg text-muted"> / month</span></p>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
            <li>Unlimited entries</li>
            <li>Google Calendar OAuth</li>
            <li>Room for a longer set of custom keys</li>
          </ul>
          <p className="mt-4 text-xs text-muted">
            {stripeConfigured
              ? "A Stripe secret is set, and this build still simulates checkout instead of creating a live charge."
              : "Stripe keys are not set. Upgrade runs a local stub and stores a fake customer id."}
          </p>
          {user.plan === "PRO" ? (
            <p className="mt-6 text-sm font-medium">Current plan</p>
          ) : (
            <form action="/api/billing/checkout" method="post" className="mt-6">
              <button className="rounded-full bg-accent px-4 py-2 text-sm text-white">Upgrade with Stripe stub</button>
            </form>
          )}
          {user.stripeCustomerId ? <p className="mt-3 text-xs text-muted">Customer {user.stripeCustomerId}</p> : null}
        </Card>
      </div>
    </div>
  );
}
