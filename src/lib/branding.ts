import { db } from "@/lib/db";

export interface SiteBranding {
  siteName: string;
  logoUrl: string;
  tagline: string;
}

export async function getSiteBranding(): Promise<SiteBranding> {
  try {
    const configs = await db.systemConfig.findMany({
      where: { key: { in: ["SITE_NAME", "SITE_LOGO_URL", "SITE_TAGLINE"] } },
    });

    const data: Record<string, string> = {};
    for (const c of configs) data[c.key] = c.value;

    return {
      siteName: data["SITE_NAME"] || "Tasknator",
      logoUrl: data["SITE_LOGO_URL"] || "",
      tagline: data["SITE_TAGLINE"] || "AI that fixes business bottlenecks",
    };
  } catch {
    return {
      siteName: "Tasknator",
      logoUrl: "",
      tagline: "AI that fixes business bottlenecks",
    };
  }
}
