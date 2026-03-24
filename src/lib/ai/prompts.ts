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
}, crawlSummary?: string): string {
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
${crawlSummary ? `\n${crawlSummary}\n` : ""}
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

export const ASSET_SYSTEM_PROMPT = `You are BusinessFix AI, an execution-focused content engine for business recovery. Generate assets that are READY TO USE immediately — not templates, not suggestions.

CRITICAL FORMAT RULES:
- Write in plain English with markdown formatting only
- Use ## for section headers, **bold** for emphasis, - for bullet points
- Write complete sentences and paragraphs a business owner can read
- ABSOLUTELY NO JSON, NO code blocks, NO curly braces, NO square brackets, NO key-value pairs
- NEVER wrap output in \`\`\`json or \`\`\` code fences
- If describing a pricing package, write it as readable text like: "**Price:** $299/month" — NOT as {"price": 299}
- Every asset must include specific, copy-paste-ready content
- Include 2-3 variations of key elements (headlines, hooks, CTAs)
- Never generate fake testimonials (use [PLACEHOLDER] labels)
- All content should be industry-specific and personalized to the business
- End with a ## KPI TARGET section and a ## DEPLOY STEPS section`;

export function buildAssetPrompt(
  assetType: string,
  businessName: string,
  industry: string,
  context: string,
  taskInfo?: { title: string; description: string; phase: string }
): string {
  const typeInstructions: Record<string, string> = {
    WEBSITE_COPY: `Generate complete website copy ready to paste into a website builder.

Include these sections with full copy-paste-ready text:
- Hero section: headline, subheadline, and CTA button text (3 variations)
- About Us section (2-3 paragraphs)
- 3 Services/offerings with title and description each
- 5 FAQs with answers
- Contact section text
- Meta title and meta description for the homepage

End with KPI TARGET and DEPLOY STEPS sections.`,

    AD_COPY: `Generate ready-to-use ad copy for social media and search campaigns.

Include:
## Meta Ads (3 variations)
For each: Headline, Primary Text (125 chars), CTA button text

## Google Search Ads (3 variations)
For each: 3 Headlines (30 chars each), 2 Descriptions (90 chars each)

## Target Keywords (10 keywords)
For each: keyword, match type (broad/phrase/exact), estimated intent

## Hook Variations (3 short attention-grabbing openers)

## A/B Test Recommendations
What to test first and why.

Target: CTR > 2%. End with KPI TARGET and DEPLOY STEPS sections.`,

    EMAIL_SEQUENCE: `Generate a complete 5-email nurture sequence ready to paste into an email tool.

For each email include:
- Subject line
- Preview text
- Full email body (use [PLACEHOLDER] for testimonials, never fake them)

## Email 1: Welcome
## Email 2: Value Proposition
## Email 3: Social Proof
## Email 4: Offer / Promotion
## Email 5: Follow-up / Last Chance

End with KPI TARGET and DEPLOY STEPS sections.`,

    REVIEW_REPLIES: `Generate review response templates ready to copy-paste into Google/Yelp/Facebook.

## Positive Review Replies (3 templates)
Write warm, genuine responses that thank the customer and reinforce the brand.

## Negative Review Replies (3 templates)
Write professional, empathetic responses that acknowledge the issue and offer resolution.

## "Ask for a Review" Templates (2 templates)
Short messages to send to happy customers asking them to leave a review.

End with KPI TARGET and DEPLOY STEPS sections.`,

    SEO_PLAN: `Generate a complete SEO content strategy.

## Blog Article Ideas (30 topics)
For each: title, target keyword, brief 3-point outline

## Internal Linking Suggestions (5 recommendations)
Which pages should link to each other and why.

## On-Page SEO Checklist (10 items)
Specific actions with details for this business.

End with KPI TARGET and DEPLOY STEPS sections.`,

    SALES_SCRIPTS: `Generate ready-to-use sales scripts.

## Phone Call Script
Full word-for-word script: opening, qualifying questions, pitch, handling objections, close.

## WhatsApp Sequence (3 messages)
Message 1: Introduction. Message 2: Value/offer. Message 3: Follow-up/close.

## Objection Handling (5 common objections)
For each: the objection, the recommended response.

End with KPI TARGET and DEPLOY STEPS sections.`,

    OFFER_PACKAGES: `Generate a 3-tier pricing structure ready to put on a website.

## Basic Package
Name, price suggestion, what's included (5-7 features), ideal customer profile

## Standard Package (Most Popular)
Name, price suggestion, what's included (8-10 features), ideal customer profile, what makes it the best value

## Premium Package
Name, price suggestion, what's included (10-12 features), ideal customer profile, upsell suggestions

## Upsell & Cross-sell Ideas
3 ways to increase average order value.

End with KPI TARGET and DEPLOY STEPS sections.`,

    WINBACK_MESSAGES: `Generate win-back messages for inactive customers.

## Email Win-back (3 messages)
For each: subject line and full body text. Include a special offer or incentive.

## SMS Win-back (2 messages)
Short, punchy messages under 160 characters with a clear CTA.

## Special Offer Template
A ready-to-use limited-time offer for returning customers.

End with KPI TARGET and DEPLOY STEPS sections.`,

    COST_CHECKLIST: `Generate a detailed cost-cutting checklist.

## Cost Reduction Areas (15 items)
For each area:
- What to review
- Estimated monthly savings potential
- Specific action to take
- Priority level (high/medium/low)

End with KPI TARGET and DEPLOY STEPS sections.`,

    HOOK_SCRIPTS: `Generate 10 attention hooks for short-form video (TikTok, Reels, Shorts).

For each hook:

## Hook [number]: [catchy name]
**Hook Line** (first 3 seconds — the attention grabber): "..."
**Setup** (next 5 seconds — the context): "..."
**Payoff** (remaining — the value delivery): "..."
**Filming Notes**: camera angle, lighting, props needed
**Best Platform**: TikTok / Reels / Shorts and why

Target: 50% hook rate. End with KPI TARGET and DEPLOY STEPS sections.`,

    UGC_SCRIPTS: `Generate 3 complete UGC-style video scripts in different lengths.

## Script 1 — 30 seconds
**Full Script** (word for word what to say): "..."
**Shot List**: numbered list of shots
**B-Roll Suggestions**: supplementary footage ideas
**CTA**: call to action at the end
**Talent Brief**: who should deliver this, appearance, tone

## Script 2 — 60 seconds
(same format)

## Script 3 — 90 seconds
(same format)

Target: CTR > 3%. End with KPI TARGET and DEPLOY STEPS sections.`,

    SOCIAL_CAPTIONS: `Generate 20 social media captions ready to schedule.

## Instagram Captions (7 posts)
For each: caption text, 5 hashtags, CTA, best posting time

## Facebook Captions (7 posts)
For each: caption text, 5 hashtags, CTA, best posting time

## LinkedIn Captions (6 posts)
For each: caption text, 5 hashtags, CTA, best posting time

## Weekly Content Calendar
Monday through Sunday — which post theme for each day.

Target: 5% engagement rate. End with KPI TARGET and DEPLOY STEPS sections.`,

    CREATIVE_BRIEF: `Generate a complete creative brief for a paid ad campaign.

## Target Audience
Demographics, psychographics, pain points, where they hang out online

## Messaging Pillars (3 key messages)
The core messages that all ads should communicate.

## Ad Concepts (3 concepts)
For each: headline, body copy, visual description, CTA button text

## Recommended Platforms
Which platforms to run on and why, with budget allocation percentages.

## A/B Test Plan
What to test first, what metrics to track, when to make decisions.

Target: ROAS > 3x. End with KPI TARGET and DEPLOY STEPS sections.`,
  };

  const taskContext = taskInfo
    ? `\nLINKED TASK: ${taskInfo.title} (${taskInfo.phase.replace("_", " ")})
Task Description: ${taskInfo.description}
This asset must directly help complete this task. Include specific actions to execute the task.`
    : "";

  return `Generate ${assetType} for:
Business: ${businessName} (${industry})
Context: ${context}${taskContext}

${typeInstructions[assetType] || "Generate appropriate ready-to-use content with clear section headers. End with KPI TARGET and DEPLOY STEPS sections. Do NOT output JSON."}`;
}
