import Link from "next/link";
import { EntryForm } from "@/components/entry-form";
import { Card, DayBar, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays, formatPrettyDate, hoursSinceMidnight, parseIsoDate, zonedToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { GROUP_COLORS } from "@/lib/colors";
import { hoursForSub, overlappingEntryIds, summarizeRange } from "@/lib/stats";
import { formatHours, formatSignedHours } from "@/lib/time-math";

export const metadata = { title: "Today" };

export default async function DayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = zonedToday(user.timezone);
  const date = params.date && parseIsoDate(params.date) ? params.date : today;
  const intoToday = hoursSinceMidnight(user.timezone);
  const [groups, subs, entries, quality] = await Promise.all([
    prisma.categoryGroup.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.subcategory.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.timeEntry.findMany({
      where: { userId: user.id, date },
      orderBy: [{ startTime: "asc" }, { title: "asc" }],
    }),
    prisma.qualitativeDay.findUnique({ where: { userId_date: { userId: user.id, date } } }),
  ]);
  const summary = summarizeRange([date], entries, groups, subs, today, intoToday);
  const day = summary.days[0];
  const overlaps = overlappingEntryIds(entries);
  const segments = [
    ...day.groupHours.map((slice) => ({ label: slice.group.name, hours: slice.hours, color: slice.group.color })),
    { label: "Uncategorized", hours: day.uncategorized, color: GROUP_COLORS.uncategorized },
    { label: "Untracked", hours: Math.max(0, day.untracked), color: GROUP_COLORS.untracked },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Day"
        title={formatPrettyDate(date)}
        description="Past days leave 24 minus tracked. Today uses the hours since midnight, rounded to a quarter. Future days stay at zero."
        actions={
          <div className="flex gap-2">
            <Link className="rounded-full border border-line bg-paper px-3 py-2 text-sm" href={`/app/day?date=${addDays(date, -1)}`}>Previous</Link>
            <Link className="rounded-full border border-line bg-paper px-3 py-2 text-sm" href={`/app/day?date=${today}`}>Today</Link>
            <Link className="rounded-full border border-line bg-paper px-3 py-2 text-sm" href={`/app/day?date=${addDays(date, 1)}`}>Next</Link>
          </div>
        }
      />
      {params.error ? <div className="mb-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      {params.saved ? <div className="mb-4"><Notice tone="good">Saved.</Notice></div> : null}
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Tracked {formatHours(day.tracked)}</p>
            <p className="font-serif text-3xl">{formatSignedHours(day.untracked)} untracked</p>
          </div>
          <Link href={`/app/check-in?date=${date}`} className="text-sm underline">
            {quality ? `Check-in ${quality.motivation ?? "—"} / 10 motivation` : "No check-in yet"}
          </Link>
        </div>
        <div className="mt-4"><DayBar segments={segments} /></div>
      </Card>
      {overlaps.size > 0 ? (
        <div className="mt-4">
          <Notice tone="warn">Some blocks overlap. Both are counted. If it was one activity, keep a single entry and put the second category in the secondary label.</Notice>
        </div>
      ) : null}
      <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="font-serif text-2xl">Categories</h2>
          <div className="mt-3 space-y-4">
            {groups.map((group) => (
              <div key={group.id}>
                <p className="text-sm font-medium" style={{ color: group.color }}>{group.name}</p>
                <ul className="mt-1 space-y-1">
                  {subs.filter((sub) => sub.groupId === group.id).map((sub) => (
                    <li key={sub.id} className="flex justify-between text-sm">
                      <span className="text-muted">{sub.key} {sub.name}</span>
                      <span className="tabular-nums">{formatHours(hoursForSub(entries, sub.id))}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 font-serif text-2xl">Add a block</h2>
            <EntryForm groups={groups} subs={subs} returnTo={`/app/day?date=${date}`} entry={{ id: "", date, title: "", startTime: "", endTime: "", hours: 1, notes: "", subcategoryId: null, secondarySubcategoryId: null }} />
          </Card>
          <Card>
            <h2 className="font-serif text-2xl">Logged</h2>
            <ul className="mt-3 divide-y divide-line">
              {entries.length === 0 ? <li className="py-3 text-sm text-muted">Nothing on this day yet.</li> : null}
              {entries.map((entry) => {
                const primary = subs.find((sub) => sub.id === entry.subcategoryId);
                const secondary = subs.find((sub) => sub.id === entry.secondarySubcategoryId);
                return (
                  <li key={entry.id} className="py-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{entry.title}</p>
                        <p className="text-muted">
                          {entry.startTime && entry.endTime ? `${entry.startTime}–${entry.endTime} · ` : ""}
                          {primary ? primary.key : "Uncategorized"}
                          {secondary ? ` + ${secondary.key}` : ""}
                          {overlaps.has(entry.id) ? " · overlap" : ""}
                        </p>
                      </div>
                      <span className="tabular-nums">{formatHours(entry.hours)}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
