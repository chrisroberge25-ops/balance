import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { ensureDatabase } from "@/lib/bootstrap";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureDatabase();
  const user = await requireUser();
  if (!user.onboarded) redirect("/onboarding");
  const path = (await headers()).get("x-pathname") ?? "/app";
  return (
    <Shell
      path={path}
      user={{ name: user.name, email: user.email, plan: user.plan, trackingYear: user.trackingYear }}
    >
      {children}
    </Shell>
  );
}
