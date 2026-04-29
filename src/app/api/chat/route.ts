import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

type ProviderType = "ANTHROPIC" | "OPENAI" | "GEMINI";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const membership = await db.membership.findFirst({
      where: { userId: user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: "No workspace access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const newChat = searchParams.get("new") === "true";

    // If new=true, create a brand new conversation
    if (newChat) {
      const newConversation = await db.conversation.create({
        data: {
          workspaceId: membership.workspaceId,
          title: "New Chat",
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      const allConversations = await db.conversation.findMany({
        where: { workspaceId: membership.workspaceId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      });

      return NextResponse.json({
        conversationId: newConversation.id,
        messages: [],
        allConversations,
      });
    }

    // If conversationId is provided, load that specific conversation
    if (conversationId) {
      const conversation = await db.conversation.findUnique({
        where: { id: conversationId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });

      if (!conversation || conversation.workspaceId !== membership.workspaceId) {
        return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
      }

      const allConversations = await db.conversation.findMany({
        where: { workspaceId: membership.workspaceId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      });

      return NextResponse.json({
        conversationId: conversation.id,
        messages: conversation.messages,
        allConversations,
      });
    }

    // Otherwise, get the most recent conversation or create a new one
    let conversation = await db.conversation.findFirst({
      where: { workspaceId: membership.workspaceId },
      orderBy: { updatedAt: "desc" },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        data: {
          workspaceId: membership.workspaceId,
          title: "Chat",
        },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    // Get all conversations for the sidebar
    const allConversations = await db.conversation.findMany({
      where: { workspaceId: membership.workspaceId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      messages: conversation.messages,
      allConversations,
    });
  } catch (error) {
    console.error("[CHAT] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const membership = await db.membership.findFirst({
      where: { userId: user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: "No workspace access" }, { status: 403 });
    }

    const { message, conversationId } = await req.json();
    if (!message || !conversationId) {
      return NextResponse.json(
        { error: "Missing message or conversationId" },
        { status: 400 }
      );
    }

    let conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    if (!conversation || conversation.workspaceId !== membership.workspaceId) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Save user message
    const userMessage = await db.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: message,
      },
    });

    // Build AI context
    const workspace = await db.workspace.findUnique({
      where: { id: membership.workspaceId },
      include: {
        businessProfiles: {
          include: {
            auditRuns: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { findings: { orderBy: { severity: "asc" }, take: 10 } },
            },
            repairPlans: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: { tasks: { orderBy: { phase: "asc" } } },
            },
          },
        },
      },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    // Build system prompt with workspace context
    let businessContext = "";
    if (workspace.businessProfiles.length > 0) {
      businessContext = workspace.businessProfiles
        .map((business) => {
          const latestAudit = business.auditRuns[0];
          const latestPlan = business.repairPlans[0];

          let auditInfo = "";
          if (latestAudit) {
            const findings = latestAudit.findings
              .slice(0, 5)
              .map((f) => `${f.severity}: ${f.title}`)
              .join("\n  - ");

            auditInfo = `
  Audit Score: ${latestAudit.overallScore}/100 (Website: ${latestAudit.websiteScore}/100, SEO: ${latestAudit.seoScore}/100, Social: ${latestAudit.socialScore}/100)
  Top Issues: ${findings || "None"}`;
          }

          let planInfo = "";
          if (latestPlan) {
            const day30Tasks = latestPlan.tasks.filter((t) => t.phase === "DAY_30");
            const day60Tasks = latestPlan.tasks.filter((t) => t.phase === "DAY_60");
            const day90Tasks = latestPlan.tasks.filter((t) => t.phase === "DAY_90");

            const day30Done = day30Tasks.filter((t) => t.completed).length;
            const day60Done = day60Tasks.filter((t) => t.completed).length;
            const day90Done = day90Tasks.filter((t) => t.completed).length;

            planInfo = `
  Repair Plan: DAY_30 ${day30Done}/${day30Tasks.length} done, DAY_60 ${day60Done}/${day60Tasks.length} done, DAY_90 ${day90Done}/${day90Tasks.length} done`;
          }

          return `- ${business.name} (${business.industry})${auditInfo}${planInfo}`;
        })
        .join("\n");
    }

    const systemPrompt = `You are an AI business consultant for ${workspace.name}. You have full access to the user's business data:

BUSINESSES:
${businessContext || "No businesses set up yet."}

PLAN TIER: ${workspace.plan}

Your role is to help users understand their audit results, identify their biggest opportunities, prioritize fixes, and implement their recovery plans. Always reference their actual data. Be specific, actionable, and concise. Ask clarifying questions when needed.`;

    // Get prior messages for context
    const priorMessages = conversation.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Call AI
    let aiResponse: string | null = null;
    let aiError: string | null = null;

    const providerKey = await db.providerKey.findFirst({
      where: { workspaceId: membership.workspaceId, isActive: true },
    });

    const platformConfigs = await db.systemConfig.findMany({
      where: { key: { in: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"] } },
    });
    const dbKeys: Record<string, string> = {};
    for (const c of platformConfigs) dbKeys[c.key] = c.value;

    const getKey = (name: string) => {
      const dbKey = dbKeys[name];
      const envKey = process.env[name];
      return dbKey || envKey || "";
    };

    const anthropicKey = getKey("ANTHROPIC_API_KEY");
    const openaiKey = getKey("OPENAI_API_KEY");
    const geminiKey = getKey("GEMINI_API_KEY");

    if (providerKey || anthropicKey || openaiKey || geminiKey) {
      try {
        const { generateWithFallback } = await import("@/lib/ai/provider");
        const { decrypt } = await import("@/lib/crypto");

        const providers: { type: ProviderType; apiKey: string }[] = [];

        if (providerKey) {
          try {
            const decryptedKey = await decrypt(providerKey.encryptedKey, providerKey.nonce);
            providers.push({ type: providerKey.provider as ProviderType, apiKey: decryptedKey });
          } catch {}
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

        if (providers.length === 0) {
          aiError = "No AI providers configured. Please set up an API key in Settings.";
        } else {
          aiResponse = await generateWithFallback(providers, {
            messages: [
              { role: "system", content: systemPrompt },
              ...priorMessages,
              { role: "user", content: message },
            ],
            maxTokens: 1024,
            temperature: 0.7,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        aiError = `AI error: ${msg}`;
      }
    } else {
      aiError = "No AI providers configured. Please set up an API key in Settings.";
    }

    // Update conversation title if it's still default (first message)
    if ((conversation.title === "Chat" || conversation.title === "New Chat") && conversation.messages.length === 0) {
      const titlePreview = message.substring(0, 60).trim();
      await db.conversation.update({
        where: { id: conversation.id },
        data: { title: titlePreview || "Untitled Chat" },
      });
    }

    if (!aiResponse) {
      const errorContent = aiError || "Unable to generate response. Please try again.";
      await db.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: errorContent,
        },
      });

      // Get updated conversation list with new title
      const allConversations = await db.conversation.findMany({
        where: { workspaceId: membership.workspaceId },
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, updatedAt: true },
      });

      return NextResponse.json({
        conversationId: conversation.id,
        reply: errorContent,
        allConversations,
      });
    }

    // Save assistant message
    const assistantMessage = await db.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: aiResponse,
      },
    });

    // Get updated conversation list with new title
    const allConversations = await db.conversation.findMany({
      where: { workspaceId: membership.workspaceId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      reply: aiResponse,
      allConversations,
    });
  } catch (error) {
    console.error("[CHAT] POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
