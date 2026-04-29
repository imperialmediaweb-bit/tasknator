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

    const auditRun = await db.auditRun.create({
      data: {
        businessProfileId: params.id,
        status: "QUEUED",
        progress: 0,
      },
    });

    await db.usageMeter.upsert({
      where: { workspaceId_month: { workspaceId: businessProfile.workspaceId, month } },
      update: { auditsUsed: { increment: 1 } },
      create: { workspaceId: businessProfile.workspaceId, month, auditsUsed: 1 },
    });

    await db.jobRecord.create({
      data: {
        type: "audit",
        refId: auditRun.id,
        status: "queued",
      },
    });

    processAuditInline(auditRun.id, businessProfile).catch(() => {});

    return NextResponse.json({ auditRunId: auditRun.id, status: "QUEUED" }, { status: 201 });
  } catch {
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
    if (!res.ok) return `[HTTP ${res.status} error]`;
    const html = await res.text();
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return `[Could not fetch website: ${msg}]`;
  }
}

type ProviderType = "ANTHROPIC" | "OPENAI" | "GEMINI";

interface BusinessProfileData {
  id: string;
  workspaceId: string;
  name: string;
  industry: string;
  country: string;
  websiteUrl: string | null;
  websiteText?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  googleBusinessUrl?: string | null;
  city?: string | null;
  [key: string]: unknown;
}

async function processAuditInline(auditRunId: string, businessProfile: BusinessProfileData) {
  try {
    await db.auditRun.update({
      where: { id: auditRunId },
      data: { status: "RUNNING", startedAt: new Date(), progress: 10 },
    });

    let liveWebsiteContent = "";
    let websiteUrl = "";
    if (businessProfile.websiteUrl) {
      websiteUrl = businessProfile.websiteUrl;
      if (!websiteUrl.startsWith("http")) websiteUrl = "https://" + websiteUrl;
      liveWebsiteContent = await fetchWebsiteContent(websiteUrl);
      if (liveWebsiteContent.length > 50 && !liveWebsiteContent.startsWith("[")) {
        await db.businessProfile.update({
          where: { id: businessProfile.id },
          data: { websiteText: liveWebsiteContent.substring(0, 10000) },
        });
        businessProfile.websiteText = liveWebsiteContent;
      }
    }

    await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 20 } });

    // SEO Crawler — crawl pages for technical SEO issues
    let crawlResult: ReturnType<typeof computeScoresFromCrawlData> extends infer R ? any : never;
    crawlResult = null;
    let crawlSummary = "";
    if (websiteUrl) {
      try {
        const { crawlSite } = await import("@/lib/crawler/seo-crawler");
        const { buildCrawlSummary } = await import("@/lib/crawler/seo-analyzer");

        await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 25 } });
        crawlResult = await crawlSite(websiteUrl, { maxPages: 200 });

        await db.auditRun.update({
          where: { id: auditRunId },
          data: { progress: 45, crawlStats: crawlResult.stats },
        });

        crawlSummary = buildCrawlSummary(crawlResult);
      } catch {
        // Continue without crawl data
      }
    }

    // AI provider resolution
    const providerKey = await db.providerKey.findFirst({
      where: { workspaceId: businessProfile.workspaceId, isActive: true },
    });

    const platformConfigs = await db.systemConfig.findMany({
      where: { key: { in: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"] } },
    });
    const dbKeys: Record<string, string> = {};
    for (const c of platformConfigs) dbKeys[c.key] = c.value;

    const getKey = (name: string) => {
      const dbKey = dbKeys[name];
      const envKey = process.env[name];
      const result = dbKey || envKey || "";
      return result;
    };

    let aiResponse: any;
    let aiError: string | null = null;

    const anthropicKey = getKey("ANTHROPIC_API_KEY");
    const openaiKey = getKey("OPENAI_API_KEY");
    const geminiKey = getKey("GEMINI_API_KEY");

    if (providerKey || anthropicKey || openaiKey || geminiKey) {
      try {
        const { generateWithFallback } = await import("@/lib/ai/provider");
        const { decrypt } = await import("@/lib/crypto");
        const { AUDIT_SYSTEM_PROMPT, buildAuditPrompt } = await import("@/lib/ai/prompts");

        const providers: { type: ProviderType; apiKey: string }[] = [];

        if (providerKey) {
          try {
            const decryptedKey = await decrypt(providerKey.encryptedKey, providerKey.nonce);
            providers.push({ type: providerKey.provider as ProviderType, apiKey: decryptedKey });
          } catch (err) {
            // Failed to decrypt workspace key
          }
        }
        if (anthropicKey) {
          providers.push({ type: "ANTHROPIC", apiKey: anthropicKey });
        }
        if (openaiKey) {
          providers.push({ type: "OPENAI", apiKey: openaiKey });
        }
        if (geminiKey) {
          providers.push({ type: "GEMINI", apiKey: geminiKey });
        }

        await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 30 } });

        const response = await generateWithFallback(providers, {
          messages: [
            { role: "system", content: AUDIT_SYSTEM_PROMPT },
            { role: "user", content: buildAuditPrompt(businessProfile, crawlSummary || undefined) },
          ],
          maxTokens: 4096,
          temperature: 0.3,
        });

        await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 70 } });

        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            aiResponse = JSON.parse(jsonMatch[0]);
          } catch {
            aiError = "AI returned invalid JSON";
          }
        } else {
          aiError = "AI response did not contain JSON";
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        aiError = `AI error: ${msg}`;
      }
    }

    // Fallback: compute scores from crawl data if AI unavailable
    if (!aiResponse && crawlResult) {
      aiResponse = computeScoresFromCrawlData(crawlResult, businessProfile, websiteUrl);
    }

    if (!aiResponse) {
      const failReason = aiError || "No AI providers configured and no crawl data available";
      await db.auditRun.update({
        where: { id: auditRunId },
        data: {
          status: "FAILED",
          progress: 0,
          rootCauseSummary: `Audit could not be completed: ${failReason}. Please configure an AI provider (Anthropic, OpenAI, or Gemini) in Settings, then re-run the audit.`,
        },
      });
      await db.jobRecord.updateMany({
        where: { refId: auditRunId },
        data: { status: "failed", error: failReason },
      });

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

    // Save SEO crawler findings with URL evidence
    if (crawlResult) {
      try {
        const { analyzeCrawlResults } = await import("@/lib/crawler/seo-analyzer");
        const seoIssues = analyzeCrawlResults(crawlResult, websiteUrl);

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
      } catch {}
    }

    await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 90 } });

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

    try {
      const owner = await db.membership.findFirst({
        where: { workspace: { businessProfiles: { some: { id: businessProfile.id } } }, role: "OWNER" },
        include: { user: true },
      });
      if (owner?.user?.email) {
        const { sendAuditCompleteEmail } = await import("@/lib/email");
        const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
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
    } catch {}
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    await db.auditRun.update({
      where: { id: auditRunId },
      data: { status: "FAILED", progress: 0 },
    });
    await db.jobRecord.updateMany({
      where: { refId: auditRunId },
      data: { status: "failed", error: msg },
    });
  }
}

