"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { TIMEZONES } from "@/lib/dates";
import { prisma } from "@/lib/db";

export async function updateProfile(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "");
  const calendarId = String(formData.get("calendarId") ?? "").trim().slice(0, 200);
  if (!name) redirect("/app/settings?error=Name is required.");
  if (!TIMEZONES.includes(timezone)) redirect("/app/settings?error=Choose a timezone from the list.");
  await prisma.user.update({ where: { id: user.id }, data: { name, timezone, calendarId } });
  revalidatePath("/app", "layout");
  redirect("/app/settings?saved=1");
}

export async function updateGoals(formData: FormData) {
  const user = await requireUser();
  const groups = await prisma.categoryGroup.findMany({ where: { userId: user.id } });
  const updates = groups.map((group) => ({
    id: group.id,
    goalPercent: Number(formData.get(`goal-${group.id}`)),
  }));
  if (updates.some((item) => !Number.isFinite(item.goalPercent) || item.goalPercent < 0 || item.goalPercent > 100)) {
    redirect("/app/settings?error=Each goal is a percent from 0 to 100.");
  }
  const total = updates.reduce((sum, item) => sum + item.goalPercent, 0);
  if (Math.abs(total - 100) > 0.01) redirect("/app/settings?error=Category goals must add up to 100%.");
  await prisma.$transaction(
    updates.map((item) => prisma.categoryGroup.update({ where: { id: item.id }, data: { goalPercent: item.goalPercent } })),
  );
  revalidatePath("/app", "layout");
  redirect("/app/settings?saved=1");
}

export async function addSubcategory(formData: FormData) {
  const user = await requireUser();
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim().toUpperCase();
  const group = await prisma.categoryGroup.findFirst({ where: { id: groupId, userId: user.id } });
  if (!group || !name || !/^[A-Z]:[A-Z]$/.test(key)) {
    redirect("/app/settings?error=A subcategory needs a group, a name, and a key like W:J.");
  }
  const taken = await prisma.subcategory.findFirst({ where: { userId: user.id, key } });
  if (taken) redirect("/app/settings?error=That key is already in use.");
  if (user.plan !== "PRO") {
    const count = await prisma.subcategory.count({ where: { userId: user.id } });
    if (count >= 20) redirect("/app/billing?error=Free includes the default keys plus a few extras. Pro lifts that limit.");
  }
  const sortOrder = await prisma.subcategory.count({ where: { groupId } });
  await prisma.subcategory.create({ data: { userId: user.id, groupId, name, key, sortOrder, active: true } });
  revalidatePath("/app", "layout");
  redirect("/app/settings?saved=1");
}

export async function updateSubcategory(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const key = String(formData.get("key") ?? "").trim().toUpperCase();
  const active = formData.get("active") === "on";
  if (!name || !/^[A-Z]:[A-Z]$/.test(key)) redirect("/app/settings?error=Keys look like L:F.");
  const current = await prisma.subcategory.findFirst({ where: { id, userId: user.id } });
  if (!current) redirect("/app/settings?error=Subcategory not found.");
  const taken = await prisma.subcategory.findFirst({ where: { userId: user.id, key, NOT: { id } } });
  if (taken) redirect("/app/settings?error=That key is already in use.");
  await prisma.subcategory.update({ where: { id }, data: { name, key, active } });
  revalidatePath("/app", "layout");
  redirect("/app/settings?saved=1");
}

export async function deleteSubcategory(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.subcategory.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/app", "layout");
  redirect("/app/settings?saved=1");
}
