import Link from "next/link";
import { Logo } from "./logo";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden bg-ink px-10 py-10 text-cream lg:flex lg:flex-col lg:justify-between">
        <Link href="/">
          <Logo light />
        </Link>
        <div>
          <p className="font-serif text-4xl leading-tight">The day is 24 hours. The rest is a choice.</p>
          <p className="mt-4 max-w-sm text-sm leading-6 text-cream/70">
            Work, life, sleep, and health, measured against the goals you actually set — including the hours you have not named yet.
          </p>
        </div>
        <p className="text-xs text-cream/50">Balance</p>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex lg:hidden">
            <Logo />
          </Link>
          <h1 className="font-serif text-4xl tracking-tight">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
