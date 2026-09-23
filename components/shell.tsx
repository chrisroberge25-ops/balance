import Link from "next/link";
import {
  CalendarClock,
  CalendarRange,
  CreditCard,
  LayoutDashboard,
  LineChart,
  ListTodo,
  LogOut,
  Settings,
  SunMedium,
  Upload,
  HeartPulse,
} from "lucide-react";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { setTrackingYear, logout } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/day", label: "Today", icon: SunMedium },
  { href: "/app/month", label: "Month", icon: CalendarRange },
  { href: "/app/entries", label: "Entries", icon: ListTodo },
  { href: "/app/check-in", label: "Check-in", icon: HeartPulse },
  { href: "/app/insights", label: "Insights", icon: LineChart },
  { href: "/app/import", label: "Import", icon: Upload },
  { href: "/app/calendar", label: "Calendar", icon: CalendarClock },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/billing", label: "Plan", icon: CreditCard },
];

export function Shell({
  user,
  path,
  children,
}: {
  user: { name: string; email: string; plan: string; trackingYear: number };
  path: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream text-ink lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden bg-ink text-cream lg:flex lg:flex-col lg:justify-between lg:px-4 lg:py-6">
        <div>
          <Link href="/app" className="px-2">
            <Logo light />
          </Link>
          <nav className="mt-8 space-y-1">
            {links.map((link) => {
              const active = path === link.href || (link.href !== "/app" && path.startsWith(link.href));
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-cream/75 hover:bg-white/5 hover:text-cream",
                    active && "bg-white/10 text-cream",
                  )}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <AccountBlock user={user} />
      </aside>
      <div>
        <MobileNav links={links.map((link) => ({ href: link.href, label: link.label }))} />
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function AccountBlock({ user }: { user: { name: string; email: string; plan: string; trackingYear: number } }) {
  const year = new Date().getFullYear();
  return (
    <div className="space-y-3 px-2 text-sm">
      <form action={setTrackingYear} className="flex items-center gap-2 text-cream/80">
        <label htmlFor="year" className="text-xs uppercase tracking-wider">
          Year
        </label>
        <select
          id="year"
          name="year"
          defaultValue={user.trackingYear}
          className="rounded-full bg-white/10 px-2 py-1 text-cream"
        >
          {[year - 1, year, year + 1].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <button className="rounded-full bg-white/10 px-2 py-1 text-xs">Set</button>
      </form>
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="truncate text-xs text-cream/60">{user.email}</p>
        <p className="mt-1 text-xs uppercase tracking-wider text-accent">{user.plan === "PRO" ? "Pro" : "Free"}</p>
      </div>
      <form action={logout}>
        <button className="inline-flex items-center gap-2 text-xs text-cream/70 hover:text-cream">
          <LogOut size={14} />
          Log out
        </button>
      </form>
    </div>
  );
}
