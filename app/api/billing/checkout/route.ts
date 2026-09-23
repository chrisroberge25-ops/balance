import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const customer = user.stripeCustomerId || `cus_stub_${user.id.slice(0, 10)}`;
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "PRO", stripeCustomerId: customer },
  });
  revalidatePath("/app", "layout");
  redirect("/app/billing?status=upgraded");
}
