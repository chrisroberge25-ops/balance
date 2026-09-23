import Link from "next/link";
import { ArrowRight, CalendarCheck, PieChart, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { PRO_PRICE_LABEL } from "@/lib/defaults";

const categories = [
  { name: "Work", goal: "30%", detail: "Job, side hustle, music, business, education", color: "#1f7a62", keys: "W:J W:S W:M W:B W:E" },
  { name: "Life", goal: "30%", detail: "Family, social, personal, other, child", color: "#e15a2a", keys: "L:F L:S L:P L:O L:C" },
  { name: "Sleep", goal: "30%", detail: "Sleep and naps", color: "#6d4ea3", keys: "S:S S:N" },
  { name: "Health", goal: "10%", detail: "Mental, physical, eating, other, extra", color: "#2b6cb0", keys: "H:M H:P H:E H:O X:X" },
];

const faqs = [
  {
    q: "How is this different from a timer?",
    a: "Balance starts from the day you already lived. Calendar events carry a key, hours land in Work, Life, Sleep, or Health, and the hours you never labeled show up as untracked instead of disappearing.",
  },
  {
    q: "What is a calendar key?",
    a: "A short code in the event title, like W:J for job or L:F for family. A second key (L:F + H:P) is kept as context. The hours count once, toward the first key.",
  },
  {
    q: "Can I bring the spreadsheet?",
    a: "Yes. Import the Entry Log sheet from the life-balance workbook, or download the sample file and re-import it. Rows without a key are saved and listed in the error log so nothing is dropped silently.",
  },
  {
    q: "Does Google Calendar connect for real?",
    a: "The OAuth consent URL is wired up. Until you add Google credentials, use paste-sync: one line per event, keys and all. The docs inside the app show the exact env vars and scopes.",
  },
];

export default function HomePage() {
  return (
    <div className="hero-wash min-h-screen text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Logo />
        <nav className="flex items-center gap-2 text-sm">
          <a href="#product" className="hidden rounded-full px-3 py-2 hover:bg-white/60 sm:inline">
            Product
          </a>
          <a href="#pricing" className="hidden rounded-full px-3 py-2 hover:bg-white/60 sm:inline">
            Pricing
          </a>
          <Link href="/login" className="rounded-full px-3 py-2 hover:bg-white/60">
            Log in
          </Link>
          <Link href="/signup" className="rounded-full bg-ink px-4 py-2 text-cream">
            Start free
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent-ink">Life balance, without the spreadsheet</p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              Know where your time goes.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-muted">
              Calendar sync, category goals, daily check-ins, and insights. Balance turns a personal time tracker into something you can actually live in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-sm font-medium text-white">
                Create your workspace <ArrowRight size={16} />
              </Link>
              <Link href="/login" className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-5 py-3 text-sm font-medium">
                Open the demo
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">Demo login demo@balance.app · password balance-demo</p>
          </div>
          <Preview />
        </section>

        <section id="product" className="mx-auto max-w-6xl px-5 py-8">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: CalendarCheck, title: "Keys, not another timer", body: "Tag an event W:J or L:S. Balance files the hours and leaves a second label when one block is two things at once." },
              { icon: PieChart, title: "Goals that add up to a day", body: "Work 30, Life 30, Sleep 30, Health 10. Untracked time is honest: the rest of a past day, the hours since midnight today, and nothing tomorrow." },
              { icon: Sparkles, title: "A check-in after the hours", body: "Score motivation, sleep, work, life, and health from 1 to 10, then mark the habit list. Completion is the share of answered items." },
            ].map((item) => (
              <article key={item.title} className="rounded-3xl border border-line bg-paper p-6">
                <item.icon className="text-accent" size={20} />
                <h2 className="mt-4 font-serif text-2xl tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl tracking-tight">Four parts of a day.</h2>
          <p className="mt-3 max-w-2xl text-muted">The defaults come from the life-balance workbook. Rename them, change the keys, and the charts follow. Nothing is hard-wired to a cell.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {categories.map((category) => (
              <article key={category.name} className="rounded-3xl border border-line bg-paper p-5">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-2xl">{category.name}</h3>
                  <span className="text-sm font-medium" style={{ color: category.color }}>{category.goal}</span>
                </div>
                <p className="mt-2 text-sm text-muted">{category.detail}</p>
                <p className="mt-3 font-mono text-xs tracking-wide text-ink/70">{category.keys}</p>
                <div className="mt-4 h-2 rounded-full bg-sand">
                  <div className="h-2 rounded-full" style={{ width: category.goal, background: category.color }} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-5 py-8">
          <h2 className="font-serif text-4xl tracking-tight">Start free. Upgrade when the year fills up.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-line bg-paper p-6">
              <p className="text-sm text-muted">Free</p>
              <p className="mt-2 font-serif text-4xl">$0</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                <li>Day, month, and year views</li>
                <li>Check-ins, habits, and insights</li>
                <li>Spreadsheet import plus CSV and XLSX export</li>
                <li>200 entries each month</li>
              </ul>
              <Link href="/signup" className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm text-cream">Start free</Link>
            </article>
            <article className="rounded-3xl border border-ink bg-ink p-6 text-cream">
              <p className="text-sm text-cream/70">Pro</p>
              <p className="mt-2 font-serif text-4xl">{PRO_PRICE_LABEL}<span className="text-lg text-cream/70"> / month</span></p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-cream/75">
                <li>Unlimited entries</li>
                <li>Google Calendar connection</li>
                <li>Custom keys beyond the defaults</li>
                <li>The same export, without the monthly cap</li>
              </ul>
              <p className="mt-4 text-xs text-cream/50">Checkout is a Stripe stub in this build. You will not be charged.</p>
              <Link href="/signup" className="mt-6 inline-flex rounded-full bg-accent px-4 py-2 text-sm text-white">Try Pro in the app</Link>
            </article>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-4xl tracking-tight">Questions worth answering first.</h2>
          <div className="mt-6 divide-y divide-line rounded-3xl border border-line bg-paper">
            {faqs.map((item) => (
              <details key={item.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium">{item.q}</summary>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-10 text-sm text-muted">
        <Logo />
        <div className="flex gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/login">Log in</Link>
        </div>
      </footer>
    </div>
  );
}

function Preview() {
  const rows = [
    { name: "Work", hours: "8.0h", width: "33%", color: "#1f7a62" },
    { name: "Life", hours: "4.5h", width: "19%", color: "#e15a2a" },
    { name: "Sleep", hours: "7.25h", width: "30%", color: "#6d4ea3" },
    { name: "Health", hours: "2.5h", width: "10%", color: "#2b6cb0" },
  ];
  return (
    <div className="rounded-[2rem] border border-line bg-paper p-5 shadow-[0_30px_80px_-40px_rgba(28,25,22,0.45)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Tuesday</p>
          <p className="font-serif text-2xl">A day with a shape</p>
        </div>
        <p className="rounded-full bg-sand px-3 py-1 text-xs">Score 74</p>
      </div>
      <div className="mt-5 flex h-4 overflow-hidden rounded-full">
        <div className="h-full" style={{ width: "33%", background: "#1f7a62" }} />
        <div className="h-full" style={{ width: "19%", background: "#e15a2a" }} />
        <div className="h-full" style={{ width: "30%", background: "#6d4ea3" }} />
        <div className="h-full" style={{ width: "10%", background: "#2b6cb0" }} />
        <div className="h-full" style={{ width: "8%", background: "#b7ad9f" }} />
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <div key={row.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{row.name}</span>
              <span className="tabular-nums text-muted">{row.hours}</span>
            </div>
            <div className="h-1.5 rounded-full bg-sand">
              <div className="h-1.5 rounded-full" style={{ width: row.width, background: row.color }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 rounded-2xl bg-cream px-3 py-2 text-sm text-muted">Life is under its 30% goal. Family is logged. Social is the open hour.</p>
    </div>
  );
}
