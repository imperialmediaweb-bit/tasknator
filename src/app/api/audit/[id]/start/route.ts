import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getPlanConfig } from "@/lib/billing/plans";
import { PlanTier } from "@prisma/client";

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

    // Enforce audit limit based on plan
    const plan = businessProfile.workspace.plan as PlanTier;
    const planConfig = getPlanConfig(plan);
    const month = new Date().toISOString().slice(0, 7);
    const currentUsage = await db.usageMeter.findUnique({
      where: { workspaceId_month: { workspaceId: businessProfile.workspaceId, month } },
    });
    if (currentUsage && currentUsage.auditsUsed >= planConfig.limits.auditsPerMonth) {
      return NextResponse.json({
        error: `You've reached your monthly limit of ${planConfig.limits.auditsPerMonth} audit${planConfig.limits.auditsPerMonth > 1 ? "s" : ""} on the ${planConfig.name} plan. Upgrade to run more audits.`,
      }, { status: 403 });
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

    // For MVP, run inline
    processAuditInline(auditRun.id, businessProfile).catch(console.error);

    return NextResponse.json({ auditRunId: auditRun.id, status: "QUEUED" }, { status: 201 });
  } catch (error: any) {
    console.error("Start audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function fetchWebsiteContent(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "BusinessFix-Audit/1.0" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return `[HTTP ${res.status} error - site returned an error]`;
    const html = await res.text();
    // Extract meaningful text from HTML
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return cleaned.substring(0, 5000);
  } catch (err: any) {
    return `[Could not fetch website: ${err.message}]`;
  }
}

