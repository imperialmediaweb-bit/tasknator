import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const EMAIL_CONFIG_KEYS = [
  "SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS",
  "EMAIL_FROM", "EMAIL_PROVIDER",
];

// GET: Load email/SMTP config
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const configs = await db.systemConfig.findMany({
      where: { key: { in: EMAIL_CONFIG_KEYS } },
    });

    const data: Record<string, string> = {};
    for (const c of configs) data[c.key] = c.value;

    // Also return env status
    const envStatus: Record<string, boolean> = {};
    for (const key of EMAIL_CONFIG_KEYS) {
      envStatus[key] = !!process.env[key];
    }

    return NextResponse.json({ config: data, envStatus });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Save email/SMTP config
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Accept either single key/value or batch of key/values
    if (body.key && body.value !== undefined) {
      await db.systemConfig.upsert({
        where: { key: body.key },
        update: { value: String(body.value) },
        create: { key: body.key, value: String(body.value) },
      });
      return NextResponse.json({ ok: true });
    }

    // Batch save
    if (body.configs && typeof body.configs === "object") {
      for (const [key, value] of Object.entries(body.configs)) {
        if (EMAIL_CONFIG_KEYS.includes(key) && value) {
          await db.systemConfig.upsert({
            where: { key },
            update: { value: String(value) },
            create: { key, value: String(value) },
          });
        }
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST test email endpoint
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { to } = await req.json();
    if (!to) {
      return NextResponse.json({ error: "Recipient email required" }, { status: 400 });
    }

    // Dynamic import to get latest config
    const nodemailer = await import("nodemailer");

    // Load SMTP config from DB first, then fall back to env
    const configs = await db.systemConfig.findMany({
      where: { key: { in: EMAIL_CONFIG_KEYS } },
    });
    const dbConfig: Record<string, string> = {};
    for (const c of configs) dbConfig[c.key] = c.value;

    const getVal = (key: string) => dbConfig[key] || process.env[key] || "";

    const transporter = nodemailer.createTransport({
      host: getVal("SMTP_HOST") || "smtp.mailgun.org",
      port: parseInt(getVal("SMTP_PORT") || "587"),
      secure: getVal("SMTP_SECURE") === "true",
      auth: {
        user: getVal("SMTP_USER"),
        pass: getVal("SMTP_PASS"),
      },
    });

    await transporter.sendMail({
      from: getVal("EMAIL_FROM") || "Tasknator <noreply@tasknator.com>",
      to,
      subject: "Tasknator — Test Email",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
          <h1 style="color: #4f46e5; font-size: 24px;">Tasknator</h1>
          <p style="color: #374151;">This is a test email from your Tasknator platform.</p>
          <p style="color: #374151;">If you received this, your SMTP configuration is working correctly!</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Sent from Tasknator Admin Panel</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, message: "Test email sent successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to send test email" }, { status: 500 });
  }
}