interface CrawlPage {
  statusCode: number;
  wordCount: number;
  title: string | null;
  metaDescription: string | null;
  h1s: string[];
  imagesTotal: number;
  imagesMissingAlt: number;
  responseTimeMs: number;
}

interface CrawlResult {
  pages: CrawlPage[];
  stats: { pagesCrawled: number; robotsTxtFound?: boolean };
  sitemapFound: boolean;
  robotsBlocked: string[];
}

function computeScoresFromCrawlData(crawlResult: CrawlResult, business: BusinessProfileData, websiteUrl: string) {
  const { pages, stats, sitemapFound } = crawlResult;
  const htmlPages = pages.filter((p) => p.statusCode === 200 && p.wordCount > 0);
  const totalPages = stats.pagesCrawled;

  let seoPoints = 100;
  const missingTitles = htmlPages.filter((p) => !p.title).length;
  const missingMeta = htmlPages.filter((p) => !p.metaDescription).length;
  const missingH1 = htmlPages.filter((p) => p.h1s.length === 0).length;
  const errors4xx = pages.filter((p) => p.statusCode >= 400 && p.statusCode < 500).length;
  const errors5xx = pages.filter((p) => p.statusCode >= 500).length;
  const thinContent = htmlPages.filter((p) => p.wordCount < 300).length;
  const totalImages = htmlPages.reduce((s, p) => s + p.imagesTotal, 0);
  const missingAlt = htmlPages.reduce((s, p) => s + p.imagesMissingAlt, 0);
  const avgResponseTime = totalPages > 0
    ? Math.round(pages.reduce((s, p) => s + p.responseTimeMs, 0) / totalPages)
    : 0;
  const slowPages = pages.filter((p) => p.responseTimeMs > 3000 && p.statusCode === 200).length;

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

  let websitePoints = 50;
  if (htmlPages.length > 0) websitePoints += 10;
  if (htmlPages.some((p) => p.wordCount > 500)) websitePoints += 10;
  if (errors4xx === 0) websitePoints += 10;
  if (errors5xx === 0) websitePoints += 5;
  if (avgResponseTime < 2000) websitePoints += 10;
  else if (avgResponseTime > 4000) websitePoints -= 10;
  if (websiteUrl.startsWith("https")) websitePoints += 5;
  const websiteScore = Math.max(5, Math.min(100, websitePoints));

  const hasSocial = !!(business.facebookUrl || business.instagramUrl || business.tiktokUrl || business.linkedinUrl);
  const hasGBP = !!business.googleBusinessUrl;
  const socialScore = hasSocial ? 40 : 15;
  const offerScore = 30;
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

  return {
    overallScore,
    websiteScore,
    seoScore,
    socialScore,
    offerScore,
    reputationScore,
    localScore,
    rootCauseSummary,
    findings: [],
  };
}
