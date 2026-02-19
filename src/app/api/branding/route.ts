import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// Public API - returns site branding (logo, name, tagline)
// Prefers workspace-level white-label branding for logged-in Agency users
export async function GET(req: NextRequest) {
  try {
    // Try workspace-level branding first (for logged-in users with white-label)
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      const user = await db.user.findUnique({ where: { email: session.user.email } });
      if (user) {
        const membership = await db.membership.findFirst({
          where: { userId: user.id },
          include: { workspace: true },
        });

        if (membership?.workspace.whiteLabelEnabled && membership.workspace.customBrandName) {
          return NextResponse.json({
            siteName: membership.workspace.customBrandName,
            logoUrl: membership.workspace.logoUrl || "",
            tagline: "Business Diagnostics Platform",
            whiteLabel: true,
          });
        }
      }
    }

    // Fall back to global platform branding
    const configs = await db.systemConfig.findMany({
      where: { key: { in: ["SITE_NAME", "SITE_LOGO_URL", "SITE_TAGLINE"] } },
    });

    const data: Record<string, string> = {};
    for (const c of configs) data[c.key] = c.value;

    return NextResponse.json({
      siteName: data["SITE_NAME"] || "Tasknator",
      logoUrl: data["SITE_LOGO_URL"] || "",
      tagline: data["SITE_TAGLINE"] || "AI that fixes business bottlenecks",
      whiteLabel: false,
    });
  } catch {
    return NextResponse.json({
      siteName: "Tasknator",
      logoUrl: "",
      tagline: "AI that fixes business bottlenecks",
      whiteLabel: false,
    });
  }
}
