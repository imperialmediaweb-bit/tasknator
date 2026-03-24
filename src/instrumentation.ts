export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { ensureSchema } = await import("./lib/ensure-schema");
      await ensureSchema();
    } catch {
      // Schema check is non-fatal — DB may already be provisioned
    }

    if (process.env.SEED_DEMO_DATA === "true") {
      try {
        const { db } = await import("./lib/db");
        const bcrypt = await import("bcryptjs");

        const adminEmail = process.env.ADMIN_EMAIL || "admin@tasknator.com";
        const adminPass = process.env.ADMIN_PASSWORD;
        if (adminPass) {
          const adminExists = await db.user.findUnique({ where: { email: adminEmail } });
          if (!adminExists) {
            const hash = await bcrypt.hash(adminPass, 12);
            const admin = await db.user.create({
              data: {
                name: "Admin",
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
          }
        }

        const postCount = await db.blogPost.count();
        if (postCount === 0) {
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
        }
      } catch {
        // Seed error is non-fatal
      }
    }
  }
}
