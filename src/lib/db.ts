import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

// Ensure .env / .env.local are applied before Prisma reads DATABASE_URL (fixes
// ordering with instrumentation and HMR where env can be missing briefly).
loadEnvConfig(process.cwd(), process.env.NODE_ENV === "development");

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
