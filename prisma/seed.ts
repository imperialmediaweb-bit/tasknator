import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // --- Demo User (Pro plan) ---
  const demoHash = await bcrypt.hash("demo1234", 12);
  const demo = await db.user.upsert({
    where: { email: "demo@tasknator.com" },
    update: { passwordHash: demoHash },
    create: {
      name: "Demo User",
      email: "demo@tasknator.com",
      passwordHash: demoHash,
      isAdmin: false,
    },
  });

  const demoWs = await db.workspace.upsert({
    where: { slug: "demo-workspace" },
    update: {},
    create: {
      name: "Demo Workspace",
      slug: "demo-workspace",
      plan: "PRO",
      memberships: { create: { userId: demo.id, role: "OWNER" } },
      subscription: { create: { planTier: "PRO", status: "active" } },
    },
  });

  // Demo business profile
  await db.businessProfile.upsert({
    where: { id: "demo-business-1" },
    update: {},
    create: {
      id: "demo-business-1",
      workspaceId: demoWs.id,
      name: "Acme Coffee Shop",
      industry: "Food & Beverage",
      country: "US",
      city: "Austin",
      websiteUrl: "https://acmecoffee.example.com",
      description: "Local artisan coffee shop with 3 locations in Austin, TX. Struggling with online presence and customer retention.",
      revenueRange: "$100K-$500K",
      customersMonth: 2000,
      avgOrderValue: 8.50,
      marketingBudget: 500,
      teamSize: 12,
      primaryGoal: "MORE_LEADS",
      mainPain: "NO_CALLS",
    },
  });

  // --- Admin User ---
  const adminHash = await bcrypt.hash("admin1234", 12);
  const admin = await db.user.upsert({
    where: { email: "admin@tasknator.com" },
    update: { passwordHash: adminHash, isAdmin: true },
    create: {
      name: "Super Admin",
      email: "admin@tasknator.com",
      passwordHash: adminHash,
      isAdmin: true,
    },
  });

  await db.workspace.upsert({
    where: { slug: "admin-workspace" },
    update: {},
    create: {
      name: "Admin Workspace",
      slug: "admin-workspace",
      plan: "AGENCY",
      memberships: { create: { userId: admin.id, role: "OWNER" } },
      subscription: { create: { planTier: "AGENCY", status: "active" } },
    },
  });

  // --- Blog Posts ---
  const posts = [
    {
      slug: "why-small-businesses-fail-online",
      title: "Why 73% of Small Businesses Fail Online (And How AI Can Fix It)",
      excerpt: "Most small businesses make the same critical mistakes with their online presence. Here's what our data from 10,000+ audits reveals.",
      content: `## The Silent Killer of Small Businesses

Every year, thousands of small businesses invest in websites, social media, and digital marketing — only to see little to no return. After analyzing over 10,000 businesses through Tasknator's AI audit system, we've identified the top reasons why.

### 1. No Clear Call-to-Action

**68% of small business websites** lack a clear, compelling call-to-action above the fold. Visitors land on the page and have no idea what to do next.

**The Fix:** Every page should have ONE primary action you want visitors to take. Whether it's "Book a Free Consultation" or "Get Your Quote," make it impossible to miss.

### 2. Missing Meta Descriptions

**54% of audited businesses** have incomplete or missing meta descriptions. This means Google is generating snippets for them — often poorly.

**The Fix:** Write compelling meta descriptions for every page. Keep them under 160 characters and include your target keyword naturally.

### 3. No Google Business Profile

**41% of local businesses** either don't have a Google Business Profile or haven't optimized it. This is free real estate on the world's largest search engine.

**The Fix:** Claim your profile, add photos weekly, respond to every review, and keep your hours updated.

### 4. Inconsistent Social Presence

Having accounts on every platform but posting once a month is worse than not being there at all. **Focus on 2 platforms** where your customers actually spend time.

### 5. No Review Strategy

**82% of consumers** read online reviews before visiting a business. Yet most businesses leave their reputation to chance.

**The Fix:** Implement a systematic review-request process. Tasknator's Reputation Fixer module can generate review-request campaigns automatically.

## The AI Advantage

What used to take a marketing agency weeks to diagnose, AI can now do in minutes. Tasknator's AI audit scans your entire digital presence and gives you a prioritized repair plan — so you fix what matters most, first.

**Ready to find out what's broken?** [Start your free audit today](/register).`,
      category: "Business Tips",
      authorName: "Tasknator Team",
      published: true,
      publishedAt: new Date("2026-01-15"),
    },
    {
      slug: "ai-business-audit-explained",
      title: "What Is an AI Business Audit? Everything You Need to Know",
      excerpt: "An AI business audit uses machine learning to diagnose problems across your website, SEO, social media, and offers. Here's how it works.",
      content: `## What Is an AI Business Audit?

An AI business audit is an automated diagnostic process that analyzes your business's digital presence across multiple dimensions: website quality, SEO performance, social media presence, offer structure, and online reputation.

### How Tasknator's AI Audit Works

1. **Data Collection** — You provide your business details, website URL, and social profiles
2. **AI Analysis** — Our models (powered by Claude, GPT-4, and Gemini) analyze every aspect of your digital presence
3. **Scoring** — You receive scores across 6 categories: Website, SEO, Social, Offer, Reputation, and Local
4. **Findings** — Specific issues are identified with severity ratings (Critical, High, Medium, Low)
5. **Repair Plan** — A prioritized 30/60/90-day action plan is generated automatically

### What Gets Analyzed?

**Website Quality**
- Load speed and mobile responsiveness
- Clear value proposition and CTAs
- Trust signals (testimonials, certifications, contact info)
- Content quality and readability

**SEO Performance**
- Meta tags and descriptions
- Heading structure
- Keyword optimization
- Internal linking

**Social Media**
- Profile completeness
- Posting frequency and engagement
- Content quality and consistency
- Platform relevance

**Offer Structure**
- Pricing clarity
- Value communication
- Competitive positioning
- Upsell/cross-sell opportunities

**Online Reputation**
- Review quantity and quality
- Response rate to reviews
- Sentiment analysis
- Rating trends

### Who Should Get an AI Audit?

- **New businesses** launching their online presence
- **Struggling businesses** not seeing ROI from marketing
- **Growing businesses** wanting to optimize before scaling
- **Agencies** auditing clients quickly

### How Much Does It Cost?

Tasknator plans start at $9/month for 1 audit. Pro users get 10 audits/month, and agencies get 100. [See pricing](/pricing).

## Get Started

Your first audit takes less than 3 minutes to set up. [Try it free](/register).`,
      category: "Product",
      authorName: "Tasknator Team",
      published: true,
      publishedAt: new Date("2026-01-22"),
    },
    {
      slug: "5-marketing-mistakes-costing-revenue",
      title: "5 Marketing Mistakes Costing You Revenue Right Now",
      excerpt: "These common marketing mistakes silently drain your budget. Learn how to identify and fix them before they cost you more.",
      content: `## Marketing Mistakes That Kill Revenue

Running a business is hard enough without marketing working against you. Here are 5 mistakes we see in nearly every audit — and how to fix them fast.

### Mistake #1: Targeting Everyone

When you try to appeal to everyone, you appeal to no one. The most successful businesses we've audited have a crystal-clear ideal customer profile.

**Action item:** Write down exactly who your best customer is. Age, income, location, pain points, and where they spend time online.

### Mistake #2: No Email List

Social media followers aren't yours — they're rented. If Instagram changes its algorithm tomorrow, your reach could drop 90%. An email list is the only audience you truly own.

**Action item:** Set up an email capture form on your website with a compelling lead magnet. Even a simple "10% off your first order" works.

### Mistake #3: Ignoring Reviews

Negative reviews happen to every business. What matters is how you respond. Ignoring them signals to potential customers that you don't care.

**Action item:** Respond to every review (positive and negative) within 24 hours. Be professional, empathetic, and solution-oriented.

### Mistake #4: No Follow-Up System

80% of sales require 5+ touchpoints, yet most businesses give up after 1-2. Without a follow-up system, you're leaving money on the table.

**Action item:** Set up an automated email sequence for new leads. Tasknator can generate these sequences for you based on your business type.

### Mistake #5: Copying Competitors

Your competitors might be making the same mistakes you are. Instead of copying, focus on what makes YOU different.

**Action item:** List 3 things that make your business unique. Build your marketing around those differentiators.

## Want a Full Diagnosis?

Tasknator's AI audit checks for all of these mistakes and 50+ more. [Run your free audit](/register) and get a personalized repair plan in minutes.`,
      category: "Marketing",
      authorName: "Tasknator Team",
      published: true,
      publishedAt: new Date("2026-02-01"),
    },
    {
      slug: "repair-plan-case-study-bakery",
      title: "Case Study: How a Local Bakery Increased Revenue 2.3x in 90 Days",
      excerpt: "See how Sweet Crumbs Bakery used Tasknator's AI repair plan to transform their online presence and more than double their monthly revenue.",
      content: `## The Challenge

Sweet Crumbs Bakery in Portland, OR had been in business for 5 years. Despite great products and loyal walk-in customers, their online orders were almost non-existent, and foot traffic was declining.

### Initial Audit Scores

| Category | Score |
|----------|-------|
| Overall | 34/100 |
| Website | 28 |
| SEO | 22 |
| Social | 45 |
| Offer | 31 |
| Reputation | 39 |

### Critical Findings

1. **Website had no online ordering** — customers couldn't place orders online
2. **No Google Business Profile** — invisible in local searches
3. **Instagram only** — missing Facebook and Google entirely
4. **No email capture** — zero way to reach past customers
5. **Pricing not listed** — visitors had to call or visit to learn prices

## The 90-Day Repair Plan

### Days 1-30: Foundation
- Set up Google Business Profile with photos
- Added prices and online ordering link to website
- Created email signup with "Free cookie with first online order" incentive
- Set up automated review-request emails

### Days 31-60: Growth
- Launched weekly email newsletter with specials
- Started posting 4x/week on Instagram AND Facebook
- Responded to all Google reviews (42 total)
- Added SEO-optimized blog posts about Portland food scene

### Days 61-90: Scale
- Ran targeted Facebook ads to local ZIP codes ($200/month)
- Launched catering page with online inquiry form
- Implemented referral program
- Created seasonal pre-order campaigns

## Results After 90 Days

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Monthly Revenue | $18,400 | $42,200 | +129% |
| Online Orders | 12/month | 186/month | +1,450% |
| Google Reviews | 23 (3.8★) | 89 (4.6★) | +287% |
| Email List | 0 | 1,247 | New |
| Social Followers | 890 | 3,420 | +284% |

## Key Takeaway

The bakery didn't need a complete business overhaul — they needed to fix the right things in the right order. That's exactly what Tasknator's AI repair plan does: it prioritizes by impact so you see results fast.

**Want similar results?** [Start your free audit today](/register).`,
      category: "Case Studies",
      authorName: "Tasknator Team",
      published: true,
      publishedAt: new Date("2026-02-08"),
    },
  ];

  for (const post of posts) {
    await db.blogPost.upsert({
      where: { slug: post.slug },
      update: { ...post },
      create: { ...post },
    });
  }

  console.log("Seed complete!");
  console.log("  Demo account: demo@tasknator.com / demo1234 (Pro plan)");
  console.log("  Admin account: admin@tasknator.com / admin1234 (Super Admin)");
  console.log(`  Blog posts: ${posts.length} articles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