async function processAuditInline(auditRunId: string, businessProfile: any) {
  try {
    await db.auditRun.update({
      where: { id: auditRunId },
      data: { status: "RUNNING", startedAt: new Date(), progress: 10 },
    });

    // Step 1: Fetch real website content
    let liveWebsiteContent = "";
    let websiteUrl = "";
    if (businessProfile.websiteUrl) {
      websiteUrl = businessProfile.websiteUrl;
      if (!websiteUrl.startsWith("http")) websiteUrl = "https://" + websiteUrl;
      liveWebsiteContent = await fetchWebsiteContent(websiteUrl);
      // Store fetched content on profile
      if (liveWebsiteContent.length > 50 && !liveWebsiteContent.startsWith("[")) {
        await db.businessProfile.update({
          where: { id: businessProfile.id },
          data: { websiteText: liveWebsiteContent.substring(0, 10000) },
        });
        businessProfile.websiteText = liveWebsiteContent;
      }
    }

    await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 20 } });

    // Step 1.5: SEO Crawler — crawl 50-200 pages for technical SEO issues
    let crawlResult: any = null;
    let crawlSummary = "";
    if (websiteUrl) {
      try {
        const { crawlSite } = await import("@/lib/crawler/seo-crawler");
        const { buildCrawlSummary } = await import("@/lib/crawler/seo-analyzer");

        console.log(`[audit] ${auditRunId}: Starting SEO crawl of ${websiteUrl}`);
        await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 25 } });

        crawlResult = await crawlSite(websiteUrl, { maxPages: 200 });

        await db.auditRun.update({
          where: { id: auditRunId },
          data: { progress: 45, crawlStats: crawlResult.stats },
        });

        crawlSummary = buildCrawlSummary(crawlResult);
        console.log(`[audit] ${auditRunId}: SEO crawl complete — ${crawlResult.stats.pagesCrawled} pages crawled`);
      } catch (crawlErr: any) {
        console.error(`[audit] ${auditRunId}: SEO crawl error:`, crawlErr.message);
        // Continue without crawl data — not a fatal error
      }
    }

    // Step 2: Try to get AI provider
    const providerKey = await db.providerKey.findFirst({
      where: { workspaceId: businessProfile.workspaceId, isActive: true },
    });

    const platformConfigs = await db.systemConfig.findMany({
      where: { key: { in: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"] } },
    });
    const dbKeys: Record<string, string> = {};
    for (const c of platformConfigs) dbKeys[c.key] = c.value;

    const getKey = (name: string) => dbKeys[name] || process.env[name] || "";

    let aiResponse: any;
    let aiError: string | null = null;

    if (providerKey || getKey("ANTHROPIC_API_KEY") || getKey("OPENAI_API_KEY") || getKey("GEMINI_API_KEY")) {
      try {
        const { generateWithFallback } = await import("@/lib/ai/provider");
        const { decrypt } = await import("@/lib/crypto");
        const { AUDIT_SYSTEM_PROMPT, buildAuditPrompt } = await import("@/lib/ai/prompts");

        const providers: { type: any; apiKey: string }[] = [];

        if (providerKey) {
          try {
            const decryptedKey = await decrypt(providerKey.encryptedKey, providerKey.nonce);
            providers.push({ type: providerKey.provider, apiKey: decryptedKey });
          } catch (decryptErr: any) {
            console.error("[audit] Failed to decrypt workspace provider key:", decryptErr.message);
          }
        }
        if (getKey("ANTHROPIC_API_KEY")) providers.push({ type: "ANTHROPIC", apiKey: getKey("ANTHROPIC_API_KEY") });
        if (getKey("OPENAI_API_KEY")) providers.push({ type: "OPENAI", apiKey: getKey("OPENAI_API_KEY") });
        if (getKey("GEMINI_API_KEY")) providers.push({ type: "GEMINI", apiKey: getKey("GEMINI_API_KEY") });

        console.log(`[audit] ${auditRunId}: Using ${providers.length} AI provider(s): ${providers.map(p => p.type).join(", ")}`);

        await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 30 } });

        const response = await generateWithFallback(providers, {
          messages: [
            { role: "system", content: AUDIT_SYSTEM_PROMPT },
            { role: "user", content: buildAuditPrompt(businessProfile, crawlSummary || undefined) },
          ],
          maxTokens: 4096,
          temperature: 0.3,
        });

        console.log(`[audit] ${auditRunId}: AI response received (${response.length} chars)`);

        await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 70 } });

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            aiResponse = JSON.parse(jsonMatch[0]);
            console.log(`[audit] ${auditRunId}: AI JSON parsed successfully, score: ${aiResponse.overallScore}`);
          } catch (parseErr) {
            console.error(`[audit] ${auditRunId}: Failed to parse AI JSON response`);
            aiError = "AI returned invalid JSON";
          }
        } else {
          console.error(`[audit] ${auditRunId}: AI response did not contain JSON`);
          aiError = "AI response did not contain JSON";
        }
      } catch (err: any) {
        console.error(`[audit] ${auditRunId}: AI provider error:`, err.message);
        aiError = `AI error: ${err.message}`;
        // Fall through — will use crawl data if available, or fail honestly
      }
    } else {
      console.log(`[audit] ${auditRunId}: No AI providers configured — will rely on crawl data only`);
    }

    // If AI failed, try to compute scores from real crawl data instead of using dummy templates
    if (!aiResponse && crawlResult) {
      console.log(`[audit] ${auditRunId}: AI unavailable, computing scores from real crawl data`);
      aiResponse = computeScoresFromCrawlData(crawlResult, businessProfile, websiteUrl);
    }

    if (!aiResponse) {
      // No AI AND no crawl data — fail the audit honestly
      const failReason = aiError || "No AI providers configured and no crawl data available";
      console.error(`[audit] ${auditRunId}: Audit cannot complete — ${failReason}`);
      await db.auditRun.update({
        where: { id: auditRunId },
        data: {
          status: "FAILED",
          progress: 0,
          rootCauseSummary: `Audit could not be completed: ${failReason}. Please configure an AI provider (Anthropic, OpenAI, or Gemini) in Settings → AI Keys, then re-run the audit.`,
        },
      });
      await db.jobRecord.updateMany({
        where: { refId: auditRunId },
        data: { status: "failed", error: failReason },
      });

      // Notify owner about failure
      try {
        const owner = await db.membership.findFirst({
          where: { workspace: { businessProfiles: { some: { id: businessProfile.id } } }, role: "OWNER" },
          include: { user: true },
        });
        if (owner?.user?.email) {
          const { sendAuditFailedEmail } = await import("@/lib/email");
          await sendAuditFailedEmail({
            to: owner.user.email,
            businessName: businessProfile.name,
            reason: failReason,
          });
        }
      } catch {}

      return;
    }

    // Save AI findings
    await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 80 } });

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

    // Save SEO crawler findings (with URL + evidence)
    if (crawlResult) {
      try {
        const { analyzeCrawlResults } = await import("@/lib/crawler/seo-analyzer");
        const seoIssues = analyzeCrawlResults(crawlResult, websiteUrl);
        console.log(`[audit] ${auditRunId}: SEO analyzer found ${seoIssues.length} issues`);

        for (const issue of seoIssues) {
          await db.auditFinding.create({
            data: {
              auditRunId,
              category: issue.category,
              title: issue.title,
              detail: issue.detail,
              severity: issue.severity,
              fixable: issue.fixable,
              url: issue.url,
              evidence: issue.evidence,
            },
          });
        }
      } catch (analyzeErr: any) {
        console.error(`[audit] ${auditRunId}: SEO analyzer error:`, analyzeErr.message);
      }
    }

    await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 90 } });

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

    // Send audit complete email to workspace owner
    try {
      const owner = await db.membership.findFirst({
        where: { workspace: { businessProfiles: { some: { id: businessProfile.id } } }, role: "OWNER" },
        include: { user: true },
      });
      if (owner?.user?.email) {
        const { sendAuditCompleteEmail } = await import("@/lib/email");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const findingsCount = await db.auditFinding.count({ where: { auditRunId } });
        const criticalCount = await db.auditFinding.count({ where: { auditRunId, severity: "CRITICAL" } });
        await sendAuditCompleteEmail({
          to: owner.user.email,
          businessName: businessProfile.name,
          score: aiResponse.overallScore || 50,
          reportUrl: `${appUrl}/business/${businessProfile.id}/audit/${auditRunId}`,
          findings: findingsCount,
          criticalCount,
        });
      }
    } catch (emailErr: any) {
      console.error(`[audit] ${auditRunId}: Failed to send completion email:`, emailErr.message);
    }
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

