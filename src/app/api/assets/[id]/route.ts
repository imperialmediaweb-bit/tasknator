import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const asset = await db.asset.findUnique({
      where: { id: params.id },
      include: {
        versions: { orderBy: { version: "desc" } },
        task: true,
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await req.json();
    if (!content) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    const asset = await db.asset.findUnique({
      where: { id: params.id },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const nextVersion = (asset.versions[0]?.version ?? 0) + 1;

    // Save current content as a version before updating
    await db.assetVersion.create({
      data: {
        assetId: asset.id,
        content: asset.content,
        version: nextVersion,
        createdBy: session.user.email,
      },
    });

    // Update asset
    const updated = await db.asset.update({
      where: { id: params.id },
      data: { content },
      include: { versions: { orderBy: { version: "desc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update asset error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
