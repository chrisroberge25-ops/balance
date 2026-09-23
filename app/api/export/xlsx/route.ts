import { getCurrentUser } from "@/lib/auth";
import { hoursSinceMidnight, monthDates, zonedToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { workbookToBuffer } from "@/lib/excel";
import { summarizeRange } from "@/lib/stats";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const [entries, subs, groups, qualities, habits, logs] = await Promise.all([
    prisma.timeEntry.findMany({ where: { userId: user.id }, orderBy: [{ date: "asc" }] }),
    prisma.subcategory.findMany({ where: { userId: user.id } }),
    prisma.categoryGroup.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.qualitativeDay.findMany({ where: { userId: user.id }, orderBy: { date: "asc" } }),
    prisma.habit.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.habitLog.findMany({ where: { userId: user.id } }),
  ]);
  const byId = new Map(subs.map((sub) => [sub.id, sub]));
  const today = zonedToday(user.timezone);
  const intoToday = hoursSinceMidnight(user.timezone);
  const year = user.trackingYear;
  const summaryRows: (string | number)[][] = [["Month", ...groups.map((group) => group.name), "Untracked"]];
  for (let month = 1; month <= 12; month++) {
    const dates = monthDates(year, month);
    const monthEntries = entries.filter((entry) => entry.date.startsWith(`${year}-${String(month).padStart(2, "0")}`));
    const summary = summarizeRange(dates, monthEntries, groups, subs, today, intoToday);
    summaryRows.push([
      dates[0].slice(0, 7),
      ...groups.map((group) => summary.slices.find((slice) => slice.group.id === group.id)?.hours ?? 0),
      Math.round(summary.untracked * 100) / 100,
    ]);
  }

  const buffer = await workbookToBuffer([
    {
      name: "Entries",
      rows: [
        ["Date", "Title", "Start", "End", "Hours", "Primary", "Secondary", "Source", "Notes"],
        ...entries.map((entry) => [
          entry.date,
          entry.title,
          entry.startTime ?? "",
          entry.endTime ?? "",
          entry.hours,
          entry.subcategoryId ? byId.get(entry.subcategoryId)?.key ?? "" : "",
          entry.secondarySubcategoryId ? byId.get(entry.secondarySubcategoryId)?.key ?? "" : "",
          entry.source,
          entry.notes,
        ]),
      ],
    },
    {
      name: "Qualitative",
      rows: [
        ["Date", "Motivation", "Sleep", "Work", "Life", "Health"],
        ...qualities.map((day) => [day.date, day.motivation ?? "", day.sleepScore ?? "", day.workScore ?? "", day.lifeScore ?? "", day.healthScore ?? ""]),
      ],
    },
    {
      name: "Habits",
      rows: [
        ["Date", "Habit", "Done"],
        ...logs.map((log) => [log.date, habits.find((habit) => habit.id === log.habitId)?.name ?? "", log.done ? "Y" : "N"]),
      ],
    },
    { name: "Year Summary", rows: summaryRows },
  ]);

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": "attachment; filename=balance-export.xlsx",
    },
  });
}
