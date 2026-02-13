import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt } from "@/lib/crypto";

async function getCurrentWorkspaceId(userEmail: string): Promise<string | null> {
  const user = await db.user.findUnique({ where: { email: userEmail } });
  if (!user) return null;
  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    select: { workspaceId: true },
  });
  return membership?.workspaceId || null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getCurrentWorkspaceId(session.user.email);
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const keys = await db.providerKey.findMany({
      where: { workspaceId },
      select: { id: true, provider: true, isActive: true, createdAt: true, updatedAt: true },
    });

    // Check if platform-level env keys are configured
    const platformKeysActive = !!(
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY
    );

    return NextResponse.json({ providers: keys, platformKeysActive });
  } catch (error) {
    console.error("Get providers error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspaceId = await getCurrentWorkspaceId(session.user.email);
    if (!workspaceId) {
      return NextResponse.json({ error: "No workspace found" }, { status: 404 });
    }

    const { provider, apiKey } = await req.json();
    if (!provider || !apiKey) {
      return NextResponse.json({ error: "provider and apiKey required" }, { status: 400 });
    }

    const { ciphertext, nonce } = await encrypt(apiKey);

    const key = await db.providerKey.upsert({
      where: { workspaceId_provider: { workspaceId, provider } },
      update: { encryptedKey: ciphertext, nonce, isActive: true },
      create: { workspaceId, provider, encryptedKey: ciphertext, nonce },
    });

    return NextResponse.json({ id: key.id, provider: key.provider, isActive: key.isActive }, { status: 201 });
  } catch (error: any) {
    console.error("Save provider key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
