import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const [entries, subs] = await Promise.all([
    prisma.timeEntry.findMany({ where: { userId: user.id }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    prisma.subcategory.findMany({ where: { userId: user.id } }),
  ]);
  const byId = new Map(subs.map((sub) => [sub.id, sub.key]));
  const header = ["date", "title", "start", "end", "hours", "primary_key", "secondary_key", "source", "notes"];
  const lines = [header.join(",")];
  for (const entry of entries) {
    lines.push(
      [
        entry.date,
        csv(entry.title),
        entry.startTime ?? "",
        entry.endTime ?? "",
        String(entry.hours),
        entry.subcategoryId ? byId.get(entry.subcategoryId) ?? "" : "",
        entry.secondarySubcategoryId ? byId.get(entry.secondarySubcategoryId) ?? "" : "",
        entry.source,
        csv(entry.notes),
      ].join(","),
    );
  }
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=balance-entries.csv",
    },
  });
}

function csv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
