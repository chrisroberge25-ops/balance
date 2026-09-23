import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { GROUP_COLORS } from "@/lib/colors";
import {
  daysInMonth,
  formatMonth,
  hoursSinceMidnight,
  monthDates,
  parseIsoDate,
  weekdayIndex,
  zonedToday,
} from "@/lib/dates";
import { prisma } from "@/lib/db";
import { summarizeRange } from "@/lib/stats";
import { formatHours, formatSignedHours } from "@/lib/time-math";

export const metadata = { title: "Month" };

export default async function MonthPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = zonedToday(user.timezone);
  const intoToday = hoursSinceMidnight(user.timezone);
  const requested = params.month && /^\d{4}-\d{2}$/.test(params.month) ? `${params.month}-01` : today;
  const parsed = parseIsoDate(requested.slice(0, 8) + "01") ?? parseIsoDate(today.slice(0, 7) + "-01")!;
  const year = params.month ? parsed.year : params.view === "year" ? user.trackingYear : parsed.year;
  const month = parsed.month;
  const view = params.view === "year" ? "year" : "month";
  const [groups, subs, yearEntries] = await Promise.all([
    prisma.categoryGroup.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.subcategory.findMany({ where: { userId: user.id } }),
    prisma.timeEntry.findMany({
      where: { userId: user.id, date: { gte: `${view === "year" ? user.trackingYear : year}-01-01`, lte: `${view === "year" ? user.trackingYear : year}-12-31` } },
    }),
  ]);

  const focusYear = view === "year" ? user.trackingYear : year;
  const dates = monthDates(year, month);
  const monthEntries = yearEntries.filter((entry) => entry.date.startsWith(`${year}-${String(month).padStart(2, "0")}`));
  const monthSummary = summarizeRange(dates, view === "year" ? yearEntries.filter((entry) => entry.date.startsWith(dates[0].slice(0, 7))) : monthEntries, groups, subs, today, intoToday);
  const leading = (weekdayIndex(dates[0]) + 6) % 7;

  return (
    <div>
      <PageHeader
        eyebrow="Monthly tracker"
        title={view === "year" ? String(user.trackingYear) : formatMonth(year, month)}
        description="Each cell is tracked time. Untracked fills the rest of a finished day, only the hours already lived today, and nothing in the future."
        actions={
          <div className="flex gap-2 text-sm">
            <Link className={tab(view === "month")} href={`/app/month?month=${year}-${String(month).padStart(2, "0")}`}>Month</Link>
            <Link className={tab(view === "year")} href={`/app/month?view=year`}>Year</Link>
          </div>
        }
      />
      {view === "month" ? (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Link className="rounded-full border border-line bg-paper px-3 py-2 text-sm" href={monthHref(year, month - 1)}>Previous</Link>
              <Link className="rounded-full border border-line bg-paper px-3 py-2 text-sm" href={monthHref(year, month + 1)}>Next</Link>
            </div>
            <p className="text-sm text-muted">
              Tracked {formatHours(monthSummary.tracked)} · Untracked {formatSignedHours(monthSummary.untracked)}
            </p>
          </div>
          <Card>
            <div className="grid grid-cols-7 gap-2 text-center text-xs uppercase tracking-wider text-muted">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => <div key={label}>{label}</div>)}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {Array.from({ length: leading }).map((_, index) => <div key={`pad-${index}`} />)}
              {monthSummary.days.map((day) => {
                const intensity = Math.min(1, day.tracked / 16);
                return (
                  <Link
                    key={day.date}
                    href={`/app/day?date=${day.date}`}
                    className="min-h-20 rounded-2xl border border-line p-2 text-left hover:border-ink/30"
                    style={{ background: day.date > today ? "#fff" : `rgba(31, 122, 98, ${0.08 + intensity * 0.45})` }}
                  >
                    <p className="text-xs text-muted">{Number(day.date.slice(-2))}</p>
                    <p className="mt-2 text-sm font-medium tabular-nums">{day.date > today ? "—" : formatHours(day.tracked)}</p>
                    <p className="text-[11px] text-muted">{day.date > today ? "" : formatSignedHours(day.untracked)}</p>
                  </Link>
                );
              })}
            </div>
          </Card>
          <Card className="mt-4">
            <h2 className="font-serif text-2xl">Against the goals</h2>
            <div className="mt-4 space-y-3">
              {monthSummary.slices.map((slice) => (
                <div key={slice.group.id} className="grid grid-cols-[120px_1fr_auto] items-center gap-3 text-sm">
                  <span>{slice.group.name}</span>
                  <div className="h-2 rounded-full bg-sand">
                    <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (slice.hours / Math.max(slice.goalHours, 0.1)) * 100)}%`, background: slice.group.color }} />
                  </div>
                  <span className="tabular-nums text-muted">{formatHours(slice.hours)} / {formatHours(slice.goalHours)}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      ) : (
        <YearTable year={focusYear} entries={yearEntries} groups={groups} subs={subs} today={today} intoToday={intoToday} />
      )}
    </div>
  );
}

function YearTable({
  year,
  entries,
  groups,
  subs,
  today,
  intoToday,
}: {
  year: number;
  entries: { id: string; date: string; hours: number; title: string; startTime: string | null; endTime: string | null; subcategoryId: string | null; secondarySubcategoryId: string | null }[];
  groups: { id: string; slug: string; name: string; goalPercent: number; color: string; sortOrder: number }[];
  subs: { id: string; groupId: string; name: string; key: string; active: boolean; sortOrder: number }[];
  today: string;
  intoToday: number;
}) {
  const months = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const dates = monthDates(year, month);
    const monthEntries = entries.filter((entry) => entry.date.startsWith(`${year}-${String(month).padStart(2, "0")}`));
    return summarizeRange(dates, monthEntries, groups, subs, today, intoToday);
  });
  return (
    <Card className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-muted">
            <th className="py-2 pr-3">Category</th>
            {months.map((_, index) => (
              <th key={index} className="px-2 py-2 font-medium">
                <Link href={`/app/month?month=${year}-${String(index + 1).padStart(2, "0")}`}>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][index]}</Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={group.id} className="border-t border-line">
              <td className="py-2 pr-3 font-medium" style={{ color: group.color }}>{group.name}</td>
              {months.map((summary, index) => {
                const hours = summary.slices.find((slice) => slice.group.id === group.id)?.hours ?? 0;
                return <td key={index} className="px-2 py-2 tabular-nums">{formatHours(hours)}</td>;
              })}
            </tr>
          ))}
          <tr className="border-t border-line">
            <td className="py-2 pr-3" style={{ color: GROUP_COLORS.untracked }}>Untracked</td>
            {months.map((summary, index) => (
              <td key={index} className="px-2 py-2 tabular-nums">{formatSignedHours(summary.untracked)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="mt-3 text-xs text-muted">{year} has {daysInMonth(year, 2) === 29 ? "a leap-day February" : "a 28-day February"}. Untracked uses the real length of each month.</p>
    </Card>
  );
}

function monthHref(year: number, month: number) {
  const date = new Date(Date.UTC(year, month - 1, 1));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `/app/month?month=${y}-${m}`;
}

function tab(active: boolean) {
  return active ? "rounded-full bg-ink px-3 py-2 text-cream" : "rounded-full border border-line bg-paper px-3 py-2";
}
