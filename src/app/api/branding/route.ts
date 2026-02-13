import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Public API - returns site branding (logo, name, tagline)
export async function GET() {
  try {
    const configs = await db.systemConfig.findMany({
      where: { key: { in: ["SITE_NAME", "SITE_LOGO_URL", "SITE_TAGLINE"] } },
    });

    const data: Record<string, string> = {};
    for (const c of configs) data[c.key] = c.value;

    return NextResponse.json({
      siteName: data["SITE_NAME"] || "Tasknator",
      logoUrl: data["SITE_LOGO_URL"] || "",
      tagline: data["SITE_TAGLINE"] || "AI that fixes business bottlenecks",
    });
  } catch {
    return NextResponse.json({
      siteName: "Tasknator",
      logoUrl: "",
      tagline: "AI that fixes business bottlenecks",
    });
  }
}
