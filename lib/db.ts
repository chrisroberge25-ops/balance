import { PrismaClient } from "@prisma/client";
import { resolveDatabase } from "./database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const resolved = resolveDatabase();

if (resolved.provider === "postgresql" && resolved.directUrl) {
  process.env.DATABASE_URL_UNPOOLED = resolved.directUrl;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: resolved.provider === "postgresql" ? { db: { url: resolved.databaseUrl } } : undefined,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;
