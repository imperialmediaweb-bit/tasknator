import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await db.providerKey.findMany({
      where: { workspaceId: params.workspaceId },
      select: { id: true, provider: true, isActive: true, createdAt: true, updatedAt: true },
    });

    return NextResponse.json(keys);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { workspaceId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { provider, apiKey } = await req.json();
    if (!provider || !apiKey) {
      return NextResponse.json({ error: "provider and apiKey required" }, { status: 400 });
    }

    const { ciphertext, nonce } = await encrypt(apiKey);

    const key = await db.providerKey.upsert({
      where: { workspaceId_provider: { workspaceId: params.workspaceId, provider } },
      update: { encryptedKey: ciphertext, nonce, isActive: true },
      create: { workspaceId: params.workspaceId, provider, encryptedKey: ciphertext, nonce },
    });

    return NextResponse.json({ id: key.id, provider: key.provider, isActive: key.isActive }, { status: 201 });
  } catch (error: any) {
    console.error("Save provider key error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
