import { db } from "@/lib/db";

export interface SiteBranding {
  siteName: string;
  logoUrl: string;
  tagline: string;
  whiteLabel?: boolean;
}

export async function getSiteBranding(workspaceId?: string): Promise<SiteBranding> {
  try {
    // Check workspace-level branding if workspaceId provided
    if (workspaceId) {
      const workspace = await db.workspace.findUnique({ where: { id: workspaceId } });
      if (workspace?.whiteLabelEnabled && workspace.customBrandName) {
        return {
          siteName: workspace.customBrandName,
          logoUrl: workspace.logoUrl || "",
          tagline: "Business Diagnostics Platform",
          whiteLabel: true,
        };
      }
    }

    // Fall back to global platform branding
    const configs = await db.systemConfig.findMany({
      where: { key: { in: ["SITE_NAME", "SITE_LOGO_URL", "SITE_TAGLINE"] } },
    });

    const data: Record<string, string> = {};
    for (const c of configs) data[c.key] = c.value;

    return {
      siteName: data["SITE_NAME"] || "Tasknator",
      logoUrl: data["SITE_LOGO_URL"] || "",
      tagline: data["SITE_TAGLINE"] || "AI that fixes business bottlenecks",
      whiteLabel: false,
    };
  } catch {
    return {
      siteName: "Tasknator",
      logoUrl: "",
      tagline: "AI that fixes business bottlenecks",
      whiteLabel: false,
    };
  }
}
