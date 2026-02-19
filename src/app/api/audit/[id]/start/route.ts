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
    if (businessProfile.websiteUrl) {
      let url = businessProfile.websiteUrl;
      if (!url.startsWith("http")) url = "https://" + url;
      liveWebsiteContent = await fetchWebsiteContent(url);
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

    if (providerKey || getKey("ANTHROPIC_API_KEY") || getKey("OPENAI_API_KEY") || getKey("GEMINI_API_KEY")) {
      const { generateWithFallback } = await import("@/lib/ai/provider");
      const { decrypt } = await import("@/lib/crypto");
      const { AUDIT_SYSTEM_PROMPT, buildAuditPrompt } = await import("@/lib/ai/prompts");

      const providers: { type: any; apiKey: string }[] = [];

      if (providerKey) {
        const decryptedKey = await decrypt(providerKey.encryptedKey, providerKey.nonce);
        providers.push({ type: providerKey.provider, apiKey: decryptedKey });
      }
      if (getKey("ANTHROPIC_API_KEY")) providers.push({ type: "ANTHROPIC", apiKey: getKey("ANTHROPIC_API_KEY") });
      if (getKey("OPENAI_API_KEY")) providers.push({ type: "OPENAI", apiKey: getKey("OPENAI_API_KEY") });
      if (getKey("GEMINI_API_KEY")) providers.push({ type: "GEMINI", apiKey: getKey("GEMINI_API_KEY") });

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

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiResponse = JSON.parse(jsonMatch[0]);
      }
    }

    if (!aiResponse) {
      aiResponse = generateTemplateAudit(businessProfile, liveWebsiteContent);
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

function generateTemplateAudit(business: any, websiteContent: string) {
  const hasWebsite = !!business.websiteUrl;
  const hasSocial = !!(business.facebookUrl || business.instagramUrl || business.tiktokUrl || business.linkedinUrl);
  const hasGBP = !!business.googleBusinessUrl;
  const hasContent = websiteContent.length > 100 && !websiteContent.startsWith("[");

  // Analyze website content for real signals
  const contentLower = websiteContent.toLowerCase();
  const hasCTA = /book|call|buy|order|sign up|get started|contact us|free trial|schedule/i.test(websiteContent);
  const hasPhone = /\+?\d[\d\s\-()]{7,}/g.test(websiteContent);
  const hasEmail = /@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(websiteContent);
  const hasPricing = /\$|price|pricing|plan|cost|free/i.test(websiteContent);
  const hasSocialLinks = /facebook|instagram|twitter|linkedin|tiktok|youtube/i.test(websiteContent);
  const hasTestimonials = /testimonial|review|client said|customer said|stars?|rated/i.test(websiteContent);
  const hasBlog = /blog|article|post|news/i.test(websiteContent);
  const hasSSL = business.websiteUrl?.startsWith("https");

  // Calculate scores based on real signals
  const websiteScore = !hasWebsite ? 15 : (
    20 + (hasContent ? 15 : 0) + (hasCTA ? 15 : 0) + (hasPhone ? 10 : 0) + (hasEmail ? 5 : 0) + (hasSSL ? 10 : 0) + (hasPricing ? 10 : 0)
  );
  const seoScore = !hasWebsite ? 10 : (
    15 + (hasContent ? 15 : 0) + (hasBlog ? 20 : 0) + (contentLower.includes("meta") ? 10 : 0) + (business.city ? 15 : 0)
  );
  const socialScore = !hasSocial ? 15 : (
    30 + (hasSocialLinks ? 20 : 0) + (business.instagramUrl ? 10 : 0) + (business.facebookUrl ? 10 : 0) + (business.linkedinUrl ? 10 : 0)
  );
  const offerScore = 25 + (hasPricing ? 20 : 0) + (hasCTA ? 15 : 0) + (business.avgOrderValue ? 10 : 0);
  const reputationScore = !hasGBP ? 20 : (35 + (hasTestimonials ? 25 : 0) + (hasPhone ? 10 : 0));
  const localScore = (hasGBP ? 30 : 15) + (business.city ? 15 : 0) + (hasPhone ? 10 : 0) + (hasEmail ? 5 : 0);
  const overallScore = Math.round((websiteScore + seoScore + socialScore + offerScore + reputationScore + localScore) / 6);

  // Build detailed findings based on real signals
  const findings: any[] = [];

  // Website findings
  if (!hasWebsite) {
    findings.push({ category: "website", title: "No website detected", detail: `No website URL was provided for ${business.name}. In ${business.industry}, having a professional website is essential for credibility, lead generation, and customer trust. Without a website, potential customers searching online for ${business.industry} services in ${business.city || business.country} cannot find you.`, severity: "CRITICAL", fixable: true });
  } else if (hasContent) {
    if (!hasCTA) {
      findings.push({ category: "website", title: "No clear calls-to-action found on website", detail: `After scanning ${business.websiteUrl}, no prominent calls-to-action (Book Now, Call Us, Get a Quote, etc.) were detected. Websites without clear CTAs lose 30-50% of potential conversions. Every page should have a visible, compelling action button above the fold.`, severity: "CRITICAL", fixable: true });
    }
    if (!hasPhone) {
      findings.push({ category: "website", title: "No phone number visible on website", detail: `No phone number was found on ${business.websiteUrl}. For ${business.industry} businesses, displaying a clickable phone number prominently increases inquiry rates by up to 40%. Add your phone number to the header and contact page.`, severity: "HIGH", fixable: true });
    }
    if (!hasPricing) {
      findings.push({ category: "website", title: "No pricing or service packages displayed", detail: `${business.websiteUrl} does not appear to show pricing information. Businesses that display clear pricing or service tiers see 35% higher conversion rates. Consider adding transparent pricing or "starting from" indicators to reduce friction.`, severity: "HIGH", fixable: true });
    }
    if (!hasSSL) {
      findings.push({ category: "website", title: "Website may not use HTTPS", detail: `${business.websiteUrl} may not be using HTTPS/SSL. Google penalizes non-HTTPS sites in search rankings, and browsers show "Not Secure" warnings that erode visitor trust. Install an SSL certificate immediately.`, severity: "CRITICAL", fixable: true });
    }
  } else {
    findings.push({ category: "website", title: "Website could not be fully analyzed", detail: `${business.websiteUrl} was provided but the content could not be fully retrieved for analysis. This may indicate slow load times, blocking of automated tools, or server issues. Ensure your website loads within 3 seconds and is accessible to search engine crawlers.`, severity: "HIGH", fixable: true });
  }

  // SEO findings
  if (!hasBlog && hasWebsite) {
    findings.push({ category: "seo", title: "No blog or content marketing detected", detail: `${business.websiteUrl} does not appear to have a blog or content section. In ${business.industry}, content marketing drives organic traffic and establishes authority. Businesses with active blogs get 55% more website visitors. Start publishing 2-4 articles per month targeting local keywords like "${business.industry} in ${business.city || business.country}".`, severity: "HIGH", fixable: true });
  }
  findings.push({ category: "seo", title: `Local keyword optimization for "${business.industry} ${business.city || business.country}"`, detail: `Ensure your website targets local search terms like "${business.industry} near me", "${business.industry} in ${business.city || business.country}", and related long-tail keywords. Add these to page titles, headings, meta descriptions, and throughout your content. Set up Google Search Console to monitor your search performance.`, severity: "MEDIUM", fixable: true });

  // Social findings
  if (!hasSocial) {
    findings.push({ category: "social", title: "No social media presence detected", detail: `No social media profiles were provided for ${business.name}. In ${business.industry}, active social presence builds trust and generates leads. Start with 2 platforms most relevant to your audience: ${business.industry.toLowerCase().includes("b2b") ? "LinkedIn and Twitter" : "Instagram and Facebook"}. Post 3-5 times per week with a mix of educational content, behind-the-scenes, and customer success stories.`, severity: "HIGH", fixable: true });
  } else {
    const platforms = [
      business.facebookUrl && "Facebook",
      business.instagramUrl && "Instagram",
      business.tiktokUrl && "TikTok",
      business.linkedinUrl && "LinkedIn",
    ].filter(Boolean);
    const missing = ["Facebook", "Instagram", "LinkedIn"].filter(p => !platforms.includes(p));
    if (missing.length > 0) {
      findings.push({ category: "social", title: `Missing presence on ${missing.join(", ")}`, detail: `${business.name} is active on ${platforms.join(", ")} but missing from ${missing.join(", ")}. Each platform reaches different demographics. ${missing.includes("Instagram") ? "Instagram is essential for visual storytelling and reaching 18-45 demographics. " : ""}${missing.includes("LinkedIn") ? "LinkedIn is critical for B2B networking and professional credibility. " : ""}${missing.includes("Facebook") ? "Facebook remains the largest platform for local business discovery and community building." : ""}`, severity: "MEDIUM", fixable: true });
    }
  }

  // Offer findings
  findings.push({ category: "offer", title: "Offer structure analysis", detail: `For ${business.industry} businesses${business.revenueRange ? ` in the ${business.revenueRange} revenue range` : ""}, implementing a tiered pricing model (Basic/Standard/Premium) captures different customer segments. ${business.avgOrderValue ? `With an average order value of $${business.avgOrderValue}, consider creating an upsell path that increases AOV by 25-40%.` : "Track and optimize your average order value with upsell and cross-sell strategies."} Add urgency elements (limited-time offers, seasonal specials) to boost conversion rates.`, severity: "MEDIUM", fixable: true });

  // Reputation findings
  if (!hasGBP) {
    findings.push({ category: "reputation", title: "No Google Business Profile detected", detail: `No Google Business Profile URL was provided for ${business.name}. GBP is the #1 factor for local search visibility. ${business.city ? `Customers searching for "${business.industry} in ${business.city}" will not find you in Google Maps results.` : ""} Create and verify your GBP immediately, add photos, business hours, services, and actively respond to reviews.`, severity: "CRITICAL", fixable: true });
  }
  if (!hasTestimonials) {
    findings.push({ category: "reputation", title: "No customer testimonials or reviews detected", detail: `No customer testimonials or reviews were found${hasWebsite ? ` on ${business.websiteUrl}` : ""}. 92% of consumers read online reviews before making a purchase. Implement a systematic review collection process: send follow-up emails 24-48 hours after service, include direct review links, and display testimonials prominently on your website and social media.`, severity: "HIGH", fixable: true });
  }

  // Local findings
  findings.push({ category: "local", title: "Local directory and citation audit needed", detail: `Ensure ${business.name} is listed consistently on all major directories: Google Business Profile, Yelp, Yellow Pages, Bing Places, Apple Maps, and industry-specific directories for ${business.industry}. NAP (Name, Address, Phone) must be identical across all listings. Inconsistent information confuses search engines and reduces local ranking.`, severity: "MEDIUM", fixable: true });

  // Build root cause summary based on actual analysis
  const issues: string[] = [];
  if (websiteScore < 50) issues.push("website optimization gaps");
  if (seoScore < 40) issues.push("weak SEO foundations");
  if (socialScore < 40) issues.push("insufficient social media presence");
  if (reputationScore < 40) issues.push("low online reputation signals");
  if (!hasCTA && hasWebsite) issues.push("missing calls-to-action");
  if (!hasGBP) issues.push("no Google Business Profile");

  const rootCauseSummary = `Analysis of ${business.name} (${business.industry}${business.city ? `, ${business.city}` : ""}) reveals ${issues.length} key areas needing attention: ${issues.join(", ")}. ${hasContent ? `Website content was analyzed from ${business.websiteUrl} to generate these findings.` : hasWebsite ? `Website at ${business.websiteUrl} could not be fully analyzed.` : "No website was provided for analysis."} ${business.mainPain ? `The reported challenge of "${business.mainPain.replace(/_/g, " ").toLowerCase()}" is directly related to these findings.` : ""} Addressing these issues in priority order will improve customer acquisition and revenue.`;

  return {
    overallScore: Math.min(overallScore, 85), // cap at 85 for template
    websiteScore: Math.min(websiteScore, 85),
    seoScore: Math.min(seoScore, 75),
    socialScore: Math.min(socialScore, 80),
    offerScore: Math.min(offerScore, 70),
    reputationScore: Math.min(reputationScore, 70),
    localScore: Math.min(localScore, 75),
    rootCauseSummary,
    findings,
  };
}
