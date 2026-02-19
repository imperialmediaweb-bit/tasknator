import { db } from "./db";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Checks if the database schema exists. If not, executes prisma/init.sql
 * to create all tables, enums, indexes, and foreign keys.
 *
 * For existing databases, applies any pending column migrations.
 *
 * This avoids any dependency on the prisma CLI at runtime.
 */
export async function ensureSchema(): Promise<boolean> {
  let isNew = false;

  try {
    // Quick check: does the User table exist?
    await db.$queryRaw`SELECT 1 FROM "User" LIMIT 0`;
  } catch {
    // Table doesn't exist — apply init.sql
    isNew = true;
    console.log("[ensure-schema] Tables missing, applying init.sql...");
  }

  if (isNew) {
    try {
      const sqlPath = join(process.cwd(), "prisma", "init.sql");
      const sql = readFileSync(sqlPath, "utf-8");

      // Split into individual statements (separated by semicolons)
      // Strip SQL comments before checking if a segment has real content
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => {
          const withoutComments = s.replace(/--[^\n]*/g, "").trim();
          return withoutComments.length > 0;
        });

      for (const stmt of statements) {
        try {
          await db.$executeRawUnsafe(stmt);
        } catch (e: any) {
          // Skip "already exists" errors (safe to ignore on partial re-runs)
          if (
            e.message?.includes("already exists") ||
            e.code === "42710" || // duplicate_object (enum)
            e.code === "42P07"    // duplicate_table
          ) {
            continue;
          }
          throw e;
        }
      }

      console.log("[ensure-schema] All tables created successfully.");
      return true;
    } catch (error) {
      console.error("[ensure-schema] Failed to apply init.sql:", error);
      return false;
    }
  }

  // Existing database — apply pending column migrations
  await applyMigrations();
  return true;
}

/**
 * Adds missing columns to existing tables.
 * Each migration is idempotent — safe to run multiple times.
 */
async function applyMigrations() {
  const migrations: { name: string; sql: string }[] = [
    {
      name: "workspace_white_label_fields",
      sql: `
        ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "customBrandName" TEXT;
        ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "customDomain" TEXT;
        ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "whiteLabelEnabled" BOOLEAN NOT NULL DEFAULT false;
        ALTER TABLE "Workspace" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
      `,
    },
  ];

  for (const m of migrations) {
    try {
      const statements = m.sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await db.$executeRawUnsafe(stmt);
      }
    } catch (e: any) {
      // IF NOT EXISTS handles duplicates, but catch other errors gracefully
      if (!e.message?.includes("already exists")) {
        console.error(`[ensure-schema] Migration "${m.name}" error:`, e.message);
      }
    }
  }
}
