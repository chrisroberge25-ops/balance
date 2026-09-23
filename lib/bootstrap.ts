import { hashPassword } from "./auth";
import { prisma } from "./db";
import { provisionWorkspace } from "./seed-workspace";

const DEMO_EMAIL = "demo@balance.app";
const DEMO_PASSWORD = "balance-demo";

let pending: Promise<void> | null = null;

export function ensureDatabase() {
  if (!pending) {
    pending = seedIfEmpty().catch((error) => {
      pending = null;
      throw error;
    });
  }
  return pending;
}

async function seedIfEmpty() {
  const count = await prisma.user.count();
  if (count > 0) return;
  const year = new Date().getFullYear();
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Avery Chen",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      plan: "FREE",
      onboarded: true,
      timezone: "America/New_York",
      trackingYear: year,
      calendarId: "",
    },
  });
  await provisionWorkspace(user.id, {
    workbook: true,
    rhythm: true,
    timezone: user.timezone,
    plan: user.plan,
  });
}

export const DEMO_LOGIN = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
