import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/"><Logo /></Link>
      <h1 className="mt-8 font-serif text-4xl">Privacy</h1>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
        <p>Balance stores your account, time entries, check-ins, and habits in the database you configure. The demo login is a shared sample workspace on this deployment.</p>
        <p>Spreadsheet import reads the file you upload and keeps titles, times, and a shortened note. It does not send that file to another service.</p>
        <p>Google Calendar OAuth is stubbed. If you add credentials later, the consent screen is Google’s. This build does not exchange authorization codes for tokens.</p>
        <p>Stripe checkout is stubbed. Upgrading stores a fake customer id and does not collect a card.</p>
      </div>
    </article>
  );
}
