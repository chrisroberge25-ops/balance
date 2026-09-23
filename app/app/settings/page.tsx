import { archiveHabit } from "@/app/actions/checkin";
import { addSubcategory, deleteSubcategory, updateGoals, updateProfile, updateSubcategory } from "@/app/actions/settings";
import { Button, Card, Field, inputClass, Notice, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { TIMEZONES } from "@/lib/dates";
import { prisma } from "@/lib/db";

export const metadata = { title: "Settings" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const [groups, subs, habits] = await Promise.all([
    prisma.categoryGroup.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.subcategory.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.habit.findMany({ where: { userId: user.id, active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Settings"
        title="Keys, goals, and the clock."
        description="Change a key here and new imports follow it. Charts read the names in this list, so the legend does not have to be edited by hand."
      />
      {params.error ? <div className="mb-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      {params.saved ? <div className="mb-4"><Notice tone="good">Saved.</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-serif text-2xl">Profile</h2>
          <form action={updateProfile} className="mt-4 space-y-3">
            <Field label="Name"><input className={inputClass} name="name" defaultValue={user.name} /></Field>
            <Field label="Timezone">
              <select className={inputClass} name="timezone" defaultValue={user.timezone}>
                {TIMEZONES.map((zone) => <option key={zone}>{zone}</option>)}
              </select>
            </Field>
            <Field label="Calendar ID" hint="Optional. The spreadsheet stored a Google calendar id here. Balance keeps it for the sync docs and does not read that calendar until OAuth is configured.">
              <input className={inputClass} name="calendarId" defaultValue={user.calendarId} placeholder="you@gmail.com" />
            </Field>
            <Button type="submit">Save profile</Button>
          </form>
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Category goals</h2>
          <p className="mt-2 text-sm text-muted">These four must total 100. Daily targets are that share of 24 hours.</p>
          <form action={updateGoals} className="mt-4 space-y-3">
            {groups.map((group) => (
              <Field key={group.id} label={`${group.name} %`} hint={group.includes}>
                <input className={inputClass} name={`goal-${group.id}`} type="number" min={0} max={100} step={1} defaultValue={group.goalPercent} />
              </Field>
            ))}
            <Button type="submit">Save goals</Button>
          </form>
        </Card>
      </div>
      <Card className="mt-4">
        <h2 className="font-serif text-2xl">Subcategories</h2>
        <div className="mt-4 space-y-4">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="text-sm font-medium" style={{ color: group.color }}>{group.name}</p>
              <ul className="mt-2 space-y-2">
                {subs.filter((sub) => sub.groupId === group.id).map((sub) => (
                  <li key={sub.id} className="flex flex-wrap items-center gap-2">
                    <form action={updateSubcategory} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="id" value={sub.id} />
                      <input className="w-24 rounded-full border border-line px-3 py-1 text-sm" name="key" defaultValue={sub.key} />
                      <input className="w-40 rounded-full border border-line px-3 py-1 text-sm" name="name" defaultValue={sub.name} />
                      <label className="flex items-center gap-1 text-xs text-muted">
                        <input type="checkbox" name="active" defaultChecked={sub.active} /> Active
                      </label>
                      <button className="text-xs font-medium underline">Update</button>
                    </form>
                    <form action={deleteSubcategory}>
                      <input type="hidden" name="id" value={sub.id} />
                      <button className="text-xs text-red-800">Remove</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <form action={addSubcategory} className="mt-6 flex flex-wrap items-end gap-2">
          <Field label="Group">
            <select className={inputClass} name="groupId">
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </Field>
          <Field label="Name"><input className={inputClass} name="name" placeholder="Deep work" /></Field>
          <Field label="Key"><input className={inputClass} name="key" placeholder="W:D" /></Field>
          <Button type="submit">Add key</Button>
        </form>
        {user.plan !== "PRO" ? <p className="mt-3 text-xs text-muted">Free includes the default keys. Pro is built for a longer custom list once the month cap is the thing in your way.</p> : null}
      </Card>
      <Card className="mt-4">
        <h2 className="font-serif text-2xl">Habits</h2>
        <ul className="mt-3 divide-y divide-line">
          {habits.map((habit) => (
            <li key={habit.id} className="flex items-center justify-between py-2 text-sm">
              <span>{habit.name}</span>
              <form action={archiveHabit}>
                <input type="hidden" name="id" value={habit.id} />
                <button className="text-xs text-muted underline">Archive</button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
