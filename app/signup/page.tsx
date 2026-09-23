import Link from "next/link";
import { signup } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { Button, Field, inputClass, Notice } from "@/components/ui";
import { ensureDatabase } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create account" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await ensureDatabase();
  const params = await searchParams;
  return (
    <AuthShell title="Start a workspace." subtitle="You’ll set goals next, then land in a dashboard seeded with the workbook’s categories.">
      {params.error ? <Notice tone="warn">{params.error}</Notice> : null}
      <form action={signup} className="mt-4 space-y-3">
        <Field label="Name">
          <input className={inputClass} name="name" required placeholder="Your name" />
        </Field>
        <Field label="Email">
          <input className={inputClass} name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" hint="At least 8 characters.">
          <input className={inputClass} name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Button type="submit" className="w-full">Create account</Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already tracking? <Link className="font-medium text-ink underline" href="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
