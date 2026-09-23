import { Prisma } from "@prisma/client";
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
  try {
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
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return;
    const message = error instanceof Error ? error.message : String(error);
    if (process.env.VERCEL === "1") {
      throw new Error(
        `Balance could not open its database. On Vercel, DATABASE_URL must be a hosted Postgres URL (Neon), not a SQLite file. ${message}`,
      );
    }
    throw error;
  }
}

export const DEMO_LOGIN = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
