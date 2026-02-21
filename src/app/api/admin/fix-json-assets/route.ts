import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

function jsonToMarkdown(obj: any, depth = 0): string {
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    return obj
      .map((item, i) => {
        if (typeof item === "string") return `- ${item}`;
        if (typeof item === "object" && item !== null) {
          const md = jsonToMarkdown(item, depth + 1);
          return md;
        }
        return `- ${String(item)}`;
      })
      .join("\n\n---\n\n");
  }
  if (typeof obj === "object" && obj !== null) {
    return Object.entries(obj)
      .map(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/[_-]/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase())
          .trim();
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return `**${label}:** ${value}`;
        }
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
          return `**${label}:**\n${value.map((v) => `- ${v}`).join("\n")}`;
        }
        const heading = depth === 0 ? `## ${label}` : depth === 1 ? `### ${label}` : `**${label}**`;
        return `${heading}\n\n${jsonToMarkdown(value, depth + 1)}`;
      })
      .join("\n\n");
  }
  return String(obj);
}

function convertJsonContent(raw: string): string | null {
  const trimmed = raw.trim();
  // Strip code fences
  let cleaned = trimmed
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "");
  cleaned = cleaned.trim();

  if (
    (cleaned.startsWith("{") && cleaned.endsWith("}")) ||
    (cleaned.startsWith("[") && cleaned.endsWith("]"))
  ) {
    try {
      const parsed = JSON.parse(cleaned);
      return jsonToMarkdown(parsed);
    } catch {
      return null;
    }
  }
  return null;
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assets = await db.asset.findMany({
      select: { id: true, content: true, title: true },
    });

    let fixed = 0;
    const fixedAssets: string[] = [];

    for (const asset of assets) {
      const converted = convertJsonContent(asset.content);
      if (converted) {
        await db.asset.update({
          where: { id: asset.id },
          data: { content: converted },
        });
        fixed++;
        fixedAssets.push(asset.title);
      }
    }

    // Also fix asset versions that contain JSON
    const versions = await db.assetVersion.findMany({
      select: { id: true, content: true },
    });

    let fixedVersions = 0;
    for (const version of versions) {
      const converted = convertJsonContent(version.content);
      if (converted) {
        await db.assetVersion.update({
          where: { id: version.id },
          data: { content: converted },
        });
        fixedVersions++;
      }
    }

    return NextResponse.json({
      message: `Fixed ${fixed} assets and ${fixedVersions} versions`,
      fixedAssets,
    });
  } catch (error: any) {
    console.error("Fix JSON assets error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
