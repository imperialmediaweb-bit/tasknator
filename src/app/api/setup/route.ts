import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureSchema } from "@/lib/ensure-schema";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET() {
  const log: string[] = [];

  // 1. Test database connection
  try {
    await db.$queryRaw`SELECT 1`;
    log.push("✅ Database connection OK");
  } catch (e: any) {
    log.push(`❌ Database connection FAILED: ${e.message}`);
    return NextResponse.json({ log, status: "db_error" });
  }

  // 2. Ensure schema exists (auto-creates tables from init.sql if missing)
  try {
    const ok = await ensureSchema();
    if (ok) {
      const userCount = await db.user.count();
      log.push(`✅ Schema OK — User table has ${userCount} users`);
    } else {
      log.push("❌ Schema creation failed");
      return NextResponse.json({ log, status: "schema_error" });
    }
  } catch (e: any) {
    log.push(`❌ Schema error: ${e.message?.slice(0, 200)}`);
    return NextResponse.json({ log, status: "schema_error" });
  }

  // 3. Create admin if missing
  try {
    const admin = await db.user.findUnique({ where: { email: "admin@tasknator.com" } });
    if (admin) {
      log.push(`✅ Admin user exists (id: ${admin.id}, isAdmin: ${admin.isAdmin})`);
    } else {
      log.push("⚠️ Admin user missing, creating...");
      const hash = await bcrypt.hash("admin1234", 12);
      const newAdmin = await db.user.create({
        data: {
          name: "Super Admin",
          email: "admin@tasknator.com",
          passwordHash: hash,
          isAdmin: true,
        },
      });
      log.push(`✅ Admin user created (id: ${newAdmin.id})`);

      // Create workspace
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
        log.push(`✅ Admin workspace created (id: ${ws.id})`);
      } catch (e: any) {
        log.push(`⚠️ Workspace creation failed: ${e.message}`);
      }
    }
  } catch (e: any) {
    log.push(`❌ Admin creation failed: ${e.message}`);
  }

  // 4. Create demo if missing
  try {
    const demo = await db.user.findUnique({ where: { email: "demo@tasknator.com" } });
    if (demo) {
      log.push(`✅ Demo user exists (id: ${demo.id})`);
    } else {
      log.push("⚠️ Demo user missing, creating...");
      const hash = await bcrypt.hash("demo1234", 12);
      const newDemo = await db.user.create({
        data: {
          name: "Demo User",
          email: "demo@tasknator.com",
          passwordHash: hash,
        },
      });
      log.push(`✅ Demo user created (id: ${newDemo.id})`);

      try {
        const ws = await db.workspace.create({
          data: {
            name: "Demo Workspace",
            slug: "demo-workspace-" + Date.now(),
            plan: "PRO",
            memberships: { create: { userId: newDemo.id, role: "OWNER" } },
            subscription: { create: { planTier: "PRO", status: "active" } },
          },
        });
        log.push(`✅ Demo workspace created (id: ${ws.id})`);
      } catch (e: any) {
        log.push(`⚠️ Demo workspace creation failed: ${e.message}`);
      }
    }
  } catch (e: any) {
    log.push(`❌ Demo creation failed: ${e.message}`);
  }

  // 5. Check new tables
  const tables = ["SystemConfig", "BlogPost", "MenuItem", "CustomPage"];
  for (const table of tables) {
    try {
      const count = await (db as any)[table.charAt(0).toLowerCase() + table.slice(1)].count();
      log.push(`✅ ${table} table OK (${count} rows)`);
    } catch (e: any) {
      log.push(`❌ ${table} table error: ${e.message?.slice(0, 100)}`);
    }
  }

  return NextResponse.json({ log, status: "ok" });
}
