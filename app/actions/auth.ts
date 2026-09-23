"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { clearSession, createSession, requireUser, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TIMEZONES } from "@/lib/dates";
import { hashPassword } from "@/lib/auth";
import { provisionWorkspace } from "@/lib/seed-workspace";

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function signup(formData: FormData) {
  const parsed = credentials.extend({ name: z.string().trim().min(1).max(80) }).safeParse({
    name: formData.get("name"),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/signup?error=Use your name, a valid email, and a password of at least 8 characters.");

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) redirect("/signup?error=An account with that email already exists.");

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      trackingYear: new Date().getFullYear(),
      onboarded: false,
    },
  });
  await createSession(user.id);
  redirect("/onboarding");
}

export async function login(formData: FormData) {
  const parsed = credentials.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/login?error=Check your email and password.");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    redirect("/login?error=Those credentials do not match an account.");
  }
  await createSession(user.id);
  const next = String(formData.get("next") ?? "");
  if (!user.onboarded) redirect("/onboarding");
  if (next.startsWith("/app")) redirect(next);
  redirect("/app");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function setTrackingYear(formData: FormData) {
  const user = await requireUser();
  const year = Number(formData.get("year"));
  if (!Number.isInteger(year) || year < 2000 || year > 2100) redirect("/app");
  await prisma.user.update({ where: { id: user.id }, data: { trackingYear: year } });
  revalidatePath("/app", "layout");
  redirect("/app/month?view=year");
}

export async function completeOnboarding(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim() || user.name;
  const timezone = String(formData.get("timezone") ?? user.timezone);
  const year = Number(formData.get("year"));
  const goals = {
    work: Number(formData.get("work")),
    life: Number(formData.get("life")),
    health: Number(formData.get("health")),
    sleep: Number(formData.get("sleep")),
  };
  if (!TIMEZONES.includes(timezone)) redirect("/onboarding?error=Choose a timezone from the list.");
  if (!Number.isInteger(year) || year < 2000 || year > 2100) redirect("/onboarding?error=Choose a tracking year.");
  const total = goals.work + goals.life + goals.health + goals.sleep;
  if (![goals.work, goals.life, goals.health, goals.sleep].every((value) => value >= 0 && value <= 100) || Math.abs(total - 100) > 0.01) {
    redirect("/onboarding?error=Work, Life, Health, and Sleep goals must add up to 100%.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, timezone, trackingYear: year, onboarded: true },
  });
  await provisionWorkspace(user.id, {
    goals,
    workbook: formData.get("workbook") === "on",
    rhythm: formData.get("rhythm") === "on",
    timezone,
    plan: user.plan,
  });
  revalidatePath("/app", "layout");
  redirect("/app");
}
