export const AUDIT_SYSTEM_PROMPT = `You are BusinessFix AI, an expert business diagnostics engine. You analyze business data and produce honest, actionable audit findings.

RULES:
- Never fabricate data. If information is missing, clearly state "Data not available" and provide best-practice recommendations instead.
- Never use manipulative or dark-pattern language.
- Be direct and specific in findings.
- Score each area 0-100 based on available evidence.
- Output valid JSON only.`;

export function buildAuditPrompt(business: {
  name: string;
  industry: string;
  country: string;
  city?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  websiteText?: string | null;
  revenueRange?: string | null;
  customersMonth?: number | null;
  avgOrderValue?: number | null;
  marketingBudget?: number | null;
  teamSize?: number | null;
  primaryGoal?: string | null;
  mainPain?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  linkedinUrl?: string | null;
  googleBusinessUrl?: string | null;
}): string {
  return `Analyze the following business and produce a diagnostic audit:

BUSINESS PROFILE:
- Name: ${business.name}
- Industry: ${business.industry}
- Location: ${business.city ? business.city + ", " : ""}${business.country}
- Website: ${business.websiteUrl || "Not provided"}
- Description: ${business.description || "Not provided"}
${business.websiteText ? `- Website Content (user-provided): ${business.websiteText.substring(0, 3000)}` : "- Website Content: Not available"}

SOCIAL PRESENCE:
- Facebook: ${business.facebookUrl || "Not provided"}
- Instagram: ${business.instagramUrl || "Not provided"}
- TikTok: ${business.tiktokUrl || "Not provided"}
- LinkedIn: ${business.linkedinUrl || "Not provided"}
- Google Business: ${business.googleBusinessUrl || "Not provided"}

METRICS:
- Revenue/month: ${business.revenueRange || "Not disclosed"}
- Customers/month: ${business.customersMonth ?? "Not disclosed"}
- Average order value: ${business.avgOrderValue ?? "Not disclosed"}
- Marketing budget: ${business.marketingBudget ?? "Not disclosed"}
- Team size: ${business.teamSize ?? "Not disclosed"}

PRIMARY GOAL: ${business.primaryGoal || "Not specified"}
MAIN PAIN: ${business.mainPain || "Not specified"}

Produce a JSON response with this exact structure:
{
  "overallScore": number,
  "websiteScore": number,
  "seoScore": number,
  "socialScore": number,
  "offerScore": number,
  "reputationScore": number,
  "localScore": number,
  "rootCauseSummary": "string",
  "findings": [
    {
      "category": "website|seo|social|offer|reputation|local",
      "title": "string",
      "detail": "string",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "fixable": boolean
    }
  ]
}

Generate 10-20 findings. If data is unavailable, provide industry best-practice recommendations labeled as assumptions.`;
}

export const PLAN_SYSTEM_PROMPT = `You are BusinessFix AI, a business recovery planner. Generate a structured 30/60/90-day repair plan based on audit findings.

RULES:
- Tasks must be specific and actionable
- Each task must have estimated impact and time estimate
- Prioritize high-impact, low-effort tasks first
- Do not suggest unethical tactics
- Output valid JSON only.`;

export function buildPlanPrompt(
  businessName: string,
  industry: string,
  rootCause: string,
  findings: { category: string; title: string; detail: string; severity: string }[]
): string {
  const findingsText = findings
    .map((f) => `[${f.severity}] ${f.category}: ${f.title} - ${f.detail}`)
    .join("\n");

  return `Create a 30/60/90-day repair plan for:
Business: ${businessName} (${industry})
Root Cause: ${rootCause}

AUDIT FINDINGS:
${findingsText}

Output JSON:
{
  "title": "Recovery Plan for [business]",
  "summary": "string",
  "tasks": [
    {
      "phase": "DAY_30|DAY_60|DAY_90",
      "title": "string",
      "description": "string",
      "impact": "high|medium|low",
      "timeEstimate": "string",
      "sortOrder": number
    }
  ]
}`;
}

export const ASSET_SYSTEM_PROMPT = `You are BusinessFix AI, a content generation engine for business recovery. Generate professional, ready-to-use business assets.

RULES:
- Content must be professional and ethical
- Never generate fake testimonials (use [PLACEHOLDER] labels)
- All content should be editable
- Be specific to the business industry
- Output valid JSON only.`;

export function buildAssetPrompt(
  assetType: string,
  businessName: string,
  industry: string,
  context: string
): string {
  const typeInstructions: Record<string, string> = {
    WEBSITE_COPY: `Generate website copy: hero headline+subheadline+CTA, about section, 3 services, 5 FAQs, contact text, meta title+description. Output JSON.`,
    AD_COPY: `Generate: 3 Meta ad variations, 3 Google Search ad variations, 10 keywords. Output JSON.`,
    EMAIL_SEQUENCE: `Generate 5-email sequence: welcome, value prop, social proof ([PLACEHOLDER] for testimonials), offer, follow-up. Output JSON.`,
    REVIEW_REPLIES: `Generate: 3 positive review replies, 3 negative review replies, 2 "ask for review" templates. Output JSON.`,
    SEO_PLAN: `Generate: 30 blog article ideas with outlines, 5 internal linking suggestions, 10-item on-page SEO checklist. Output JSON.`,
    SALES_SCRIPTS: `Generate: phone call script, WhatsApp 3-message sequence, 5 objection handling responses. Output JSON.`,
    OFFER_PACKAGES: `Generate: 3-tier pricing (Basic/Standard/Premium) with features, ideal customer, upsell suggestions. Output JSON.`,
    WINBACK_MESSAGES: `Generate: 3 email win-back messages, 2 SMS win-back, 1 special offer template. Output JSON.`,
    COST_CHECKLIST: `Generate: 15 cost-cutting areas with savings potential and actions. Output JSON.`,
  };

  return `Generate ${assetType} for:
Business: ${businessName} (${industry})
Context: ${context}

${typeInstructions[assetType] || "Generate appropriate content. Output JSON."}`;
}
