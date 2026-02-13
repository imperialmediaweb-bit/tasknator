import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function isAdmin(email: string) {
  const user = await db.user.findUnique({ where: { email }, select: { isAdmin: true } });
  return user?.isAdmin === true;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const configs = await db.systemConfig.findMany();
    const configMap: Record<string, string> = {};
    for (const c of configs) {
      // Return masked values for API keys
      if (c.key.includes("KEY") || c.key.includes("SECRET")) {
        configMap[c.key] = c.value ? `••••••••${c.value.slice(-4)}` : "";
      } else {
        configMap[c.key] = c.value;
      }
    }

    // Also report which env vars are set (as fallback info)
    const envStatus: Record<string, boolean> = {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
    };

    return NextResponse.json({ config: configMap, envStatus });
  } catch (error) {
    console.error("Admin config GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { key, value } = await req.json();
    if (!key || typeof value !== "string") {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    // Allowed config keys
    const allowedKeys = [
      "ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY",
      "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET",
      "NEXTAUTH_SECRET", "NEXTAUTH_URL",
      "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
      "PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_WEBHOOK_ID",
    ];

    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "Invalid config key" }, { status: 400 });
    }

    await db.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin config POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