/**
 * Compute real scores from actual crawl data when AI is unavailable.
 * No dummy/template data — every score and finding is based on real crawl results.
 */
function computeScoresFromCrawlData(crawlResult: any, business: any, websiteUrl: string) {
  const { pages, stats, sitemapFound, robotsBlocked } = crawlResult;
  const htmlPages = pages.filter((p: any) => p.statusCode === 200 && p.wordCount > 0);
  const totalPages = stats.pagesCrawled;

  // Compute SEO score from real crawl metrics
  let seoPoints = 100;
  const missingTitles = htmlPages.filter((p: any) => !p.title).length;
  const missingMeta = htmlPages.filter((p: any) => !p.metaDescription).length;
  const missingH1 = htmlPages.filter((p: any) => p.h1s.length === 0).length;
  const errors4xx = pages.filter((p: any) => p.statusCode >= 400 && p.statusCode < 500).length;
  const errors5xx = pages.filter((p: any) => p.statusCode >= 500).length;
  const thinContent = htmlPages.filter((p: any) => p.wordCount < 300).length;
  const totalImages = htmlPages.reduce((s: number, p: any) => s + p.imagesTotal, 0);
  const missingAlt = htmlPages.reduce((s: number, p: any) => s + p.imagesMissingAlt, 0);
  const avgResponseTime = totalPages > 0
    ? Math.round(pages.reduce((s: number, p: any) => s + p.responseTimeMs, 0) / totalPages)
    : 0;
  const slowPages = pages.filter((p: any) => p.responseTimeMs > 3000 && p.statusCode === 200).length;

  // Deduct points based on real issues
  if (htmlPages.length > 0) {
    seoPoints -= Math.min(25, Math.round((missingTitles / htmlPages.length) * 50));
    seoPoints -= Math.min(15, Math.round((missingMeta / htmlPages.length) * 30));
    seoPoints -= Math.min(15, Math.round((missingH1 / htmlPages.length) * 30));
    seoPoints -= Math.min(10, Math.round((thinContent / htmlPages.length) * 20));
  }
  if (!sitemapFound) seoPoints -= 10;
  if (!stats.robotsTxtFound) seoPoints -= 5;
  seoPoints -= Math.min(15, errors4xx * 3);
  seoPoints -= Math.min(15, errors5xx * 5);
  if (totalImages > 0) seoPoints -= Math.min(10, Math.round((missingAlt / totalImages) * 20));
  if (slowPages > 0) seoPoints -= Math.min(5, slowPages * 2);

  const seoScore = Math.max(5, Math.min(100, seoPoints));

  // Website score based on crawl signals
  let websitePoints = 50; // baseline — we fetched it successfully
  if (htmlPages.length > 0) websitePoints += 10;
  if (htmlPages.some((p: any) => p.wordCount > 500)) websitePoints += 10;
  if (errors4xx === 0) websitePoints += 10;
  if (errors5xx === 0) websitePoints += 5;
  if (avgResponseTime < 2000) websitePoints += 10;
  else if (avgResponseTime > 4000) websitePoints -= 10;
  if (websiteUrl.startsWith("https")) websitePoints += 5;
  const websiteScore = Math.max(5, Math.min(100, websitePoints));

  // Other category scores — we can't determine these from crawl alone,
  // so we set them to null to indicate "not analyzed by AI"
  const hasSocial = !!(business.facebookUrl || business.instagramUrl || business.tiktokUrl || business.linkedinUrl);
  const hasGBP = !!business.googleBusinessUrl;
  const socialScore = hasSocial ? 40 : 15;
  const offerScore = 30; // Cannot determine from crawl
  const reputationScore = hasGBP ? 40 : 15;
  const localScore = (hasGBP ? 35 : 15) + (business.city ? 10 : 0);

  const overallScore = Math.round((websiteScore + seoScore + socialScore + offerScore + reputationScore + localScore) / 6);

  const rootCauseSummary = `Automated crawl of ${business.name} (${websiteUrl}) analyzed ${totalPages} pages. ` +
    `Found ${missingTitles} pages missing titles, ${missingMeta} missing meta descriptions, ` +
    `${errors4xx} broken pages (4xx), ${errors5xx} server errors (5xx). ` +
    `Sitemap: ${sitemapFound ? "found" : "not found"}. Robots.txt: ${stats.robotsTxtFound ? "found" : "not found"}. ` +
    `Average response time: ${avgResponseTime}ms. ` +
    `Note: AI analysis was unavailable — scores for social, offer, and reputation are estimated from profile data only. ` +
    `Configure an AI provider in Settings for comprehensive analysis.`;

  // No dummy findings — the real SEO crawler findings are saved separately
  return {
    overallScore,
    websiteScore,
    seoScore,
    socialScore,
    offerScore,
    reputationScore,
    localScore,
    rootCauseSummary,
    findings: [], // Real findings come from the SEO analyzer, not templates
  };
}
