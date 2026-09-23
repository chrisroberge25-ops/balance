import Link from "next/link";
import { ConfirmDelete } from "@/components/confirm-delete";
import { EntryForm } from "@/components/entry-form";
import { Card, Notice, PageHeader } from "@/components/ui";
import { deleteEntry } from "@/app/actions/entries";
import { requireUser } from "@/lib/auth";
import { formatPrettyDate, zonedToday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { formatHours } from "@/lib/time-math";

export const metadata = { title: "Entries" };

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string; edit?: string; error?: string; saved?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const source = params.source ?? "all";
  const [groups, subs, entries, editing] = await Promise.all([
    prisma.categoryGroup.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.subcategory.findMany({ where: { userId: user.id }, orderBy: { sortOrder: "asc" } }),
    prisma.timeEntry.findMany({
      where: {
        userId: user.id,
        ...(source !== "all" ? { source } : {}),
        ...(q
          ? { OR: [{ title: { contains: q } }, { notes: { contains: q } }] }
          : {}),
      },
      orderBy: [{ date: "desc" }, { startTime: "desc" }],
      take: 200,
    }),
    params.edit
      ? prisma.timeEntry.findFirst({ where: { id: params.edit, userId: user.id } })
      : Promise.resolve(null),
  ]);
  const today = zonedToday(user.timezone);

  return (
    <div>
      <PageHeader
        eyebrow="Time entries"
        title="Every block, once."
        description="A secondary subcategory is a label. The hours stay on the primary key, which is how a family workout can mention health without inflating the day."
        actions={
          <div className="flex gap-2 text-sm">
            <a className="rounded-full border border-line bg-paper px-3 py-2" href="/api/export/csv">Export CSV</a>
            <a className="rounded-full border border-line bg-paper px-3 py-2" href="/api/export/xlsx">Export XLSX</a>
          </div>
        }
      />
      {params.error ? <div className="mb-4"><Notice tone="warn">{params.error}</Notice></div> : null}
      {params.saved ? <div className="mb-4"><Notice tone="good">Saved.</Notice></div> : null}
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="mb-3 font-serif text-2xl">{editing ? "Edit entry" : "New entry"}</h2>
          <EntryForm
            groups={groups}
            subs={subs}
            returnTo="/app/entries"
            entry={
              editing
                ? editing
                : { id: "", date: today, title: "", startTime: "", endTime: "", hours: 1, notes: "", subcategoryId: null, secondarySubcategoryId: null }
            }
          />
        </Card>
        <Card>
          <form className="flex flex-wrap gap-2" action="/app/entries">
            <input name="q" defaultValue={q} placeholder="Search titles" className="rounded-full border border-line bg-white px-3 py-2 text-sm" />
            <select name="source" defaultValue={source} className="rounded-full border border-line bg-white px-3 py-2 text-sm">
              <option value="all">All sources</option>
              <option value="manual">Manual</option>
              <option value="import">Workbook</option>
              <option value="demo">Example week</option>
              <option value="calendar">Calendar</option>
            </select>
            <button className="rounded-full bg-ink px-4 py-2 text-sm text-cream">Filter</button>
          </form>
          <ul className="mt-4 divide-y divide-line">
            {entries.length === 0 ? <li className="py-6 text-sm text-muted">No entries match.</li> : null}
            {entries.map((entry) => {
              const primary = subs.find((sub) => sub.id === entry.subcategoryId);
              const secondary = subs.find((sub) => sub.id === entry.secondarySubcategoryId);
              return (
                <li key={entry.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <p className="font-medium">{entry.title}</p>
                    <p className="text-muted">
                      {formatPrettyDate(entry.date)}
                      {entry.startTime ? ` · ${entry.startTime}` : ""}
                      {entry.endTime ? `–${entry.endTime}` : ""}
                      {" · "}
                      {primary ? `${primary.key} ${primary.name}` : "Uncategorized"}
                      {secondary ? ` + ${secondary.key}` : ""}
                      {" · "}
                      {entry.source}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">{formatHours(entry.hours)}</span>
                    <Link href={`/app/entries?edit=${entry.id}`} className="text-xs font-medium underline">Edit</Link>
                    <ConfirmDelete action={deleteEntry} id={entry.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </div>
  );
}
