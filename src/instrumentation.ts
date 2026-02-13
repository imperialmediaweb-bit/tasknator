export async function register() {
  // Only run on Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Ensure schema is up-to-date before seeding
    try {
      const { execSync } = await import("child_process");
      console.log("[bootstrap] Ensuring database schema...");
      execSync("npx prisma db push --skip-generate", {
        timeout: 30_000,
        stdio: "pipe",
      });
      console.log("[bootstrap] Schema verified.");
    } catch (e: any) {
      console.warn("[bootstrap] Schema push skipped:", e.message?.slice(0, 200));
    }

    try {
      const { db } = await import("./lib/db");
      const bcrypt = await import("bcryptjs");

      // ── Admin user ──────────────────────────────────────
      const adminEmail = "admin@tasknator.com";
      const adminExists = await db.user.findUnique({ where: { email: adminEmail } });

      if (!adminExists) {
        console.log("[bootstrap] Creating admin user...");
        const hash = await bcrypt.hash("admin1234", 12);
        const admin = await db.user.create({
          data: {
            name: "Super Admin",
            email: adminEmail,
            passwordHash: hash,
            isAdmin: true,
          },
        });

        await db.workspace.create({
          data: {
            name: "Admin Workspace",
            slug: "admin-workspace",
            plan: "AGENCY",
            memberships: { create: { userId: admin.id, role: "OWNER" } },
            subscription: { create: { planTier: "AGENCY", status: "active" } },
          },
        });
        console.log("[bootstrap] Admin user created: admin@tasknator.com / admin1234");
      }

      // ── Demo user ───────────────────────────────────────
      const demoEmail = "demo@tasknator.com";
      const demoExists = await db.user.findUnique({ where: { email: demoEmail } });

      if (!demoExists) {
        console.log("[bootstrap] Creating demo user...");
        const hash = await bcrypt.hash("demo1234", 12);
        const demo = await db.user.create({
          data: {
            name: "Demo User",
            email: demoEmail,
            passwordHash: hash,
            isAdmin: false,
          },
        });

        const demoWs = await db.workspace.create({
          data: {
            name: "Demo Workspace",
            slug: "demo-workspace",
            plan: "PRO",
            memberships: { create: { userId: demo.id, role: "OWNER" } },
            subscription: { create: { planTier: "PRO", status: "active" } },
          },
        });

        await db.businessProfile.create({
          data: {
            id: "demo-business-1",
            workspaceId: demoWs.id,
            name: "Acme Coffee Shop",
            industry: "Food & Beverage",
            country: "US",
            city: "Austin",
            websiteUrl: "https://acmecoffee.example.com",
            description:
              "Local artisan coffee shop with 3 locations in Austin, TX.",
            revenueRange: "$100K-$500K",
            customersMonth: 2000,
            avgOrderValue: 8.5,
            marketingBudget: 500,
            teamSize: 12,
            primaryGoal: "MORE_LEADS",
            mainPain: "NO_CALLS",
          },
        });
        console.log("[bootstrap] Demo user created: demo@tasknator.com / demo1234");
      }

      // ── Blog posts ──────────────────────────────────────
      const postCount = await db.blogPost.count();
      if (postCount === 0) {
        console.log("[bootstrap] Seeding blog posts...");
        const posts = [
          {
            slug: "why-small-businesses-fail-online",
            title: "Why 73% of Small Businesses Fail Online (And How AI Can Fix It)",
            excerpt: "Most small businesses make the same critical mistakes online. Here's what our data reveals.",
            content: "## The Silent Killer of Small Businesses\n\nEvery year, thousands of small businesses invest in websites, social media, and digital marketing — only to see little to no return.\n\n### 1. No Clear Call-to-Action\n\n**68% of small business websites** lack a clear, compelling call-to-action above the fold.\n\n### 2. Missing Meta Descriptions\n\n**54% of audited businesses** have incomplete or missing meta descriptions.\n\n### 3. No Google Business Profile\n\n**41% of local businesses** either don't have a Google Business Profile or haven't optimized it.\n\n**Ready to find out what's broken?** [Start your free audit today](/register).",
            category: "Business Tips",
            authorName: "Tasknator Team",
            published: true,
            publishedAt: new Date("2026-01-15"),
          },
          {
            slug: "ai-business-audit-explained",
            title: "What Is an AI Business Audit? Everything You Need to Know",
            excerpt: "An AI business audit uses machine learning to diagnose problems across your website, SEO, social media, and offers.",
            content: "## What Is an AI Business Audit?\n\nAn AI business audit is an automated diagnostic process that analyzes your business's digital presence across multiple dimensions.\n\n### How It Works\n\n1. **Data Collection** — You provide your business details and website URL\n2. **AI Analysis** — Our models analyze every aspect of your digital presence\n3. **Scoring** — You receive scores across 6 categories\n4. **Findings** — Specific issues are identified with severity ratings\n5. **Repair Plan** — A prioritized action plan is generated automatically\n\n[Try it free](/register).",
            category: "Product",
            authorName: "Tasknator Team",
            published: true,
            publishedAt: new Date("2026-01-22"),
          },
          {
            slug: "5-marketing-mistakes-costing-revenue",
            title: "5 Marketing Mistakes Costing You Revenue Right Now",
            excerpt: "These common marketing mistakes silently drain your budget. Learn how to identify and fix them.",
            content: "## Marketing Mistakes That Kill Revenue\n\n### Mistake #1: Targeting Everyone\nWhen you try to appeal to everyone, you appeal to no one.\n\n### Mistake #2: No Email List\nSocial media followers aren't yours — they're rented.\n\n### Mistake #3: Ignoring Reviews\nIgnoring reviews signals to potential customers that you don't care.\n\n### Mistake #4: No Follow-Up System\n80% of sales require 5+ touchpoints.\n\n### Mistake #5: Copying Competitors\nYour competitors might be making the same mistakes.\n\n[Run your free audit](/register).",
            category: "Marketing",
            authorName: "Tasknator Team",
            published: true,
            publishedAt: new Date("2026-02-01"),
          },
        ];

        for (const post of posts) {
          await db.blogPost.upsert({
            where: { slug: post.slug },
            update: { ...post },
            create: { ...post },
          });
        }
        console.log(`[bootstrap] Seeded ${posts.length} blog posts`);
      }

      console.log("[bootstrap] Database bootstrap complete");
    } catch (error) {
      console.error("[bootstrap] Seed error (non-fatal):", error);
    }
  }
}
