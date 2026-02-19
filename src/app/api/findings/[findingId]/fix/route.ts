import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: { findingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const finding = await db.auditFinding.findUnique({
    where: { id: params.findingId },
    include: {
      auditRun: {
        include: {
          businessProfile: { include: { workspace: true } },
        },
      },
    },
  });

  if (!finding) return NextResponse.json({ error: "Finding not found" }, { status: 404 });

  const biz = finding.auditRun.businessProfile;

  // Try AI-powered fix generation
  let fixSteps: string | null = null;

  try {
    const providerKey = await db.providerKey.findFirst({
      where: { workspaceId: biz.workspaceId, isActive: true },
    });

    const platformConfigs = await db.systemConfig.findMany({
      where: { key: { in: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"] } },
    });
    const dbKeys: Record<string, string> = {};
    for (const c of platformConfigs) dbKeys[c.key] = c.value;
    const getKey = (name: string) => dbKeys[name] || process.env[name] || "";

    const hasAI = providerKey || getKey("ANTHROPIC_API_KEY") || getKey("OPENAI_API_KEY") || getKey("GEMINI_API_KEY");

    if (hasAI) {
      const { generateWithFallback } = await import("@/lib/ai/provider");
      const { decrypt } = await import("@/lib/crypto");

      const providers: { type: any; apiKey: string }[] = [];
      if (providerKey) {
        const apiKey = await decrypt(providerKey.encryptedKey, providerKey.nonce);
        providers.push({ type: providerKey.provider, apiKey });
      }
      if (getKey("ANTHROPIC_API_KEY")) providers.push({ type: "ANTHROPIC", apiKey: getKey("ANTHROPIC_API_KEY") });
      if (getKey("OPENAI_API_KEY")) providers.push({ type: "OPENAI", apiKey: getKey("OPENAI_API_KEY") });
      if (getKey("GEMINI_API_KEY")) providers.push({ type: "GEMINI", apiKey: getKey("GEMINI_API_KEY") });

      fixSteps = await generateWithFallback(providers, {
        messages: [
          {
            role: "system",
            content: "You are a business consultant. Generate specific, actionable fix instructions. Be concise and practical. Use numbered steps. Include specific tools, platforms, or services when relevant.",
          },
          {
            role: "user",
            content: `Generate a step-by-step fix for this issue:

Business: ${biz.name} (${biz.industry}, ${biz.city || biz.country})
Website: ${biz.websiteUrl || "None"}

Issue: ${finding.title}
Category: ${finding.category}
Severity: ${finding.severity}
Detail: ${finding.detail}

Provide 3-6 specific, actionable steps to fix this. Each step should be something the business owner can do today. Include specific tool recommendations where applicable.`,
          },
        ],
        maxTokens: 1024,
        temperature: 0.4,
      });
    }
  } catch (err) {
    console.error("AI fix generation failed, using template:", err);
  }

  // Fallback to template-based fix
  if (!fixSteps) {
    fixSteps = generateTemplateFix(finding.category, finding.title, finding.detail, biz);
  }

  // Mark the finding as fixed and store the fix steps
  await db.auditFinding.update({
    where: { id: params.findingId },
    data: { fixed: true },
  });

  return NextResponse.json({ fixSteps, findingId: params.findingId });
}

function generateTemplateFix(category: string, title: string, detail: string, biz: any): string {
  const fixes: Record<string, string> = {
    website: `How to fix: ${title}

1. Review your website at ${biz.websiteUrl || "your domain"} and identify the specific areas mentioned: ${detail.substring(0, 100)}

2. Add a clear call-to-action (CTA) button above the fold on every page. Use action words like "Get a Free Quote", "Book Now", or "Call Us Today". Make it a contrasting color that stands out.

3. Ensure your phone number is clickable (use tel: links) and visible in the header. Add a contact form on every page.

4. Test your site speed at Google PageSpeed Insights (pagespeed.web.dev). Aim for a score above 80. Compress images, enable caching, and minimize JavaScript.

5. Verify your site is mobile-responsive by testing on multiple devices. Over 60% of traffic comes from mobile.

6. Install Google Analytics and Search Console to track performance. Set up conversion tracking for your main CTA.`,

    seo: `How to fix: ${title}

1. Install an SEO plugin (Yoast for WordPress, or use your CMS's built-in SEO tools). Configure meta titles and descriptions for every page.

2. Research keywords using Google Keyword Planner (free) or Ubersuggest. Target: "${biz.industry} in ${biz.city || biz.country}", "${biz.industry} near me", and 5-10 related long-tail keywords.

3. Create a Google Search Console account and submit your sitemap. Monitor which queries bring traffic and optimize those pages.

4. Write 2-4 blog articles per month targeting your main keywords. Each article should be 800-1500 words with headers, images, and internal links.

5. Add schema markup (LocalBusiness, FAQ, Review) to help search engines understand your content. Use Google's Structured Data Markup Helper.

6. Build backlinks by getting listed in local directories, industry associations, and requesting links from business partners.`,

    social: `How to fix: ${title}

1. Create business profiles on the platforms where your customers spend time. For ${biz.industry}: prioritize Instagram and Facebook for B2C, or LinkedIn for B2B.

2. Set up a content calendar with 3-5 posts per week. Mix content types: 40% educational, 30% behind-the-scenes, 20% promotional, 10% user-generated content.

3. Use a scheduling tool like Buffer (free tier) or Later to batch-create and schedule posts in advance.

4. Engage daily: respond to every comment within 2 hours, like relevant posts in your industry, follow potential customers.

5. Run a small paid campaign ($5-10/day) to build your initial audience. Target your local area and demographics matching your ideal customer.

6. Track metrics weekly: follower growth, engagement rate, website clicks. Adjust your strategy based on what performs best.`,

    offer: `How to fix: ${title}

1. Analyze your current pricing against 3-5 competitors. Identify where you can differentiate on value, not just price.

2. Create a 3-tier pricing structure: Basic (entry-level, low barrier), Standard (most popular, best value), Premium (high-touch, highest margin). Name them clearly.

3. Add urgency elements to your offers: limited-time discounts, seasonal specials, "only X spots left" messaging. Use countdown timers on landing pages.

4. Create a lead magnet (free guide, checklist, or consultation) to capture emails from visitors who aren't ready to buy yet.

5. Implement an upsell/cross-sell strategy: suggest complementary services at checkout, offer package bundles, create a loyalty program.

6. A/B test your pricing page: try different layouts, price anchoring, and social proof placement to optimize conversion.`,

    reputation: `How to fix: ${title}

1. Claim and verify your Google Business Profile at business.google.com. Add complete information: hours, services, photos (at least 10), description with keywords.

2. Set up a systematic review request process: send an email/SMS 24-48 hours after service with a direct link to your Google review page.

3. Respond to ALL reviews within 24 hours. Thank positive reviewers specifically. Address negative reviews professionally with a resolution offer.

4. Add testimonials to your website. Create a dedicated testimonials page and feature 2-3 quotes on your homepage.

5. Monitor your online reputation using Google Alerts (free) for your business name. Check review sites weekly: Google, Yelp, Facebook, industry-specific sites.

6. Consider a reputation management tool like Birdeye or Podium if you handle high volume. They automate review requests and consolidate monitoring.`,

    local: `How to fix: ${title}

1. Audit your current directory listings using a tool like Moz Local or BrightLocal. Ensure your NAP (Name, Address, Phone) is identical everywhere.

2. Claim listings on: Google Business Profile, Yelp, Bing Places, Apple Maps, Facebook, Yellow Pages, and 3-5 industry-specific directories for ${biz.industry}.

3. Add consistent business categories, hours, photos, and descriptions across all listings. Use the same logo and cover photo everywhere.

4. Get listed with your local Chamber of Commerce and any industry associations. These high-quality backlinks boost local SEO.

5. Create location-specific content on your website: a dedicated page for each service area, local case studies, community involvement posts.

6. Monitor and maintain listings quarterly. Remove duplicate listings and update information whenever anything changes (hours, phone, address).`,
  };

  return fixes[category] || `How to fix: ${title}

1. Review the finding in detail: ${detail}

2. Research best practices for ${category} in the ${biz.industry} industry.

3. Create an action plan with specific deadlines for each improvement.

4. Implement changes and test their effectiveness.

5. Monitor results for 2-4 weeks and adjust as needed.

6. Document what worked for future reference and team training.`;
}
