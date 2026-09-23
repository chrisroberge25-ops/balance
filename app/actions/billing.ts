"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function downgradePlan() {
  const user = await requireUser();
  await prisma.user.update({ where: { id: user.id }, data: { plan: "FREE" } });
  revalidatePath("/app", "layout");
  redirect("/app/billing?status=free");
}
