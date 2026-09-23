import Link from "next/link";
import { GoalCompareChart, ScoreTrend, SplitPie } from "@/components/charts";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays, hoursSinceMidnight, monthDates, startOfWeek, weekdayShort, zonedToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { balanceNarrative, pieSlices, summarizeRange } from "@/lib/stats";

export const metadata = { title: "Insights" };

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const range = params.range === "week" || params.range === "year" ? params.range : "month";
  const today = zonedToday(user.timezone);
  const intoToday = hoursSinceMidnight(user.timezone);
  const year = range === "year" ? user.trackingYear : Number(today.slice(0, 4));
  const dates =
    range === "week"
      ? Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(today), index))
      : range === "month"
        ? monthDates(Number(today.slice(0, 4)), Number(today.slice(5, 7)))
        : Array.from({ length: 12 }, (_, month) => monthDates(year, month + 1)).flat();
  const [groups, subs, entries, qualities, habits, logs] = await Promise.all([
    prisma.categoryGroup.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.subcategory.findMany({ where: { userId: user.id } }),
    prisma.timeEntry.findMany({ where: { userId: user.id, date: { gte: dates[0], lte: dates[dates.length - 1] } } }),
    prisma.qualitativeDay.findMany({
      where: { userId: user.id, date: { gte: addDays(today, -27), lte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.habit.findMany({ where: { userId: user.id, active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.habitLog.findMany({ where: { userId: user.id, date: { gte: dates[0], lte: dates[dates.length - 1] } } }),
  ]);
  const summary = summarizeRange(dates, entries, groups, subs, today, intoToday);
  const pie = pieSlices(summary.slices, Math.max(0, summary.untracked), summary.uncategorized);
  const compare = summary.slices.map((slice) => ({
    name: slice.group.name,
    Actual: Math.round(slice.actualPercent),
    Goal: slice.goalPercent,
  }));
  const trend = qualities.map((day) => ({
    day: weekdayShort(day.date),
    Motivation: day.motivation,
    Sleep: day.sleepScore,
    Work: day.workScore,
    Life: day.lifeScore,
    Health: day.healthScore,
  }));
  const byDow = [0, 1, 2, 3, 4, 5, 6].map((dow) => {
    const matching = summary.days.filter((day) => new Date(`${day.date}T00:00:00Z`).getUTCDay() === dow);
    const tracked = matching.reduce((sum, day) => sum + day.tracked, 0);
    return { dow, tracked: matching.length ? tracked / matching.length : 0 };
  });

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title={summary.score == null ? "Not enough day yet" : `Balance score ${summary.score}`}
        description={balanceNarrative(summary.slices)}
        actions={
          <div className="flex gap-2 text-sm">
            {(["week", "month", "year"] as const).map((item) => (
              <Link key={item} href={`/app/insights?range=${item}`} className={range === item ? "rounded-full bg-ink px-3 py-2 text-cream" : "rounded-full border border-line bg-paper px-3 py-2"}>
                {item[0].toUpperCase() + item.slice(1)}
              </Link>
            ))}
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 font-serif text-2xl">Where the hours went</h2>
          <SplitPie data={pie} />
        </Card>
        <Card>
          <h2 className="mb-2 font-serif text-2xl">Actual vs goal</h2>
          <GoalCompareChart data={compare} />
        </Card>
        <Card>
          <h2 className="mb-2 font-serif text-2xl">How the days felt</h2>
          <ScoreTrend data={trend} />
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Habit completion</h2>
          <ul className="mt-4 space-y-3">
            {habits.map((habit) => {
              const relevant = logs.filter((log) => log.habitId === habit.id);
              const pct = relevant.length === 0 ? 0 : relevant.filter((log) => log.done).length / relevant.length;
              return (
                <li key={habit.id}>
                  <div className="flex justify-between text-sm">
                    <span>{habit.name}</span>
                    <span className="tabular-nums text-muted">{relevant.length === 0 ? "—" : `${Math.round(pct * 100)}%`}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-sand">
                    <div className="h-1.5 rounded-full bg-health" style={{ width: `${pct * 100}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <h3 className="mt-6 text-sm font-medium">Average tracked hours by weekday</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {byDow.map((item) => (
              <li key={item.dow} className="flex justify-between">
                <span>{["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][item.dow]}</span>
                <span className="tabular-nums">{item.tracked.toFixed(1)}h</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
