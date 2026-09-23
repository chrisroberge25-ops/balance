"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { parseIsoDate } from "@/lib/dates";
import { prisma } from "@/lib/db";

function scoreValue(formData: FormData, name: string) {
  const raw = String(formData.get(name) ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 10) return Number.NaN;
  return value;
}

export async function saveCheckin(formData: FormData) {
  const user = await requireUser();
  const date = String(formData.get("date") ?? "");
  if (!parseIsoDate(date)) redirect("/app/check-in?error=Pick a valid day.");

  const motivation = scoreValue(formData, "motivation");
  const sleepScore = scoreValue(formData, "sleepScore");
  const workScore = scoreValue(formData, "workScore");
  const lifeScore = scoreValue(formData, "lifeScore");
  const healthScore = scoreValue(formData, "healthScore");
  if ([motivation, sleepScore, workScore, lifeScore, healthScore].some((value) => Number.isNaN(value))) {
    redirect(`/app/check-in?date=${date}&error=${encodeURIComponent("Scores are whole numbers from 1 to 10, or left blank.")}`);
  }

  await prisma.qualitativeDay.upsert({
    where: { userId_date: { userId: user.id, date } },
    update: { motivation, sleepScore, workScore, lifeScore, healthScore },
    create: { userId: user.id, date, motivation, sleepScore, workScore, lifeScore, healthScore },
  });

  const habits = await prisma.habit.findMany({ where: { userId: user.id, active: true } });
  for (const habit of habits) {
    const value = String(formData.get(`habit-${habit.id}`) ?? "");
    if (value !== "Y" && value !== "N") {
      await prisma.habitLog.deleteMany({ where: { habitId: habit.id, date } });
      continue;
    }
    await prisma.habitLog.upsert({
      where: { habitId_date: { habitId: habit.id, date } },
      update: { done: value === "Y" },
      create: { userId: user.id, habitId: habit.id, date, done: value === "Y" },
    });
  }

  revalidatePath("/app", "layout");
  redirect(`/app/check-in?date=${date}&saved=1`);
}

export async function addHabit(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) redirect("/app/check-in?error=Name the habit.");
  const count = await prisma.habit.count({ where: { userId: user.id } });
  await prisma.habit.create({ data: { userId: user.id, name, sortOrder: count, active: true } });
  revalidatePath("/app", "layout");
  redirect("/app/check-in?saved=1");
}

export async function archiveHabit(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.habit.updateMany({ where: { id, userId: user.id }, data: { active: false } });
  revalidatePath("/app", "layout");
  redirect("/app/settings?saved=1");
}
