import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const businessProfile = await db.businessProfile.findUnique({
      where: { id: params.id },
      include: { workspace: { include: { subscription: true } } },
    });

    if (!businessProfile) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Create audit run
    const auditRun = await db.auditRun.create({
      data: {
        businessProfileId: params.id,
        status: "QUEUED",
        progress: 0,
      },
    });

    // Update usage meter
    const month = new Date().toISOString().slice(0, 7);
    await db.usageMeter.upsert({
      where: { workspaceId_month: { workspaceId: businessProfile.workspaceId, month } },
      update: { auditsUsed: { increment: 1 } },
      create: { workspaceId: businessProfile.workspaceId, month, auditsUsed: 1 },
    });

    // Create job record
    await db.jobRecord.create({
      data: {
        type: "audit",
        refId: auditRun.id,
        status: "queued",
      },
    });

    // In production, this would enqueue to BullMQ:
    // await enqueueAudit({ auditRunId: auditRun.id, businessProfileId: params.id, workspaceId: businessProfile.workspaceId });
    
    // For MVP, run inline (simulate async processing)
    processAuditInline(auditRun.id, businessProfile).catch(console.error);

    return NextResponse.json({ auditRunId: auditRun.id, status: "QUEUED" }, { status: 201 });
  } catch (error: any) {
    console.error("Start audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processAuditInline(auditRunId: string, businessProfile: any) {
  try {
    await db.auditRun.update({
      where: { id: auditRunId },
      data: { status: "RUNNING", startedAt: new Date(), progress: 10 },
    });

    // Try to get AI provider
    const providerKey = await db.providerKey.findFirst({
      where: { workspaceId: businessProfile.workspaceId, isActive: true },
    });

    let aiResponse: any;
    
    if (providerKey || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY) {
      // Use AI provider
      const { createProvider, generateWithFallback } = await import("@/lib/ai/provider");
      const { decrypt } = await import("@/lib/crypto");
      const { AUDIT_SYSTEM_PROMPT, buildAuditPrompt } = await import("@/lib/ai/prompts");

      const providers: { type: any; apiKey: string }[] = [];
      
      if (providerKey) {
        const decryptedKey = await decrypt(providerKey.encryptedKey, providerKey.nonce);
        providers.push({ type: providerKey.provider, apiKey: decryptedKey });
      }
      if (process.env.ANTHROPIC_API_KEY) providers.push({ type: "ANTHROPIC", apiKey: process.env.ANTHROPIC_API_KEY });
      if (process.env.OPENAI_API_KEY) providers.push({ type: "OPENAI", apiKey: process.env.OPENAI_API_KEY });
      if (process.env.GEMINI_API_KEY) providers.push({ type: "GEMINI", apiKey: process.env.GEMINI_API_KEY });

      await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 30 } });

      const response = await generateWithFallback(providers, {
        messages: [
          { role: "system", content: AUDIT_SYSTEM_PROMPT },
          { role: "user", content: buildAuditPrompt(businessProfile) },
        ],
        maxTokens: 4096,
        temperature: 0.3,
      });

      await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 70 } });

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      }
    }

    if (!aiResponse) {
      // Fallback: generate template-based audit
      aiResponse = generateTemplateAudit(businessProfile);
    }

    // Save findings
    await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 85 } });

    for (const finding of aiResponse.findings || []) {
      await db.auditFinding.create({
        data: {
          auditRunId,
          category: finding.category,
          title: finding.title,
          detail: finding.detail,
          severity: finding.severity,
          fixable: finding.fixable ?? true,
        },
      });
    }

    // Complete audit
    await db.auditRun.update({
      where: { id: auditRunId },
      data: {
        status: "COMPLETED",
        progress: 100,
        overallScore: aiResponse.overallScore || 50,
        websiteScore: aiResponse.websiteScore,
        seoScore: aiResponse.seoScore,
        socialScore: aiResponse.socialScore,
        offerScore: aiResponse.offerScore,
        reputationScore: aiResponse.reputationScore,
        localScore: aiResponse.localScore,
        rootCauseSummary: aiResponse.rootCauseSummary,
        rawResponse: JSON.stringify(aiResponse),
        finishedAt: new Date(),
      },
    });

    await db.jobRecord.updateMany({
      where: { refId: auditRunId },
      data: { status: "completed", progress: 100, finishedAt: new Date() },
    });
  } catch (error: any) {
    console.error("Audit processing error:", error);
    await db.auditRun.update({
      where: { id: auditRunId },
      data: { status: "FAILED", progress: 0 },
    });
    await db.jobRecord.updateMany({
      where: { refId: auditRunId },
      data: { status: "failed", error: error.message },
    });
  }
}

