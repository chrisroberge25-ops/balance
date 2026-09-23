import { DEFAULT_GOALS, DEFAULT_GROUPS, DEFAULT_HABITS } from "./defaults";
import { WORKBOOK_ENTRIES } from "./demo/workbook-entries";
import { prisma } from "./db";
import { importDrafts } from "./entries";
import { addDays, zonedToday } from "./dates";
import { buildRhythm } from "./rhythm";
import { unitInterval } from "./utils";

function score(seed: string, min: number, max: number) {
  return min + Math.round(unitInterval(seed) * (max - min));
}

export async function provisionWorkspace(
  userId: string,
  options: {
    goals?: Partial<Record<"work" | "life" | "health" | "sleep", number>>;
    workbook?: boolean;
    rhythm?: boolean;
    timezone?: string;
    plan?: string;
  },
) {
  const goals = { ...DEFAULT_GOALS, ...options.goals };
  const plan = options.plan ?? "FREE";
  const groupCount = await prisma.categoryGroup.count({ where: { userId } });

  if (groupCount === 0) {
    for (const group of DEFAULT_GROUPS) {
      await prisma.categoryGroup.create({
        data: {
          userId,
          slug: group.slug,
          name: group.name,
          goalPercent: goals[group.slug],
          color: group.color,
          includes: group.includes,
          sortOrder: group.sortOrder,
          subcategories: {
            create: group.subs.map((sub, index) => ({
              userId,
              name: sub.name,
              key: sub.key,
              sortOrder: index,
              active: true,
            })),
          },
        },
      });
    }
    await prisma.habit.createMany({
      data: DEFAULT_HABITS.map((name, index) => ({
        userId,
        name,
        sortOrder: index,
        active: true,
      })),
    });
  }

  if (options.workbook) {
    await importDrafts(
      userId,
      WORKBOOK_ENTRIES.map((entry) => ({
        date: entry.date,
        title: entry.title,
        start: entry.start,
        end: entry.end,
        hours: entry.hours,
        notes: entry.notes,
        externalId: `workbook:${entry.row}`,
      })),
      "import",
      plan,
    );
  }

  if (options.rhythm) {
    const today = zonedToday(options.timezone ?? "America/New_York");
    await importDrafts(userId, buildRhythm(today), "demo", plan);
    await seedCheckins(userId, today);
  }
}

async function seedCheckins(userId: string, today: string) {
  const habits = await prisma.habit.findMany({ where: { userId, active: true }, orderBy: { sortOrder: "asc" } });
  for (let offset = 13; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    await prisma.qualitativeDay.upsert({
      where: { userId_date: { userId, date } },
      update: {},
      create: {
        userId,
        date,
        motivation: score(date + "motivation", 5, 9),
        sleepScore: score(date + "sleep", 4, 9),
        workScore: score(date + "work", 5, 9),
        lifeScore: score(date + "life", 5, 9),
        healthScore: score(date + "health", 5, 9),
      },
    });
    for (const habit of habits) {
      const threshold = habit.name === "Hygiene" ? 0.85 : habit.name === "Cannabis" ? 0.25 : 0.68;
      const done = unitInterval(date + habit.name) < threshold;
      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: habit.id, date } },
        update: {},
        create: { userId, habitId: habit.id, date, done },
      });
    }
  }
}
