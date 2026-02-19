import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Load keys from DB + env
    const platformConfigs = await db.systemConfig.findMany({
      where: { key: { in: ["ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY"] } },
    });
    const dbKeys: Record<string, string> = {};
    for (const c of platformConfigs) dbKeys[c.key] = c.value;

    const getKey = (name: string) => dbKeys[name] || process.env[name] || "";

    const results: { provider: string; status: string; message: string }[] = [];

    // Test each available provider
    const providers = [
      { name: "OPENAI", key: getKey("OPENAI_API_KEY"), type: "OPENAI" as const },
      { name: "ANTHROPIC", key: getKey("ANTHROPIC_API_KEY"), type: "ANTHROPIC" as const },
      { name: "GEMINI", key: getKey("GEMINI_API_KEY"), type: "GEMINI" as const },
    ];

    for (const p of providers) {
      if (!p.key) {
        results.push({ provider: p.name, status: "not_configured", message: "No API key set" });
        continue;
      }

      try {
        const { createProvider } = await import("@/lib/ai/provider");
        const provider = createProvider(p.type, p.key);
        const response = await provider.generate({
          messages: [
            { role: "system", content: "You are a test. Respond with exactly: {\"ok\":true}" },
            { role: "user", content: "Test connection. Reply with {\"ok\":true}" },
          ],
          maxTokens: 50,
          temperature: 0,
        });

        results.push({
          provider: p.name,
          status: "ok",
          message: `Connected successfully. Response: ${response.substring(0, 100)}`,
        });
      } catch (err: any) {
        results.push({
          provider: p.name,
          status: "error",
          message: `Failed: ${err.message}`,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
