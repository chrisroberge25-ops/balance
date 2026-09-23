import Link from "next/link";
import { addHabit, saveCheckin } from "@/app/actions/checkin";
import { Button, Card, Field, inputClass, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { addDays, formatPrettyDate, parseIsoDate, zonedToday } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata = { title: "Check-in" };

export default async function CheckInPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = zonedToday(user.timezone);
  const date = params.date && parseIsoDate(params.date) ? params.date : today;
  const from = addDays(date, -13);
  const [habits, quality, logs, recent] = await Promise.all([
    prisma.habit.findMany({ where: { userId: user.id, active: true }, orderBy: { sortOrder: "asc" } }),
    prisma.qualitativeDay.findUnique({ where: { userId_date: { userId: user.id, date } } }),
    prisma.habitLog.findMany({ where: { userId: user.id, date } }),
    prisma.qualitativeDay.findMany({ where: { userId: user.id, date: { gte: from, lte: date } }, orderBy: { date: "asc" } }),
  ]);
  const logByHabit = new Map(logs.map((log) => [log.habitId, log.done]));
  const answered = habits.filter((habit) => logByHabit.has(habit.id)).length;
  const yes = habits.filter((habit) => logByHabit.get(habit.id) === true).length;
  const completion = answered === 0 ? null : yes / answered;

  return (
    <div>
      <PageHeader
        eyebrow="Qualitative daily"
        title={formatPrettyDate(date)}
        description="Rate motivation, sleep, work, life, and health from 1 to 10. Mark each habit Y or N. Completion is yes answers divided by the habits you actually marked."
        actions={
          <div className="flex gap-2">
            <Link className="rounded-full border border-line bg-paper px-3 py-2 text-sm" href={`/app/check-in?date=${addDays(date, -1)}`}>Previous</Link>
            <Link className="rounded-full border border-line bg-paper px-3 py-2 text-sm" href={`/app/check-in?date=${addDays(date, 1)}`}>Next</Link>
          </div>
        }
      />
      {params.error ? <div className="mb-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      {params.saved ? <div className="mb-4"><Notice tone="good">Check-in saved.</Notice></div> : null}
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {Array.from({ length: 14 }, (_, index) => addDays(from, index)).map((day) => {
          const hit = recent.find((item) => item.date === day);
          return (
            <Link key={day} href={`/app/check-in?date=${day}`} className={`min-w-14 rounded-2xl border px-2 py-2 text-center text-xs ${day === date ? "border-ink bg-ink text-cream" : "border-line bg-paper"}`}>
              <div>{day.slice(8)}</div>
              <div className="mt-1">{hit?.motivation ?? "·"}</div>
            </Link>
          );
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <form action={saveCheckin} className="space-y-4">
            <input type="hidden" name="date" value={date} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Score name="motivation" label="Motivation" value={quality?.motivation} />
              <Score name="sleepScore" label="Sleep" value={quality?.sleepScore} />
              <Score name="workScore" label="Work" value={quality?.workScore} />
              <Score name="lifeScore" label="Life" value={quality?.lifeScore} />
              <Score name="healthScore" label="Health" value={quality?.healthScore} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="font-serif text-2xl">Habits</h2>
                <p className="text-sm text-muted">{completion == null ? "Not started" : `${Math.round(completion * 100)}% complete`}</p>
              </div>
              <ul className="divide-y divide-line">
                {habits.map((habit) => {
                  const current = logByHabit.has(habit.id) ? (logByHabit.get(habit.id) ? "Y" : "N") : "";
                  return (
                    <li key={habit.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span>{habit.name}</span>
                      <select name={`habit-${habit.id}`} defaultValue={current} className="rounded-full border border-line bg-white px-3 py-1">
                        <option value="">—</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </li>
                  );
                })}
              </ul>
            </div>
            <Button type="submit">Save check-in</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Add a habit</h2>
          <p className="mt-2 text-sm leading-6 text-muted">The opening list matches the workbook checklist, including the items that are personal. Archive anything that is not yours from Settings.</p>
          <form action={addHabit} className="mt-4 flex gap-2">
            <input className={inputClass} name="name" placeholder="Evening walk" />
            <Button type="submit">Add</Button>
          </form>
          <div className="mt-6">
            <h3 className="text-sm font-medium">Recent averages</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {(["motivation", "sleepScore", "workScore", "lifeScore", "healthScore"] as const).map((key) => {
                const values = recent.map((item) => item[key]).filter((value): value is number => typeof value === "number");
                const avg = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
                const label = { motivation: "Motivation", sleepScore: "Sleep", workScore: "Work", lifeScore: "Life", healthScore: "Health" }[key];
                return <li key={key} className="flex justify-between"><span>{label}</span><span>{avg == null ? "—" : avg.toFixed(1)}</span></li>;
              })}
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Score({ name, label, value }: { name: string; label: string; value?: number | null }) {
  return (
    <Field label={label}>
      <input className={inputClass} name={name} type="number" min={1} max={10} step={1} defaultValue={value ?? ""} />
    </Field>
  );
}
