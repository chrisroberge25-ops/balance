import { saveEntry } from "@/app/actions/entries";
import { inputClass, Field, Button } from "./ui";

type Sub = { id: string; name: string; key: string; groupId: string; active: boolean };
type Group = { id: string; name: string };

export function EntryForm({
  groups,
  subs,
  returnTo,
  entry,
}: {
  groups: Group[];
  subs: Sub[];
  returnTo: string;
  entry?: {
    id: string;
    date: string;
    title: string;
    startTime: string | null;
    endTime: string | null;
    hours: number;
    notes: string;
    subcategoryId: string | null;
    secondarySubcategoryId: string | null;
  };
}) {
  const active = subs.filter((sub) => sub.active || sub.id === entry?.subcategoryId || sub.id === entry?.secondarySubcategoryId);
  return (
    <form action={saveEntry} className="space-y-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      {entry ? <input type="hidden" name="id" value={entry.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date">
          <input className={inputClass} type="date" name="date" required defaultValue={entry?.date} />
        </Field>
        <Field label="Hours" hint="Leave blank to calculate from start and end. Overnight blocks are fine.">
          <input className={inputClass} name="hours" type="number" min={0.25} max={24} step={0.25} defaultValue={entry?.id ? entry.hours : undefined} />
        </Field>
      </div>
      <Field label="Title" hint="Put a key in the title (W:J, L:F + H:P) and Balance will categorize it. Hours count once, toward the first key.">
        <input className={inputClass} name="title" required defaultValue={entry?.title} placeholder="W:J Product review" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start">
          <input className={inputClass} name="start" type="time" defaultValue={entry?.startTime ?? ""} />
        </Field>
        <Field label="End">
          <input className={inputClass} name="end" type="time" defaultValue={entry?.endTime ?? ""} />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Primary category">
          <SubSelect name="subcategoryId" groups={groups} subs={active} defaultValue={entry?.subcategoryId ?? ""} allowEmpty />
        </Field>
        <Field label="Secondary label" hint="Optional. Shown for context, never added to the totals.">
          <SubSelect name="secondarySubcategoryId" groups={groups} subs={active} defaultValue={entry?.secondarySubcategoryId ?? ""} allowEmpty />
        </Field>
      </div>
      <Field label="Notes">
        <textarea className={inputClass} name="notes" rows={3} defaultValue={entry?.notes ?? ""} />
      </Field>
      <Button type="submit">{entry ? "Save changes" : "Add entry"}</Button>
    </form>
  );
}

function SubSelect({
  name,
  groups,
  subs,
  defaultValue,
  allowEmpty,
}: {
  name: string;
  groups: Group[];
  subs: Sub[];
  defaultValue: string;
  allowEmpty?: boolean;
}) {
  return (
    <select className={inputClass} name={name} defaultValue={defaultValue}>
      {allowEmpty ? <option value="">From the title key</option> : null}
      {groups.map((group) => {
        const options = subs.filter((sub) => sub.groupId === group.id);
        if (options.length === 0) return null;
        return (
          <optgroup key={group.id} label={group.name}>
            {options.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.key} · {sub.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
