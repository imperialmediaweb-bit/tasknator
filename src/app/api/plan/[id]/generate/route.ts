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

    // Deployment task definitions per asset type — each asset gets a "publish/test" task
    const deployTaskMap: Record<string, { action: string; phase: "DAY_30" | "DAY_60" | "DAY_90"; steps: string }> = {
      HOOK_SCRIPTS: {
        action: "Publish & A/B test hook scripts on TikTok/Reels/Shorts",
        phase: "DAY_30",
        steps: "1. Select top 3 hooks from generated list\n2. Film each hook (< 3s setup)\n3. Post on TikTok, Instagram Reels, YouTube Shorts\n4. Track hook rate (% viewers who watch past 3s)\n5. Double down on best performer after 48h",
      },
      UGC_SCRIPTS: {
        action: "Film & publish UGC video scripts",
        phase: "DAY_30",
        steps: "1. Brief talent/creator with the generated script\n2. Film 30s, 60s, and 90s versions\n3. Edit with captions + b-roll\n4. Post organic + test as paid creative\n5. Measure CTR and conversion rate per version",
      },
      SOCIAL_CAPTIONS: {
        action: "Schedule & publish social media captions",
        phase: "DAY_30",
        steps: "1. Review the 20 generated captions\n2. Match each to a visual/photo/video\n3. Schedule using Meta Business Suite or Buffer\n4. Post 5x/week for 4 weeks\n5. Track engagement rate (likes + comments + shares / reach)",
      },
      CREATIVE_BRIEF: {
        action: "Launch ad campaign from creative brief",
        phase: "DAY_60",
        steps: "1. Share brief with designer/agency\n2. Produce 3 ad concepts from the brief\n3. Set up Meta & Google campaigns\n4. Launch A/B test with $50-100/day budget\n5. Optimize for ROAS weekly, kill underperformers at day 7",
      },
      AD_COPY: {
        action: "Launch & test ad copy variations",
        phase: "DAY_30",
        steps: "1. Set up 3 Meta ad sets with each copy variation\n2. Add 10 target keywords to Google Search campaign\n3. Run for 7 days minimum before judging\n4. Compare CTR across variations\n5. Scale winner, pause losers",
      },
      WEBSITE_COPY: {
        action: "Deploy website copy & CTAs",
        phase: "DAY_30",
        steps: "1. Replace hero section with generated copy\n2. Update About, Services, FAQ sections\n3. Add meta title + description to all pages\n4. Set up heatmap tracking (Hotjar/MS Clarity)\n5. Compare bounce rate before/after at day 14",
      },
      SEO_PLAN: {
        action: "Execute SEO content plan",
        phase: "DAY_60",
        steps: "1. Publish first 4 blog articles from the plan\n2. Implement internal linking suggestions\n3. Complete on-page SEO checklist items\n4. Submit updated sitemap to Google Search Console\n5. Track organic traffic weekly in GA4",
      },
      EMAIL_SEQUENCE: {
        action: "Set up & activate email sequence",
        phase: "DAY_30",
        steps: "1. Import sequence into email tool (Mailchimp/ActiveCampaign)\n2. Set up automation trigger\n3. Test with internal email first\n4. Activate for new leads\n5. Monitor open rate + click rate after 100 sends",
      },
      SALES_SCRIPTS: {
        action: "Train team on sales scripts & test",
        phase: "DAY_30",
        steps: "1. Share scripts with sales team/owner\n2. Role-play objection handling scenarios\n3. Use WhatsApp sequence for next 20 leads\n4. Track close rate before/after\n5. Refine scripts based on real objections heard",
      },
      OFFER_PACKAGES: {
        action: "Launch pricing packages & test conversion",
        phase: "DAY_60",
        steps: "1. Update pricing page with 3-tier packages\n2. Create comparison table\n3. Add upsell prompts at checkout\n4. Run for 30 days\n5. Compare conversion rate vs old pricing",
      },
      REVIEW_REPLIES: {
        action: "Deploy review reply templates & request reviews",
        phase: "DAY_30",
        steps: "1. Reply to all pending Google/Yelp reviews using templates\n2. Set up automated review request after service\n3. Respond to new reviews within 24h\n4. Track review count growth weekly\n5. Goal: 100% response rate + 2 new reviews/week",
      },
      WINBACK_MESSAGES: {
        action: "Launch win-back campaign to inactive clients",
        phase: "DAY_60",
        steps: "1. Export list of clients inactive 60+ days\n2. Send email sequence with special offer\n3. Follow up with SMS for non-openers\n4. Track reactivation rate\n5. Goal: recover 10-15% of dormant clients",
      },
      COST_CHECKLIST: {
        action: "Audit costs & implement savings",
        phase: "DAY_90",
        steps: "1. Review each of the 15 cost areas\n2. Get quotes for alternatives on top 5 items\n3. Negotiate or switch providers\n4. Track monthly savings\n5. Reinvest savings into marketing budget",
      },
    };

    for (const cat of categories) {
      const assetDefs = taskAssetMap[cat];
      if (!assetDefs) continue;

      for (const assetDef of assetDefs) {
        if (createdAssetTypes.has(assetDef.type)) continue;
        createdAssetTypes.add(assetDef.type);

        // Create a dedicated "publish/test" task for this asset
        const deployInfo = deployTaskMap[assetDef.type];
        const deployPhase = deployInfo?.phase || "DAY_60";
        const deployTask = await db.planTask.create({
          data: {
            repairPlanId: repairPlan.id,
            phase: deployPhase,
            title: deployInfo?.action || `Publish & test: ${assetDef.title}`,
            description: `Deploy the generated "${assetDef.title}" asset and measure results.\n\nKPI Target: ${assetDef.kpi}\n\nSteps:\n${deployInfo?.steps || "1. Review generated content\n2. Customize for your brand\n3. Deploy/publish\n4. Track KPI for 14 days\n5. Iterate based on results"}`,
            impact: "high",
            timeEstimate: "2-4 hours",
            sortOrder: sortOrder++,
          },
        });

        // Create the asset linked to its deploy task
        await db.asset.create({
          data: {
            repairPlanId: repairPlan.id,
            taskId: deployTask.id,
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
