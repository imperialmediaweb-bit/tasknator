import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateWithFallback } from "@/lib/ai/provider";
import { ASSET_SYSTEM_PROMPT, buildAssetPrompt } from "@/lib/ai/prompts";
import { decrypt } from "@/lib/crypto";
import { canAccessModule } from "@/lib/billing/plans";
import { PlanTier } from "@prisma/client";

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

    // Get providers
    const providerKeys = await db.providerKey.findMany({
      where: { workspaceId, isActive: true },
    });

    const providers: { type: any; apiKey: string }[] = [];
    for (const pk of providerKeys) {
      const apiKey = await decrypt(pk.encryptedKey, pk.nonce);
      providers.push({ type: pk.provider, apiKey });
    }
    if (process.env.ANTHROPIC_API_KEY) providers.push({ type: "ANTHROPIC", apiKey: process.env.ANTHROPIC_API_KEY });
    if (process.env.OPENAI_API_KEY) providers.push({ type: "OPENAI", apiKey: process.env.OPENAI_API_KEY });

    if (providers.length === 0) {
      return NextResponse.json({ error: "No AI providers configured" }, { status: 400 });
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

    // Update asset with new content
    const updated = await db.asset.update({
      where: { id: params.id },
      data: { content: response },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Regenerate asset error:", error);
    return NextResponse.json({ error: "Failed to regenerate" }, { status: 500 });
  }
}
