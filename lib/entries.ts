import { FREE_MONTHLY_ENTRY_LIMIT } from "./defaults";
import { prisma } from "./db";
import { assignKeys, type DraftEntry } from "./parser";

export type ImportResult = {
  created: number;
  skipped: number;
  errors: number;
  limited: boolean;
};

export async function importDrafts(
  userId: string,
  drafts: DraftEntry[],
  source: string,
  plan: string,
): Promise<ImportResult> {
  const subs = await prisma.subcategory.findMany({ where: { userId } });
  const byKey = new Map(subs.map((sub) => [sub.key.toUpperCase(), sub]));
  const known = new Set(byKey.keys());
  let created = 0;
  let skipped = 0;
  let errors = 0;
  let limited = false;

  for (const draft of drafts) {
    const externalId = draft.externalId ?? `${source}:${draft.date}:${draft.title}:${draft.start ?? ""}:${draft.end ?? ""}`;
    const existing = await prisma.timeEntry.findFirst({ where: { userId, externalId } });
    if (existing) {
      skipped += 1;
      continue;
    }

    if (plan !== "PRO") {
      const month = draft.date.slice(0, 7);
      const count = await prisma.timeEntry.count({
        where: { userId, date: { gte: `${month}-01`, lte: `${month}-31` } },
      });
      if (count >= FREE_MONTHLY_ENTRY_LIMIT) {
        limited = true;
        errors += 1;
        await prisma.importError.create({
          data: {
            userId,
            eventTitle: draft.title,
            message: `Free plan stores ${FREE_MONTHLY_ENTRY_LIMIT} entries per month. Upgrade to Pro to import the rest.`,
            functionName: "importDrafts",
            context: draft.date,
          },
        });
        continue;
      }
    }

    const assigned = assignKeys(draft.title, known);
    const primary = assigned.primary ? byKey.get(assigned.primary) : undefined;
    const secondary = assigned.secondary ? byKey.get(assigned.secondary) : undefined;

    if (!primary) {
      errors += 1;
      const reason =
        assigned.unknown.length > 0
          ? `Unrecognized key ${assigned.unknown.join(", ")}. Hours were saved once, without a category.`
          : "No category key in the title. Prefix it with a key such as W:J or L:F. Hours were saved once, uncategorized.";
      await prisma.importError.create({
        data: {
          userId,
          eventTitle: draft.title,
          message: reason,
          functionName: "assignKeys",
          context: draft.date,
        },
      });
    }

    await prisma.timeEntry.create({
      data: {
        userId,
        title: draft.title,
        date: draft.date,
        startTime: draft.start,
        endTime: draft.end,
        hours: draft.hours,
        notes: draft.notes ?? "",
        source,
        externalId,
        subcategoryId: primary?.id,
        secondarySubcategoryId: secondary?.id,
      },
    });
    created += 1;
  }

  return { created, skipped, errors, limited };
}
