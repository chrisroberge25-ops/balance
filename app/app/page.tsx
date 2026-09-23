import Link from "next/link";
import { StackedWeekChart } from "@/components/charts";
import { Card, DayBar, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays, formatPrettyDate, startOfWeek, weekdayShort, zonedToday, hoursSinceMidnight } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { balanceNarrative, pieSlices, summarizeRange } from "@/lib/stats";
import { formatHours, formatSignedHours } from "@/lib/time-math";
import { GROUP_COLORS } from "@/lib/colors";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const today = zonedToday(user.timezone);
  const intoToday = hoursSinceMidnight(user.timezone);
  const weekStart = startOfWeek(today);
  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
  const [groups, subs, entries, quality, recent, imported] = await Promise.all([
    prisma.categoryGroup.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.subcategory.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.timeEntry.findMany({ where: { userId: user.id, date: { gte: dates[0], lte: dates[6] } } }),
    prisma.qualitativeDay.findUnique({ where: { userId_date: { userId: user.id, date: today } } }),
    prisma.timeEntry.findMany({ where: { userId: user.id }, orderBy: [{ date: "desc" }, { startTime: "desc" }], take: 6 }),
    prisma.timeEntry.count({ where: { userId: user.id, source: "import" } }),
  ]);
  const summary = summarizeRange(dates, entries, groups, subs, today, intoToday);
  const todayRow = summary.days.find((day) => day.date === today);
  const chart = summary.days.map((day) => {
    const point: Record<string, string | number> = { day: weekdayShort(day.date) };
    for (const slice of day.groupHours) point[slice.group.name] = Math.round(slice.hours * 10) / 10;
    point.Untracked = Math.max(0, Math.round(day.untracked * 10) / 10);
    return point;
  });
  const segments = [
    ...(todayRow?.groupHours.map((slice) => ({ label: slice.group.name, hours: slice.hours, color: slice.group.color })) ?? []),
    { label: "Untracked", hours: Math.max(0, todayRow?.untracked ?? 0), color: GROUP_COLORS.untracked },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={formatPrettyDate(today)}
        title={`Good to see you, ${user.name.split(" ")[0]}.`}
        description={balanceNarrative(summary.slices)}
        actions={
          <Link href={`/app/day?date=${today}`} className="rounded-full bg-ink px-4 py-2 text-sm text-cream">
            Open today
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Balance score</p>
          <p className="mt-2 font-serif text-4xl tabular-nums">{summary.score ?? "—"}</p>
          <p className="mt-1 text-sm text-muted">This week, against your goal mix.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Today tracked</p>
          <p className="mt-2 font-serif text-4xl tabular-nums">{formatHours(todayRow?.tracked ?? 0)}</p>
          <p className="mt-1 text-sm text-muted">Untracked {formatSignedHours(todayRow?.untracked ?? 0)}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Check-in</p>
          <p className="mt-2 font-serif text-4xl">{quality ? "Done" : "Open"}</p>
          <Link href={`/app/check-in?date=${today}`} className="mt-1 inline-block text-sm text-accent-ink underline">
            {quality ? "Review today’s scores" : "Rate the day"}
          </Link>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Today’s mix</h2>
          <span className="text-sm text-muted">{formatHours(intoToday)} elapsed</span>
        </div>
        <DayBar segments={segments} />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {summary.slices.map((slice) => (
            <div key={slice.group.id}>
              <div className="flex justify-between text-sm">
                <span>{slice.group.name}</span>
                <span className="tabular-nums text-muted">
                  {Math.round(slice.actualPercent)}% · goal {slice.goalPercent}%
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-sand">
                <div className="h-1.5 rounded-full" style={{ width: `${Math.min(100, slice.actualPercent)}%`, background: slice.group.color }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-4">
        <h2 className="mb-2 font-serif text-2xl">This week</h2>
        <StackedWeekChart data={chart as { day: string; Work: number; Life: number; Health: number; Sleep: number; Untracked: number }[]} />
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="font-serif text-2xl">Latest entries</h2>
          <ul className="mt-3 divide-y divide-line">
            {recent.map((entry) => {
              const sub = subs.find((item) => item.id === entry.subcategoryId);
              return (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-muted">{formatPrettyDate(entry.date)}{sub ? ` · ${sub.key}` : " · uncategorized"}</p>
                  </div>
                  <span className="tabular-nums">{formatHours(entry.hours)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Workbook log</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            {imported} calendar rows from the 2025 Entry Log are in this workspace. Only titles with a key, such as L:S, join a category. The rest stay visible in Entries and the import error log.
          </p>
          <Link href="/app/month?month=2025-04&view=month" className="mt-4 inline-block text-sm font-medium text-accent-ink underline">
            See April 2025
          </Link>
          {pieSlices(summary.slices, Math.max(0, summary.untracked), summary.uncategorized).length === 0 ? (
            <div className="mt-4"><Notice>Log a block to wake the week up.</Notice></div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
