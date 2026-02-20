import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AssetType } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // id here is the auditRunId
    const auditRun = await db.auditRun.findUnique({
      where: { id: params.id },
      include: {
        findings: true,
        businessProfile: { include: { workspace: true } },
      },
    });

    if (!auditRun || auditRun.status !== "COMPLETED") {
      return NextResponse.json({ error: "Audit not found or not completed" }, { status: 404 });
    }

    const biz = auditRun.businessProfile;

    // Create repair plan
    const repairPlan = await db.repairPlan.create({
      data: {
        businessProfileId: biz.id,
        title: `Recovery Plan for ${biz.name}`,
        summary: `Based on the diagnostic audit (score: ${auditRun.overallScore}/100), this 30/60/90-day plan addresses the identified issues for ${biz.name} (${biz.industry}).`,
      },
    });

    // Generate plan tasks from findings
    const criticalFindings = auditRun.findings.filter(f => f.severity === "CRITICAL" || f.severity === "HIGH");
    const mediumFindings = auditRun.findings.filter(f => f.severity === "MEDIUM");
    const lowFindings = auditRun.findings.filter(f => f.severity === "LOW" || f.severity === "INFO");

    let sortOrder = 0;

    // Day 30 tasks from critical findings
    for (const finding of criticalFindings) {
      await db.planTask.create({
        data: {
          repairPlanId: repairPlan.id,
          phase: "DAY_30",
          title: `Fix: ${finding.title}`,
          description: finding.detail,
          impact: "high",
          timeEstimate: "2-4 hours",
          sortOrder: sortOrder++,
        },
      });
    }

    // Day 60 tasks from medium findings
    for (const finding of mediumFindings) {
      await db.planTask.create({
        data: {
          repairPlanId: repairPlan.id,
          phase: "DAY_60",
          title: `Improve: ${finding.title}`,
          description: finding.detail,
          impact: "medium",
          timeEstimate: "1-3 hours",
          sortOrder: sortOrder++,
        },
      });
    }

    // Day 90 tasks from low findings
    for (const finding of lowFindings) {
      await db.planTask.create({
        data: {
          repairPlanId: repairPlan.id,
          phase: "DAY_90",
          title: `Optimize: ${finding.title}`,
          description: finding.detail,
          impact: "low",
          timeEstimate: "1-2 hours",
          sortOrder: sortOrder++,
        },
      });
    }

    // Generate task-linked assets with KPI based on finding categories
    const categories = Array.from(new Set(auditRun.findings.map((f) => f.category)));
    const taskAssetMap: Record<string, { type: AssetType; title: string; kpi: string }[]> = {
      website: [
        { type: "WEBSITE_COPY", title: "Website Copy & CTAs", kpi: "Bounce rate < 40%" },
      ],
      seo: [
        { type: "SEO_PLAN", title: "SEO Strategy & Content Plan", kpi: "Organic traffic +20% in 60 days" },
      ],
      social: [
        { type: "AD_COPY", title: "Social Media Ad Copy", kpi: "CTR > 2%" },
        { type: "SOCIAL_CAPTIONS", title: "Social Media Captions & Calendar", kpi: "Engagement rate > 5%" },
        { type: "HOOK_SCRIPTS", title: "Video Hook Scripts", kpi: "Hook rate > 50%" },
        { type: "UGC_SCRIPTS", title: "UGC Video Scripts", kpi: "Video CTR > 3%" },
      ],
      offer: [
        { type: "OFFER_PACKAGES", title: "Offer & Pricing Packages", kpi: "Conversion rate +15%" },
        { type: "SALES_SCRIPTS", title: "Sales Scripts & Objection Handling", kpi: "Close rate +20%" },
        { type: "CREATIVE_BRIEF", title: "Ad Campaign Creative Brief", kpi: "ROAS > 3x" },
      ],
      reputation: [
        { type: "REVIEW_REPLIES", title: "Review Response Templates", kpi: "Response rate 100% within 24h" },
      ],
      local: [
        { type: "EMAIL_SEQUENCE", title: "Customer Outreach Emails", kpi: "Open rate > 25%" },
      ],
    };

    // Find tasks for linking
    const allTasks = await db.planTask.findMany({
      where: { repairPlanId: repairPlan.id },
      orderBy: { sortOrder: "asc" },
    });

    const createdAssetTypes = new Set<string>();

    for (const cat of categories) {
      const assetDefs = taskAssetMap[cat];
      if (!assetDefs) continue;

      // Find the first task related to this category
      const relatedTask = allTasks.find((t) => {
        const relatedFinding = auditRun.findings.find(
          (f) => f.category === cat && (t.title.includes(f.title) || t.description.includes(f.title))
        );
        return !!relatedFinding;
      }) || allTasks.find((t) => {
        // Fallback: find any task from a finding in this category
        return auditRun.findings.some(
          (f) => f.category === cat && t.description.includes(f.detail?.substring(0, 50) || "")
        );
      });

      for (const assetDef of assetDefs) {
        if (createdAssetTypes.has(assetDef.type)) continue;
        createdAssetTypes.add(assetDef.type);

        await db.asset.create({
          data: {
            repairPlanId: repairPlan.id,
            taskId: relatedTask?.id || null,
            type: assetDef.type,
            title: `${assetDef.title} for ${biz.name}`,
            kpi: assetDef.kpi,
            content: `[Asset pending generation] Click "Regenerate" to generate AI-powered ${assetDef.title.toLowerCase()} for ${biz.name}.\n\nThis asset was created based on your ${cat} audit findings. Use the Regenerate button above to fill it with AI-generated content, or write your own content here.\n\nKPI Target: ${assetDef.kpi}`,
          },
        });
      }
    }

    return NextResponse.json({ repairPlanId: repairPlan.id }, { status: 201 });
  } catch (error: any) {
    console.error("Generate plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
