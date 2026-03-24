import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensure-schema";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const log: string[] = [];

  try {
    await db.$queryRaw`SELECT 1`;
    log.push("Database connection OK");
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    log.push(`Database connection FAILED: ${msg}`);
    return NextResponse.json({ log, status: "db_error" });
  }

  try {
    const ok = await ensureSchema();
    if (ok) {
      const userCount = await db.user.count();
      log.push(`Schema OK — ${userCount} users`);
    } else {
      log.push("Schema creation failed");
      return NextResponse.json({ log, status: "schema_error" });
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message?.slice(0, 200) : "Unknown error";
    log.push(`Schema error: ${msg}`);
    return NextResponse.json({ log, status: "schema_error" });
  }

  // Create admin from env vars if configured
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    try {
      const admin = await db.user.findUnique({ where: { email: adminEmail } });
      if (admin) {
        log.push(`Admin user exists (id: ${admin.id})`);
      } else {
        const hash = await bcrypt.hash(adminPassword, 12);
        const newAdmin = await db.user.create({
          data: {
            name: "Admin",
            email: adminEmail,
            passwordHash: hash,
            isAdmin: true,
          },
        });
        log.push(`Admin user created (id: ${newAdmin.id})`);

        try {
          const ws = await db.workspace.create({
            data: {
              name: "Admin Workspace",
              slug: "admin-workspace-" + Date.now(),
              plan: "AGENCY",
              memberships: { create: { userId: newAdmin.id, role: "OWNER" } },
              subscription: { create: { planTier: "AGENCY", status: "active" } },
            },
          });
          log.push(`Admin workspace created (id: ${ws.id})`);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : "Unknown error";
          log.push(`Workspace creation failed: ${msg}`);
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      log.push(`Admin creation failed: ${msg}`);
    }
  } else {
    log.push("Admin setup skipped — set ADMIN_EMAIL and ADMIN_PASSWORD env vars to enable");
  }

  // Check required tables
  const tables = ["SystemConfig", "BlogPost", "MenuItem", "CustomPage"];
  for (const table of tables) {
    try {
      const count = await (db as unknown as Record<string, { count: () => Promise<number> }>)[table.charAt(0).toLowerCase() + table.slice(1)].count();
      log.push(`${table} table OK (${count} rows)`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message?.slice(0, 100) : "Unknown error";
      log.push(`${table} table error: ${msg}`);
    }
  }

  return NextResponse.json({ log, status: "ok" });
}