function generateTemplateAudit(business: any) {
  const hasWebsite = !!business.websiteUrl;
  const hasSocial = !!(business.facebookUrl || business.instagramUrl);
  const hasGBP = !!business.googleBusinessUrl;

  return {
    overallScore: 42,
    websiteScore: hasWebsite ? 45 : 20,
    seoScore: 30,
    socialScore: hasSocial ? 50 : 25,
    offerScore: 40,
    reputationScore: hasGBP ? 45 : 30,
    localScore: hasGBP ? 50 : 20,
    rootCauseSummary: `Based on available data for ${business.name} (${business.industry}), the business appears to have significant gaps in online presence and marketing optimization. ${business.mainPain ? `The reported pain point of "${business.mainPain.replace(/_/g, " ").toLowerCase()}" aligns with common issues in this industry.` : ""} A comprehensive approach to digital presence, offer structure, and customer acquisition is recommended. Note: This assessment is based on limited data and uses industry best-practice assumptions where specific data was unavailable.`,
    findings: [
      { category: "website", title: "Website optimization needed", detail: hasWebsite ? "Website exists but likely needs CTA optimization, faster load times, and mobile responsiveness improvements based on industry benchmarks." : "No website URL provided. A professional website is critical for credibility and lead generation.", severity: hasWebsite ? "HIGH" : "CRITICAL", fixable: true },
      { category: "website", title: "Missing or weak calls-to-action", detail: "Most business websites lack clear, compelling CTAs above the fold. Ensure every page has a primary action (call, book, buy).", severity: "HIGH", fixable: true },
      { category: "seo", title: "SEO foundations likely missing", detail: "Based on industry averages, businesses in this category typically lack proper meta tags, schema markup, and optimized content. A full SEO audit is recommended. (Assumption - based on industry data)", severity: "HIGH", fixable: true },
      { category: "seo", title: "Local SEO optimization needed", detail: "Ensure NAP (Name, Address, Phone) consistency across all directories. Add location-specific keywords to content.", severity: "MEDIUM", fixable: true },
      { category: "social", title: hasSocial ? "Social presence exists but needs optimization" : "Weak social media presence", detail: hasSocial ? "Social profiles exist but likely need consistent posting schedule, engagement strategy, and content calendar." : "Limited social media presence detected. Social proof is critical for modern businesses.", severity: hasSocial ? "MEDIUM" : "HIGH", fixable: true },
      { category: "offer", title: "Offer structure review needed", detail: "Consider implementing a tiered pricing model (Basic/Standard/Premium) to capture different customer segments and increase average order value.", severity: "MEDIUM", fixable: true },
      { category: "offer", title: "Value proposition unclear", detail: "Ensure your unique selling proposition is prominently displayed and differentiates you from competitors.", severity: "HIGH", fixable: true },
      { category: "reputation", title: hasGBP ? "Google Business Profile needs attention" : "No Google Business Profile", detail: hasGBP ? "Maintain active GBP with regular posts, photos, and prompt review responses." : "Google Business Profile is essential for local businesses. Set up and optimize immediately.", severity: hasGBP ? "MEDIUM" : "CRITICAL", fixable: true },
      { category: "reputation", title: "Review generation strategy missing", detail: "Implement a systematic approach to asking satisfied customers for reviews. Use follow-up emails and SMS.", severity: "MEDIUM", fixable: true },
      { category: "local", title: "Local directory presence", detail: "Ensure business is listed on major directories (Yelp, Yellow Pages, industry-specific directories) with consistent information.", severity: "LOW", fixable: true },
    ],
  };
}
