import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-2xl px-5 py-12">
      <Link href="/"><Logo /></Link>
      <h1 className="mt-8 font-serif text-4xl">Terms</h1>
      <div className="mt-4 space-y-4 text-sm leading-7 text-muted">
        <p>Balance is a personal time-tracking product. Category goals are yours to set. The default mix is 30% work, 30% life, 30% sleep, and 10% health.</p>
        <p>Free includes 200 entries per calendar month. Pro removes that cap. In this build, the upgrade button does not create a Stripe charge.</p>
        <p>You are responsible for the calendar titles you import. Hours are attributed to the first known key in a title. A second key is descriptive only.</p>
      </div>
    </article>
  );
}
