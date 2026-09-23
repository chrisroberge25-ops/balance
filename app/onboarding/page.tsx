import { completeOnboarding } from "@/app/actions/auth";
import { Logo } from "@/components/logo";
import { Button, Field, inputClass, Notice } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";
import { TIMEZONES } from "@/lib/dates";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up" };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await ensureDatabase();
  const user = await requireUser();
  if (user.onboarded) redirect("/app");
  const params = await searchParams;
  const year = new Date().getFullYear();

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <Logo />
      <h1 className="mt-8 font-serif text-4xl tracking-tight">Set the shape of a day.</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Defaults match the workbook: Work 30%, Life 30%, Sleep 30%, Health 10%, with keys like W:J and L:F. You can edit every label after this.
      </p>
      {params.error ? <div className="mt-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      <form action={completeOnboarding} className="mt-6 space-y-4">
        <Field label="Name">
          <input className={inputClass} name="name" defaultValue={user.name} required />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Timezone">
            <select className={inputClass} name="timezone" defaultValue="America/New_York">
              {TIMEZONES.map((zone) => (
                <option key={zone}>{zone}</option>
              ))}
            </select>
          </Field>
          <Field label="Tracking year">
            <input className={inputClass} name="year" type="number" min={2000} max={2100} defaultValue={year} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["work", "Work", 30],
            ["life", "Life", 30],
            ["sleep", "Sleep", 30],
            ["health", "Health", 10],
          ].map(([name, label, value]) => (
            <Field key={String(name)} label={String(label)}>
              <input className={inputClass} name={String(name)} type="number" min={0} max={100} step={1} defaultValue={Number(value)} />
            </Field>
          ))}
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="workbook" defaultChecked className="mt-1" />
          <span>Import the workbook Entry Log (2025 calendar rows). Events without a key stay in the log and the error list.</span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="rhythm" defaultChecked className="mt-1" />
          <span>Add two weeks of example days, check-ins, and habits so the dashboard is readable today.</span>
        </label>
        <Button type="submit">Open my dashboard</Button>
      </form>
    </div>
  );
}
