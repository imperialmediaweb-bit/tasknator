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

  // ─── Demo Audit Run (completed) ──────────────────────────────
  await db.auditRun.upsert({
    where: { id: "demo-audit-1" },
    update: {},
    create: {
      id: "demo-audit-1",
      businessProfileId: "demo-business-1",
      status: "COMPLETED",
      overallScore: 52,
      websiteScore: 45,
      seoScore: 38,
      socialScore: 62,
      offerScore: 48,
      reputationScore: 55,
      localScore: 64,
      rootCauseSummary: `Analysis of Acme Coffee Shop (Food & Beverage, Austin, TX) reveals several key areas needing attention. The website at acmecoffee.example.com loads adequately but lacks clear calls-to-action above the fold — visitors cannot find an "Order Online" or "Visit Us" button without scrolling. No online ordering capability was detected, which is critical for a food & beverage business in 2026 where 73% of customers expect digital ordering options.

SEO foundations are weak: no blog content, missing meta descriptions on all pages, and no local keyword optimization for high-value terms like "best coffee shop Austin" or "artisan coffee near me." Social media presence is limited to Instagram only (missing Facebook and LinkedIn entirely), though Instagram posting frequency is decent at 2-3 times per week.

The primary challenge of low inbound calls (the business's stated main pain point) is directly linked to an incomplete Google Business Profile and the absence of website conversion paths. The business has only 23 Google reviews after 5+ years of operation — well below the industry average of 80+ for established local businesses.

Recommended priority: (1) Add prominent CTAs and online ordering to the website, (2) Complete and optimize Google Business Profile, (3) Implement a systematic review collection process, (4) Launch a blog targeting local SEO keywords.`,
      progress: 100,
      startedAt: new Date("2026-02-10T09:00:00Z"),
      finishedAt: new Date("2026-02-10T09:03:22Z"),
    },
  });

  // ─── Demo Audit Findings (14 findings across 6 categories) ───
  const findings = [
    // WEBSITE (3)
    {
      id: "demo-finding-1",
      auditRunId: "demo-audit-1",
      category: "website",
      title: "No clear call-to-action above the fold",
      detail: `The homepage of acmecoffee.example.com does not have a prominent call-to-action button visible without scrolling. Research shows that 68% of small business websites make this mistake, resulting in up to 40% lower conversion rates. For a coffee shop with 3 locations, the primary CTA should be "Order Online" or "Find a Location" — displayed in a contrasting color (e.g., amber on dark background) within the first viewport. Secondary CTAs like "Join Our Rewards Program" and "See Today's Specials" should appear just below the fold. Each page on the site should have ONE clear primary action that guides visitors toward conversion.`,
      severity: "CRITICAL" as const,
      fixable: true,
      fixed: false,
    },
    {
      id: "demo-finding-2",
      auditRunId: "demo-audit-1",
      category: "website",
      title: "No online ordering capability detected",
      detail: `No online ordering system was found on the website. In 2026, 73% of food & beverage customers expect to be able to order online for pickup or delivery. Competitor analysis of Austin coffee shops shows that businesses with online ordering see 2-3x more revenue from digital channels. Recommended solutions include Square Online, Toast, or Shopify integration — all of which can be set up within a day and linked prominently from the homepage and Google Business Profile. With 2,000 monthly customers and an $8.50 average order value, even capturing 10% of orders online would add $17,000/month in tracked digital revenue.`,
      severity: "HIGH" as const,
      fixable: true,
      fixed: false,
    },
    {
      id: "demo-finding-3",
      auditRunId: "demo-audit-1",
      category: "website",
      title: "Mobile experience needs optimization",
      detail: `While the site loads on mobile devices, several UX issues were identified: touch targets for navigation links are smaller than the recommended 48x48px minimum, there is no sticky mobile CTA bar for quick ordering, and hero images are not optimized for mobile viewport sizes (causing slow load on 4G connections). Given that 67% of local business searches happen on mobile, optimizing the mobile experience is essential for converting foot traffic and drive-by customers searching "coffee near me."`,
      severity: "MEDIUM" as const,
      fixable: true,
      fixed: true,
    },
    // SEO (3)
    {
      id: "demo-finding-4",
      auditRunId: "demo-audit-1",
      category: "seo",
      title: "Missing meta descriptions on all pages",
      detail: `None of the key pages (homepage, menu, locations, about) have custom meta descriptions. This means Google is auto-generating snippets from page content — often poorly, sometimes pulling footer text or navigation elements. Custom meta descriptions improve click-through rates by 5-10% on average. Each page should have a unique, compelling meta description under 160 characters that includes the target keyword naturally. For example, the homepage meta should be: "Acme Coffee Shop — Austin's favorite artisan coffee. 3 locations, fresh roasted daily. Order online for pickup or visit us today."`,
      severity: "HIGH" as const,
      fixable: true,
      fixed: false,
    },
    {
      id: "demo-finding-5",
      auditRunId: "demo-audit-1",
      category: "seo",
      title: "No blog or content marketing strategy",
      detail: `No blog section was found on the website. Businesses with active blogs receive 55% more website visitors and 67% more leads than those without. For a local coffee shop, recommended blog topics include: "Best Coffee Brewing Methods for Home" (targets informational searches), "Austin's Hidden Coffee Gems" (targets local traffic), "How We Source Our Beans" (builds brand story), and "Coffee Events in Austin This Month" (community content). Publishing 2-4 posts per month targeting keywords like "best coffee Austin TX," "artisan coffee near me," and "specialty coffee shop Austin" would significantly improve organic search visibility within 3-6 months.`,
      severity: "HIGH" as const,
      fixable: true,
      fixed: false,
    },
    {
      id: "demo-finding-6",
      auditRunId: "demo-audit-1",
      category: "seo",
      title: "No local keyword optimization",
      detail: `Page titles and headings do not include location-specific keyword variations. The homepage title is simply "Acme Coffee Shop" instead of "Acme Coffee Shop — Artisan Coffee in Austin, TX." Key pages should target: "coffee shop Austin" (2,400 monthly searches), "best coffee near me" (14,800/mo), "specialty coffee Austin TX" (880/mo). Adding location schema markup (LocalBusiness structured data) would also help Google understand the business's service areas and display rich results with ratings, hours, and location info.`,
      severity: "MEDIUM" as const,
      fixable: true,
      fixed: false,
    },
    // SOCIAL (2)
    {
      id: "demo-finding-7",
      auditRunId: "demo-audit-1",
      category: "social",
      title: "Missing presence on Facebook and LinkedIn",
      detail: `Only an Instagram account was detected. While Instagram is excellent for visual food content, Facebook remains the #1 platform for local business discovery among the 35+ demographic — which represents a significant portion of the specialty coffee market. 42% of consumers use Facebook to find local businesses. A Facebook Business Page with cross-posted Instagram content, community group engagement, and occasional targeted ads ($5-10/day to local ZIP codes) would expand reach significantly. LinkedIn is less critical for a coffee shop but could be valuable for corporate catering leads and B2B partnerships.`,
      severity: "MEDIUM" as const,
      fixable: true,
      fixed: false,
    },
    {
      id: "demo-finding-8",
      auditRunId: "demo-audit-1",
      category: "social",
      title: "Inconsistent Instagram posting frequency",
      detail: `Instagram posts average 2-3 times per month, well below the recommended 3-5 times per week for algorithm visibility. Accounts posting daily see 2x more engagement than those posting weekly. Recommended content mix: 40% product shots (latte art, new menu items), 30% behind-the-scenes (roasting process, team highlights), 20% customer features (user-generated content, testimonials), 10% local Austin content (events, neighborhood features). Use scheduling tools like Later or Buffer to maintain consistency. Instagram Reels showing drink preparation get 3x the reach of static posts.`,
      severity: "LOW" as const,
      fixable: true,
      fixed: true,
    },
    // OFFER (2)
    {
      id: "demo-finding-9",
      auditRunId: "demo-audit-1",
      category: "offer",
      title: "No pricing or menu displayed on website",
      detail: `Visitors cannot see menu items or prices without physically visiting the store or calling. Research shows that businesses with transparent pricing on their website see 35% higher conversion rates. 87% of consumers say menu and pricing availability influences their decision to visit a food establishment. Create a dedicated /menu page with: all items organized by category (Hot Drinks, Cold Drinks, Pastries, Food), prices clearly displayed, high-quality photos for signature items, dietary labels (vegan, gluten-free, dairy-free), and schema markup for rich results in Google searches.`,
      severity: "HIGH" as const,
      fixable: true,
      fixed: false,
    },
    {
      id: "demo-finding-10",
      auditRunId: "demo-audit-1",
      category: "offer",
      title: "No loyalty program or upsell strategy",
      detail: `With an average order value of $8.50 and 2,000 monthly customers, there is significant revenue potential in a loyalty/rewards program. Industry data shows that loyalty program members spend 25-40% more per visit and visit 20% more frequently. A simple digital punch card ("Buy 9 drinks, get the 10th free") with email capture at signup could generate an additional $8,500-$13,600/month. Upsell prompts at checkout ("+$1.50 for an extra shot" or "Add a pastry for $3") can increase AOV by 15-20%.`,
      severity: "MEDIUM" as const,
      fixable: true,
      fixed: false,
    },
    // REPUTATION (2)
    {
      id: "demo-finding-11",
      auditRunId: "demo-audit-1",
      category: "reputation",
      title: "No systematic review collection process",
      detail: `The business has only 23 Google reviews after 5+ years of operation — significantly below the industry average of 80+ for established local coffee shops. 92% of consumers read online reviews before visiting a local business, and businesses with 50+ reviews see 4.6x more profile views on Google. There is no automated post-purchase review request system in place. Recommended: implement an email/SMS review request sent 2 hours after purchase (via receipt email integration or QR code at checkout). Include a direct Google review link. Target: 10+ new reviews per month to reach 100+ within 6 months.`,
      severity: "HIGH" as const,
      fixable: true,
      fixed: false,
    },
    {
      id: "demo-finding-12",
      auditRunId: "demo-audit-1",
      category: "reputation",
      title: "No customer testimonials on website",
      detail: `The website does not display any customer testimonials, reviews, or social proof. Adding a testimonials section to the homepage with 5-10 curated reviews (including customer name, photo if available, and star rating) can increase conversion rates by 34%. Adding review schema markup also enables Google to display star ratings in search results, increasing click-through rates by up to 35%. Pull the best reviews from Google and display them prominently on the homepage and location pages.`,
      severity: "MEDIUM" as const,
      fixable: true,
      fixed: false,
    },
    // LOCAL (2)
    {
      id: "demo-finding-13",
      auditRunId: "demo-audit-1",
      category: "local",
      title: "Google Business Profile incomplete",
      detail: `A Google Business Profile exists but is missing several key elements: holiday hours are not set (causing customer confusion during holidays), only 5 photos are uploaded (top-performing profiles have 20+), the menu link is missing, messaging is not enabled, the Q&A section has no proactive FAQs, and weekly Google Posts are not being published. Fully optimizing the GBP — especially adding 20+ high-quality interior, menu, and team photos — can increase profile views by 42% and direction requests by 35%.`,
      severity: "MEDIUM" as const,
      fixable: true,
      fixed: true,
    },
    {
      id: "demo-finding-14",
      auditRunId: "demo-audit-1",
      category: "local",
      title: "Inconsistent NAP across directory listings",
      detail: `The business Name, Address, and Phone (NAP) information differs across Google, Yelp, and Yellow Pages. One listing shows "Acme Coffee" while another shows "Acme Coffee Shop LLC." The phone format varies between (512) 555-0123 and 512-555-0123. NAP consistency is a key local SEO ranking factor — Google cross-references these listings to verify business legitimacy. Audit all directory listings and ensure the business name, address, and phone number are identical everywhere. Consider using a citation management tool like BrightLocal or Moz Local to automate this.`,
      severity: "LOW" as const,
      fixable: true,
      fixed: false,
    },
  ];

  for (const f of findings) {
    await db.auditFinding.upsert({
      where: { id: f.id },
      update: {},
      create: f,
    });
  }

  // ─── Demo Repair Plan ────────────────────────────────────────
  await db.repairPlan.upsert({
    where: { id: "demo-plan-1" },
    update: {},
    create: {
      id: "demo-plan-1",
      businessProfileId: "demo-business-1",
      title: "Recovery Plan for Acme Coffee Shop",
      summary: `Based on the diagnostic audit (score: 52/100), this 30/60/90-day recovery plan addresses the 14 identified issues for Acme Coffee Shop. Priority is given to high-impact quick wins: website CTAs, online ordering, and Google Business Profile optimization in the first 30 days. Phase 2 builds SEO and social media foundations. Phase 3 focuses on scaling with loyalty programs, content marketing, and reputation management. Estimated total implementation time: 30-45 hours spread over 90 days. Expected outcome: 70+ overall score within 90 days, with measurable increases in online orders, Google visibility, and customer retention.`,
    },
  });

  // ─── Demo Plan Tasks (12 tasks) ──────────────────────────────
  const tasks = [
    // DAY_30 — Quick wins (4 tasks, 3 completed)
    {
      id: "demo-task-1",
      repairPlanId: "demo-plan-1",
      phase: "DAY_30" as const,
      title: "Add prominent call-to-action buttons to homepage",
      description: `Add "Order Online", "Find a Location", and "Join Acme Rewards" buttons above the fold on the homepage. Use contrasting amber color on the dark background for maximum visibility. Each page should have ONE primary action. Position the main CTA within the first viewport — no scrolling required. Add a sticky mobile CTA bar that stays visible while scrolling on phones.`,
      impact: "high",
      timeEstimate: "2-4 hours",
      completed: true,
      sortOrder: 0,
    },
    {
      id: "demo-task-2",
      repairPlanId: "demo-plan-1",
      phase: "DAY_30" as const,
      title: "Set up online ordering system",
      description: `Integrate an online ordering platform (Square Online, Toast, or Shopify). Link it prominently from the homepage hero section and Google Business Profile. Enable both pickup and delivery options for all 3 Austin locations. Add the ordering link to every page header and the mobile sticky bar. Configure automated order confirmation emails.`,
      impact: "high",
      timeEstimate: "4-6 hours",
      completed: true,
      sortOrder: 1,
    },
    {
      id: "demo-task-3",
      repairPlanId: "demo-plan-1",
      phase: "DAY_30" as const,
      title: "Add full menu with prices to website",
      description: `Create a dedicated /menu page with all items organized by category (Hot Drinks, Cold Drinks, Pastries, Food). Display prices clearly next to each item. Add high-quality photos for at least the top 10 signature items. Include dietary labels (vegan ✓, gluten-free ✓, dairy-free ✓). Add LocalBusiness and Menu schema markup for rich Google search results.`,
      impact: "high",
      timeEstimate: "2-3 hours",
      completed: false,
      sortOrder: 2,
    },
    {
      id: "demo-task-4",
      repairPlanId: "demo-plan-1",
      phase: "DAY_30" as const,
      title: "Optimize Google Business Profile",
      description: `Complete all missing GBP elements: set holiday hours for the next 6 months, upload 20+ photos (interior of each location, signature drinks, pastries, team photos, exterior signage), add the menu link, enable messaging, write 5 proactive Q&A entries (parking, wifi, pet-friendly, hours, catering), publish a weekly Google Post with specials, and respond to all existing 23 reviews with personalized responses.`,
      impact: "high",
      timeEstimate: "3-4 hours",
      completed: true,
      sortOrder: 3,
    },
    // DAY_60 — Build momentum (4 tasks, 0 completed)
    {
      id: "demo-task-5",
      repairPlanId: "demo-plan-1",
      phase: "DAY_60" as const,
      title: "Write meta descriptions for all pages",
      description: `Craft unique, keyword-rich meta descriptions (under 160 characters) for the homepage, menu, all 3 location pages, about page, and contact page. Include "Austin coffee shop" and location-specific terms. Homepage example: "Acme Coffee Shop — Austin's favorite artisan coffee. 3 locations, fresh roasted daily. Order online for pickup." Verify all pages have unique title tags too.`,
      impact: "medium",
      timeEstimate: "1-2 hours",
      completed: false,
      sortOrder: 4,
    },
    {
      id: "demo-task-6",
      repairPlanId: "demo-plan-1",
      phase: "DAY_60" as const,
      title: "Launch blog with local SEO content",
      description: `Create a blog section on the website. Publish the first 4 articles targeting: "Best Coffee Shops in Austin TX" (listicle featuring Acme), "How We Source Our Single-Origin Beans" (brand story), "Austin Coffee Events This Month" (community content), and "Home Brewing Tips from Our Baristas" (informational). Aim for 2-4 posts/month going forward, each 800-1200 words with location keywords.`,
      impact: "medium",
      timeEstimate: "3-5 hours",
      completed: false,
      sortOrder: 5,
    },
    {
      id: "demo-task-7",
      repairPlanId: "demo-plan-1",
      phase: "DAY_60" as const,
      title: "Establish Facebook business page",
      description: `Create and optimize a Facebook Business Page. Upload cover photo, profile photo, complete all business info fields. Cross-post Instagram content automatically (use Meta Business Suite). Join Austin local business and foodie groups. Plan a "Free coffee for first 50 followers" giveaway to build initial audience. Set up Facebook Messenger auto-replies for common questions (hours, locations, menu).`,
      impact: "medium",
      timeEstimate: "2-3 hours",
      completed: false,
      sortOrder: 6,
    },
    {
      id: "demo-task-8",
      repairPlanId: "demo-plan-1",
      phase: "DAY_60" as const,
      title: "Implement automated review request system",
      description: `Set up a post-purchase email/SMS workflow that asks customers for a Google review 2 hours after their visit or order. Include a direct Google review link (not just the Maps listing). Use a tool like Podium, Birdeye, or build a simple Mailchimp automation. Add a QR code at checkout counters linking to the review page. Target: 10+ new reviews per month. Goal: reach 80+ total reviews within 6 months.`,
      impact: "medium",
      timeEstimate: "2-4 hours",
      completed: false,
      sortOrder: 7,
    },
    // DAY_90 — Scale (4 tasks, 0 completed)
    {
      id: "demo-task-9",
      repairPlanId: "demo-plan-1",
      phase: "DAY_90" as const,
      title: "Launch customer loyalty/rewards program",
      description: `Implement a digital loyalty program: "Buy 9 drinks, get the 10th free." Use Square Loyalty, Stamp Me, or a custom solution. Capture customer email at signup. With 2,000 monthly customers and $8.50 AOV, even 20% adoption rate with 25% higher spend per loyal customer = ~$10,200/month in additional revenue. Send monthly loyalty-exclusive offers and early access to new menu items.`,
      impact: "low",
      timeEstimate: "4-6 hours",
      completed: false,
      sortOrder: 8,
    },
    {
      id: "demo-task-10",
      repairPlanId: "demo-plan-1",
      phase: "DAY_90" as const,
      title: "Fix NAP consistency across all directories",
      description: `Audit all directory listings: Google Business Profile, Yelp, Yellow Pages, Apple Maps, Bing Places, TripAdvisor, Foursquare. Ensure the business name ("Acme Coffee Shop"), address, and phone number are identical across all platforms. Remove duplicate or outdated listings. Use BrightLocal or Moz Local to automate ongoing monitoring. Consistent NAP is a top-3 local SEO ranking factor.`,
      impact: "low",
      timeEstimate: "1-2 hours",
      completed: false,
      sortOrder: 9,
    },
    {
      id: "demo-task-11",
      repairPlanId: "demo-plan-1",
      phase: "DAY_90" as const,
      title: "Optimize Instagram content strategy",
      description: `Increase posting frequency to 4-5x per week using a content calendar. Content mix: 40% product shots (latte art, new items), 30% behind-the-scenes (roasting, team), 20% customer features (UGC, testimonials), 10% local Austin content (events, neighborhood). Schedule posts with Later or Buffer. Prioritize Instagram Reels (drink preparation videos get 3x reach vs static posts). Use local hashtags: #AustinCoffee #ATXEats #AustinFoodie.`,
      impact: "low",
      timeEstimate: "1-2 hours",
      completed: false,
      sortOrder: 10,
    },
    {
      id: "demo-task-12",
      repairPlanId: "demo-plan-1",
      phase: "DAY_90" as const,
      title: "Add testimonials section to website",
      description: `Curate 8-10 best customer reviews from Google. Create a testimonials carousel on the homepage showing: customer first name, star rating, review snippet, and date. Add Review schema markup to enable Google to display star ratings in search results (increases CTR by up to 35%). Also create a dedicated /reviews page with all reviews and a CTA to leave a new review.`,
      impact: "low",
      timeEstimate: "1-3 hours",
      completed: false,
      sortOrder: 11,
    },
  ];

  for (const t of tasks) {
    await db.planTask.upsert({
      where: { id: t.id },
      update: {},
      create: t,
    });
  }

  // ─── Demo Assets (4 assets with real content) ────────────────
  const assets = [
    {
      id: "demo-asset-1",
      repairPlanId: "demo-plan-1",
      type: "WEBSITE_COPY" as const,
      title: "Website Copy & CTAs for Acme Coffee Shop",
      content: `# Website Copy — Acme Coffee Shop

## Hero Section
**Headline:** Austin's Favorite Artisan Coffee
**Subheadline:** Crafted with love at three Austin locations. Fresh roasted daily from single-origin beans.

**Primary CTA:** [Order for Pickup] — Large amber button
**Secondary CTA:** [Find Your Nearest Location] — Outline button

---

## About Section
### Our Story
What started as a single espresso cart at the Austin Farmers Market in 2021 has grown into three beloved neighborhood coffee shops. We source single-origin beans from small farms in Colombia, Ethiopia, and Guatemala, roasting them in small batches at our East Austin roastery.

Every cup is crafted by skilled baristas who care about your morning ritual as much as you do.

---

## Value Propositions (3-column grid)

**Fresh Roasted Daily**
Our beans are roasted within 48 hours of serving. We never use pre-ground or pre-packaged coffee.

**3 Austin Locations**
East Austin · South Lamar · Downtown. All within 10 minutes of the city center.

**Order Online**
Skip the line. Order ahead for pickup at any location through our app or website.

---

## Menu Teaser Section
### Today's Specials
- **Honey Lavender Latte** — $6.50 — House favorite
- **Cold Brew Flight** — $9.00 — Try all 3 single-origins
- **Acme Breakfast Sandwich** — $7.50 — Egg, cheese, bacon on sourdough

[View Full Menu →]

---

## Social Proof Section
### What Austin Says About Us
"Best latte I've had in Austin. The honey lavender is incredible." — Sarah M. ★★★★★
"My go-to work-from-home spot. Great wifi, better coffee." — James T. ★★★★★
"The baristas actually remember your name and order." — Maria L. ★★★★★

---

## CTA Variations
- Hero: "Order for Pickup"
- Menu page: "Order This Item"
- Location pages: "Get Directions" / "Order from This Location"
- Footer: "Join Acme Rewards — Earn Free Drinks"
- Exit popup: "Wait! Get 10% off your first online order"

---

## Meta Descriptions
- **Homepage:** "Acme Coffee Shop — Austin's favorite artisan coffee. 3 locations, fresh roasted daily. Order online for pickup or visit us today."
- **Menu:** "See our full menu with prices. Single-origin lattes, cold brew, pastries & breakfast. Order online for pickup at any Austin location."
- **Locations:** "Find your nearest Acme Coffee Shop in Austin, TX. East Austin, South Lamar & Downtown. Hours, directions & order ahead."
- **About:** "Our story: from a farmers market cart to 3 Austin locations. Learn about our single-origin sourcing and small-batch roasting process."`,
    },
    {
      id: "demo-asset-2",
      repairPlanId: "demo-plan-1",
      type: "SEO_PLAN" as const,
      title: "SEO Strategy & Content Plan",
      content: `# SEO Strategy — Acme Coffee Shop

## Target Keywords

### Primary (High Intent)
| Keyword | Monthly Searches | Difficulty | Priority |
|---------|-----------------|------------|----------|
| coffee shop austin | 2,400 | Medium | ★★★ |
| best coffee austin tx | 1,900 | Medium | ★★★ |
| coffee near me | 14,800 | Low (local) | ★★★ |
| artisan coffee austin | 720 | Low | ★★★ |

### Secondary (Informational)
| Keyword | Monthly Searches | Difficulty | Priority |
|---------|-----------------|------------|----------|
| specialty coffee austin | 880 | Low | ★★ |
| coffee shop with wifi austin | 390 | Low | ★★ |
| cold brew austin | 260 | Low | ★★ |
| latte art austin | 170 | Low | ★ |

---

## Content Calendar (Month 1)

**Week 1:** "The 10 Best Coffee Shops in Austin TX (2026 Guide)" — 1,500 words, targets "best coffee austin"
**Week 2:** "How We Source Our Single-Origin Beans: From Farm to Cup" — 1,000 words, brand story + "artisan coffee" keywords
**Week 3:** "Austin Coffee Events This Month" — 800 words, community content, shareable
**Week 4:** "Home Brewing Tips From Our Head Barista" — 1,200 words, targets informational "how to make latte at home"

---

## On-Page Optimization Checklist

- [ ] Homepage title: "Acme Coffee Shop — Artisan Coffee in Austin, TX"
- [ ] Each location page has unique title with neighborhood name
- [ ] All pages have custom meta descriptions (under 160 chars)
- [ ] H1 tags contain primary keyword on each page
- [ ] Image alt text includes "Austin coffee shop" variations
- [ ] Internal links from blog posts to menu and location pages
- [ ] LocalBusiness schema markup on all pages
- [ ] Menu schema markup on /menu page
- [ ] Review schema markup with aggregate rating

---

## Technical SEO

- [ ] Submit XML sitemap to Google Search Console
- [ ] Ensure mobile-first indexing compatibility
- [ ] Page load under 3 seconds on mobile
- [ ] Set up Google Analytics 4 + Search Console
- [ ] Configure canonical URLs to prevent duplicate content
- [ ] Add hreflang if expanding beyond English

---

## Local SEO Actions

- [ ] Fully optimize Google Business Profile (photos, hours, menu link)
- [ ] Claim/update Yelp, Apple Maps, Bing Places listings
- [ ] Ensure NAP consistency across all 15+ directories
- [ ] Build local citations on Austin-specific directories
- [ ] Get featured on "best coffee in Austin" listicle blogs
- [ ] Partner with Austin food bloggers for reviews and mentions`,
    },
    {
      id: "demo-asset-3",
      repairPlanId: "demo-plan-1",
      type: "AD_COPY" as const,
      title: "Social Media Ad Copy",
      content: `# Social Media Ad Copy — Acme Coffee Shop

## Campaign 1: Awareness (New Customers)

**Platform:** Instagram & Facebook
**Objective:** Reach new local audience
**Budget:** $5-10/day
**Targeting:** Austin, TX — 5 mile radius, age 22-55, interests: coffee, specialty coffee, local food

**Headline:** Discover Austin's Best-Kept Coffee Secret
**Body:** Hand-roasted single-origin beans. Three cozy locations. One unforgettable cup. ☕ Visit Acme Coffee Shop and taste the difference artisan coffee makes.
**CTA:** Learn More → /locations
**Visual:** Latte art close-up with Austin skyline in background

---

## Campaign 2: First Visit Promotion

**Platform:** Instagram & Facebook
**Objective:** Drive first-time visits
**Budget:** $8/day
**Targeting:** Austin, TX — 3 mile radius from each location, exclude existing customers

**Headline:** Your First Latte Is On Us
**Body:** Never been to Acme? Show this ad at any of our 3 Austin locations and get your first drink free (up to $7). Valid this month only.
**CTA:** Get Offer → /first-visit
**Visual:** Barista handing over a beautifully crafted latte

---

## Campaign 3: Loyalty Program Launch

**Platform:** Instagram Stories & Facebook Feed
**Objective:** App downloads / loyalty signups
**Budget:** $5/day
**Targeting:** Existing customers (website visitors, past engagement)

**Headline:** Earn Free Coffee — Join Acme Rewards
**Body:** Buy 9 drinks, get the 10th FREE. Plus, get a birthday drink on us and early access to seasonal specials. Sign up takes 30 seconds.
**CTA:** Sign Up Free → /rewards
**Visual:** Rewards card animation showing stamps filling up

---

## Campaign 4: Seasonal Special

**Platform:** Instagram Reels & Facebook
**Objective:** Promote seasonal menu
**Budget:** $6/day
**Targeting:** Austin metro, past visitors + lookalike audience

**Headline:** Spring Specials Have Arrived 🌸
**Body:** Introducing the Honey Lavender Cold Brew and Matcha Rose Latte. Available for a limited time at all Acme locations. Order ahead to skip the line.
**CTA:** Order Now → /menu
**Visual:** 15-second Reel showing both drinks being prepared

---

## Campaign 5: Retargeting (Website Visitors)

**Platform:** Facebook & Instagram
**Objective:** Convert website visitors who didn't order
**Budget:** $3/day
**Targeting:** Website visitors (last 30 days) who didn't complete an order

**Headline:** Forgot Something? Your Coffee Is Waiting ☕
**Body:** You browsed our menu but didn't order. Skip the line — order ahead for pickup at your nearest Acme location. Ready in 5 minutes.
**CTA:** Order for Pickup → /order
**Visual:** Coffee cup with steam, warm lighting`,
    },
    {
      id: "demo-asset-4",
      repairPlanId: "demo-plan-1",
      type: "EMAIL_SEQUENCE" as const,
      title: "Customer Email Sequence",
      content: `# Welcome & Nurture Email Sequence — Acme Coffee Shop

## Email 1: Welcome (Sent immediately on signup)

**Subject:** Welcome to Acme! Here's 10% off your first online order ☕
**Preview:** Your discount code is inside...

**Body:**
Hi {{first_name}},

Welcome to the Acme Coffee family! We're thrilled to have you.

As a thank-you for joining, here's **10% off your first online order:**

**Code: WELCOME10**

Use it at acmecoffee.example.com/order — available for pickup at all 3 Austin locations.

Not sure what to try? Our most popular orders:
- 🥇 Honey Lavender Latte ($6.50)
- 🥈 Single-Origin Pour Over ($5.00)
- 🥉 Cold Brew Flight — try all 3 origins ($9.00)

See you soon!
— The Acme Team

---

## Email 2: Our Story (Day 3)

**Subject:** How a farmers market cart became Austin's favorite coffee shop
**Preview:** From one espresso cart to three locations...

**Body:**
Hi {{first_name}},

In 2021, our founder Maria started with a single espresso cart at the Austin Farmers Market. Her mission: bring truly fresh, single-origin coffee to Austin.

Today, we roast our own beans from small farms in Colombia, Ethiopia, and Guatemala — in small batches at our East Austin roastery. Every bag is roasted within 48 hours of serving.

We don't do "coffee flavor." We do coffee.

Want to see the roastery? Visit our East Austin location and ask for a peek behind the scenes — we love showing off.

☕ Order your next cup: acmecoffee.example.com/order

---

## Email 3: Menu Highlights (Day 7)

**Subject:** This week's specials + your favorites
**Preview:** New seasonal items just dropped...

**Body:**
Hi {{first_name}},

Here's what's new and what's been flying off the counter this week:

**🆕 New This Week**
- Cardamom Rose Latte — $7.00
- Espresso Brownie — $4.50

**🔥 Customer Favorites**
- Honey Lavender Latte — the #1 seller 3 months running
- Acme Breakfast Sandwich — egg, cheese, bacon on sourdough

**📍 Order ahead for instant pickup** at any of our 3 locations.

[Order Now →]

---

## Email 4: Referral (Day 14)

**Subject:** Give a free coffee, get a free coffee
**Preview:** Share the love — literally

**Body:**
Hi {{first_name}},

Love Acme Coffee? Your friends will too.

**Here's the deal:** Share your personal referral link with a friend. When they make their first order, you BOTH get a free drink (any size, any drink).

Your referral link: acmecoffee.example.com/refer/{{referral_code}}

No limit. The more friends you refer, the more free coffee you earn. ☕☕☕

---

## Email 5: Review Request + Loyalty (Day 21)

**Subject:** Quick favor? (takes 30 seconds)
**Preview:** Help us grow + join Acme Rewards

**Body:**
Hi {{first_name}},

You've been part of the Acme family for a few weeks now, and we'd love to hear how we're doing.

**Would you leave us a quick Google review?** It takes 30 seconds and helps other Austin coffee lovers find us.

[Leave a Review ★★★★★ →]

---

**P.S.** Have you joined **Acme Rewards** yet? Buy 9 drinks, get the 10th free. Plus a free drink on your birthday. 🎂

[Join Acme Rewards →]`,
    },
  ];

  for (const a of assets) {
    await db.asset.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }

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

  const adminWs = await db.workspace.upsert({
    where: { slug: "admin-workspace" },
    update: {
      whiteLabelEnabled: true,
      customBrandName: "GrowthPilot Agency",
      customDomain: "app.growthpilot.io",
    },
    create: {
      name: "GrowthPilot Agency",
      slug: "admin-workspace",
      plan: "AGENCY",
      whiteLabelEnabled: true,
      customBrandName: "GrowthPilot Agency",
      customDomain: "app.growthpilot.io",
      memberships: { create: { userId: admin.id, role: "OWNER" } },
      subscription: { create: { planTier: "AGENCY", status: "active" } },
    },
  });

  // Admin workspace sample client business
  await db.businessProfile.upsert({
    where: { id: "admin-business-1" },
    update: {},
    create: {
      id: "admin-business-1",
      workspaceId: adminWs.id,
      name: "Sunrise Fitness Studio",
      industry: "Health & Fitness",
      country: "US",
      city: "Denver",
      websiteUrl: "https://sunrisefitness.example.com",
      description: "Boutique fitness studio offering yoga, pilates, and HIIT classes across 2 Denver locations.",
      revenueRange: "$250K-$1M",
      customersMonth: 500,
      avgOrderValue: 45,
      marketingBudget: 1200,
      teamSize: 8,
      primaryGoal: "MORE_LEADS",
      mainPain: "LOW_CONVERSIONS",
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
  console.log("  Agency demo:  admin@tasknator.com / admin1234 (Agency + white-label)");
  console.log("  Admin panel:  admin@tasknator.com / admin1234 (Super Admin)");
  console.log("  Demo data: 1 audit (14 findings), 1 plan (12 tasks), 4 assets");
  console.log(`  Blog posts: ${posts.length} articles`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
