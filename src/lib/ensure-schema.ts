import { db } from "./db";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Checks if the database schema exists. If not, executes prisma/init.sql
 * to create all tables, enums, indexes, and foreign keys.
 *
 * This avoids any dependency on the prisma CLI at runtime.
 */
export async function ensureSchema(): Promise<boolean> {
  try {
    // Quick check: does the User table exist?
    await db.$queryRaw`SELECT 1 FROM "User" LIMIT 0`;
    return true; // schema already exists
  } catch {
    // Table doesn't exist — apply init.sql
    console.log("[ensure-schema] Tables missing, applying init.sql...");
  }

  try {
    const sqlPath = join(process.cwd(), "prisma", "init.sql");
    const sql = readFileSync(sqlPath, "utf-8");

    // Split into individual statements (separated by semicolons)
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

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
