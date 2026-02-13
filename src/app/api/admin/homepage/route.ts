import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// GET: Load homepage sections config
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const keys = [
      "HOMEPAGE_HERO_TITLE", "HOMEPAGE_HERO_SUBTITLE", "HOMEPAGE_HERO_CTA",
      "HOMEPAGE_STATS_ENABLED", "HOMEPAGE_FEATURES_ENABLED",
      "HOMEPAGE_TESTIMONIALS_ENABLED", "HOMEPAGE_PRICING_ENABLED",
      "HOMEPAGE_FAQ_ENABLED", "HOMEPAGE_NEWSLETTER_ENABLED",
    ];

    const configs = await db.systemConfig.findMany({
      where: { key: { in: keys } },
    });

    const data: Record<string, string> = {};
    for (const c of configs) data[c.key] = c.value;

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Save homepage sections config
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: "key and value required" }, { status: 400 });
    }

    await db.systemConfig.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
