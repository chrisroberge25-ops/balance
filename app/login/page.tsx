import Link from "next/link";
import { login } from "@/app/actions/auth";
import { AuthShell } from "@/components/auth-shell";
import { Button, Field, inputClass, Notice } from "@/components/ui";
import { ensureDatabase, DEMO_LOGIN } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";
export const metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  await ensureDatabase();
  const params = await searchParams;
  return (
    <AuthShell
      title="Welcome back."
      subtitle="The demo workspace already has the workbook’s entry log and two weeks of a lived-in rhythm."
    >
      {params.error ? <Notice tone="warn">{params.error}</Notice> : null}
      <form action={login} className="mt-4 space-y-3">
        <input type="hidden" name="next" value={params.next ?? ""} />
        <Field label="Email">
          <input className={inputClass} name="email" type="email" autoComplete="email" required defaultValue={DEMO_LOGIN.email} />
        </Field>
        <Field label="Password">
          <input className={inputClass} name="password" type="password" autoComplete="current-password" required defaultValue={DEMO_LOGIN.password} />
        </Field>
        <Button type="submit" className="w-full">Log in</Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        New here? <Link className="font-medium text-ink underline" href="/signup">Create an account</Link>
      </p>
    </AuthShell>
  );
}
