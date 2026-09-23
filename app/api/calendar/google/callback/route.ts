import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/app/calendar");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  if (error || !code) redirect(`/app/calendar?error=${encodeURIComponent(error || "Google did not return a code.")}`);
  if (url.searchParams.get("state") && url.searchParams.get("state") !== user.id) {
    redirect("/app/calendar?error=OAuth state did not match this account.");
  }
  await prisma.user.update({ where: { id: user.id }, data: { googleConnected: true } });
  redirect("/app/calendar?oauth=stub-connected");
}
