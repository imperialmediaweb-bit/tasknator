import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateWithFallback } from "@/lib/ai/provider";
import { ASSET_SYSTEM_PROMPT, buildAssetPrompt } from "@/lib/ai/prompts";
import { decrypt } from "@/lib/crypto";
import { canAccessModule } from "@/lib/billing/plans";
import { PlanTier } from "@prisma/client";

function jsonToMarkdown(obj: any, depth = 0): string {
  if (typeof obj === "string") return obj;
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    return obj
      .map((item) => {
        if (typeof item === "string") return `- ${item}`;
        if (typeof item === "object" && item !== null) return jsonToMarkdown(item, depth);
        return `- ${String(item)}`;
      })
      .join("\n");
  }
  if (typeof obj === "object" && obj !== null) {
    return Object.entries(obj)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^\w/, (c) => c.toUpperCase()).trim();
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return `**${label}:** ${value}`;
        }
        if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
          return `**${label}:**\n${value.map((v) => `- ${v}`).join("\n")}`;
        }
        const heading = depth === 0 ? `## ${label}` : `### ${label}`;
        return `${heading}\n\n${jsonToMarkdown(value, depth + 1)}`;
      })
      .join("\n\n");
  }
  return String(obj);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const asset = await db.asset.findUnique({
      where: { id: params.id },
      include: {
        repairPlan: {
          include: {
            businessProfile: {
              include: { workspace: true },
            },
          },
        },
        task: true,
        versions: { orderBy: { version: "desc" }, take: 1 },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const biz = asset.repairPlan.businessProfile;
    const workspaceId = biz.workspaceId;

    // Module access check
    const ASSET_MODULE_MAP: Record<string, string> = {
      OFFER_PACKAGES: "SALES_DOCTOR",
      SALES_SCRIPTS: "SALES_DOCTOR",
      REVIEW_REPLIES: "REPUTATION_FIXER",
      WINBACK_MESSAGES: "CLIENT_RECOVERY",
      AD_COPY: "ADS_REPAIR",
      SEO_PLAN: "SEO_PLANNER",
      COST_CHECKLIST: "COST_CUTTER",
    };
    const requiredModule = ASSET_MODULE_MAP[asset.type];
    if (requiredModule) {
      const plan = biz.workspace.plan as PlanTier;
      if (!canAccessModule(plan, requiredModule)) {
        return NextResponse.json(
          { error: `Your plan does not include the ${requiredModule.replace(/_/g, " ")} module. Please upgrade.` },
          { status: 403 }
        );
      }
    }

    // Save current as version
    const nextVersion = (asset.versions[0]?.version ?? 0) + 1;
    await db.assetVersion.create({
      data: {
        assetId: asset.id,
        content: asset.content,
        version: nextVersion,
        createdBy: "ai-regeneration",
      },
    });

    // Get providers — check workspace keys, SystemConfig DB keys, and env vars
    const providerKeys = await db.providerKey.findMany({
      where: { workspaceId, isActive: true },
    });

    const providers: { type: any; apiKey: string }[] = [];
    for (const pk of providerKeys) {
      try {
        const apiKey = await decrypt(pk.encryptedKey, pk.nonce);
        providers.push({ type: pk.provider, apiKey });
      } catch (decryptErr: any) {
        console.error("Failed to decrypt workspace provider key:", decryptErr.message);
      }
    }

    // Also check SystemConfig table (platform-level keys stored in DB)
    const platformConfigs = await db.systemConfig.findMany({
      where: { key: { in: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"] } },
    });
    const dbKeys: Record<string, string> = {};
    for (const c of platformConfigs) dbKeys[c.key] = c.value;

    const getKey = (name: string) => dbKeys[name] || process.env[name] || "";

    if (getKey("ANTHROPIC_API_KEY")) providers.push({ type: "ANTHROPIC", apiKey: getKey("ANTHROPIC_API_KEY") });
    if (getKey("OPENAI_API_KEY")) providers.push({ type: "OPENAI", apiKey: getKey("OPENAI_API_KEY") });
    if (getKey("GEMINI_API_KEY")) providers.push({ type: "GEMINI", apiKey: getKey("GEMINI_API_KEY") });

    if (providers.length === 0) {
      return NextResponse.json({ error: "No AI providers configured. Please add an API key in Settings → AI Keys." }, { status: 400 });
    }

    const context = `Root cause: ${asset.repairPlan.summary || "N/A"}. Business: ${biz.description || biz.industry}`;

    const taskInfo = asset.task
      ? { title: asset.task.title, description: asset.task.description, phase: asset.task.phase }
      : undefined;

    const response = await generateWithFallback(providers, {
      messages: [
        { role: "system", content: ASSET_SYSTEM_PROMPT },
        { role: "user", content: buildAssetPrompt(asset.type, biz.name, biz.industry, context, taskInfo) },
      ],
      maxTokens: 4096,
      temperature: 0.7,
    });

    // Post-process: strip code fences and convert JSON to readable text if AI ignored instructions
    let cleanContent = response.trim();
    // Remove ```json ... ``` or ``` ... ``` wrappers
    cleanContent = cleanContent.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
    // If the response is still JSON, convert it to readable markdown
    try {
      const parsed = JSON.parse(cleanContent);
      cleanContent = jsonToMarkdown(parsed);
    } catch {
      // Not JSON — good, use as-is
    }

    // Update asset with new content
    const updated = await db.asset.update({
      where: { id: params.id },
      data: { content: cleanContent },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Regenerate asset error:", error);
    return NextResponse.json({ error: "Failed to regenerate" }, { status: 500 });
  }
}
