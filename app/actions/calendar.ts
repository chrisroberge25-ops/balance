"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { importDrafts } from "@/lib/entries";
import { parsePastedEvents } from "@/lib/parser";

export async function pasteCalendar(formData: FormData) {
  const user = await requireUser();
  const text = String(formData.get("events") ?? "");
  const parsed = parsePastedEvents(text);
  if (parsed.entries.length === 0) {
    const message = parsed.errors[0] ?? "Paste at least one event.";
    redirect(`/app/calendar?error=${encodeURIComponent(message)}`);
  }
  const result = await importDrafts(
    user.id,
    parsed.entries.map((entry, index) => ({
      ...entry,
      externalId: `paste:${entry.date}:${entry.title}:${entry.start ?? ""}:${index}`,
    })),
    "calendar",
    user.plan,
  );
  revalidatePath("/app", "layout");
  const note = `${result.created} added, ${result.skipped} already there, ${result.errors} need a key.`;
  redirect(`/app/calendar?saved=1&note=${encodeURIComponent(note)}`);
}

export async function setGoogleConnected(formData: FormData) {
  const user = await requireUser();
  const connected = formData.get("connected") === "1";
  await prisma.user.update({ where: { id: user.id }, data: { googleConnected: connected } });
  revalidatePath("/app", "layout");
  redirect(connected ? "/app/calendar?oauth=stub-connected" : "/app/calendar?saved=1");
}
