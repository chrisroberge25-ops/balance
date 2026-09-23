"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { FREE_MONTHLY_ENTRY_LIMIT } from "@/lib/defaults";
import { parseIsoDate } from "@/lib/dates";
import { assignKeys } from "@/lib/parser";
import { durationFromClocks, roundQuarter } from "@/lib/time-math";

function safeReturn(value: FormDataEntryValue | null) {
  const raw = String(value ?? "/app/entries");
  try {
    const url = new URL(raw, "http://localhost");
    if (!url.pathname.startsWith("/app")) return "/app/entries";
    const allowed = new URLSearchParams();
    for (const key of ["date", "month", "view", "range"]) {
      const param = url.searchParams.get(key);
      if (param && /^[\w-]+$/.test(param)) allowed.set(key, param);
    }
    const query = allowed.toString();
    return query ? `${url.pathname}?${query}` : url.pathname;
  } catch {
    return "/app/entries";
  }
}

function withFlag(path: string, flag: string) {
  return `${path}${path.includes("?") ? "&" : "?"}${flag}`;
}

export async function saveEntry(formData: FormData) {
  const user = await requireUser();
  const returnTo = safeReturn(formData.get("returnTo"));
  const id = String(formData.get("id") ?? "");
  const date = String(formData.get("date") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const start = normalizeClock(String(formData.get("start") ?? ""));
  const end = normalizeClock(String(formData.get("end") ?? ""));
  const notes = String(formData.get("notes") ?? "").slice(0, 2000);
  let subcategoryId = String(formData.get("subcategoryId") ?? "") || null;
  let secondarySubcategoryId = String(formData.get("secondarySubcategoryId") ?? "") || null;

  if (!parseIsoDate(date)) redirect(withFlag(returnTo, `error=${encodeURIComponent("Enter a real date.")}`));
  if (!title) redirect(withFlag(returnTo, `error=${encodeURIComponent("Give the block a title.")}`));

  const explicit = Number(formData.get("hours"));
  const computed = durationFromClocks(start, end);
  const hours = Number.isFinite(explicit) && explicit > 0 ? roundQuarter(explicit) : computed;
  if (!hours || hours <= 0 || hours > 24) {
    redirect(withFlag(returnTo, `error=${encodeURIComponent("Hours must be between 0.25 and 24. Add a start and end, or type the duration.")}`));
  }

  const subs = await prisma.subcategory.findMany({ where: { userId: user.id } });
  const allowed = new Set(subs.map((sub) => sub.id));
  if (subcategoryId && !allowed.has(subcategoryId)) subcategoryId = null;
  if (secondarySubcategoryId && !allowed.has(secondarySubcategoryId)) secondarySubcategoryId = null;

  if (!subcategoryId) {
    const known = new Set(subs.map((sub) => sub.key.toUpperCase()));
    const assigned = assignKeys(title, known);
    const byKey = new Map(subs.map((sub) => [sub.key.toUpperCase(), sub.id]));
    subcategoryId = assigned.primary ? byKey.get(assigned.primary) ?? null : null;
    if (!secondarySubcategoryId && assigned.secondary) {
      secondarySubcategoryId = byKey.get(assigned.secondary) ?? null;
    }
  }
  if (secondarySubcategoryId === subcategoryId) secondarySubcategoryId = null;

  if (!id && user.plan !== "PRO") {
    const month = date.slice(0, 7);
    const count = await prisma.timeEntry.count({
      where: { userId: user.id, date: { gte: `${month}-01`, lte: `${month}-31` } },
    });
    if (count >= FREE_MONTHLY_ENTRY_LIMIT) {
      redirect(`/app/billing?error=${encodeURIComponent("Free includes 200 entries a month. Pro removes the cap.")}`);
    }
  }

  const data = {
    title,
    date,
    startTime: start,
    endTime: end,
    hours,
    notes,
    subcategoryId,
    secondarySubcategoryId,
  };

  if (id) {
    const existing = await prisma.timeEntry.findFirst({ where: { id, userId: user.id } });
    if (!existing) redirect(withFlag(returnTo, `error=${encodeURIComponent("That entry is gone.")}`));
    await prisma.timeEntry.update({ where: { id }, data });
  } else {
    await prisma.timeEntry.create({ data: { ...data, userId: user.id, source: "manual" } });
  }

  revalidatePath("/app", "layout");
  redirect(withFlag(returnTo, "saved=1"));
}

export async function deleteEntry(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.timeEntry.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app", "layout");
  redirect("/app/entries?saved=1");
}

function normalizeClock(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}
