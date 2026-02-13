import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  return NextResponse.json({
    workspaceName: membership?.workspace.name || "",
    locale: user.locale || "en",
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: { workspace: true },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const { workspaceName, locale } = body;

  if (workspaceName !== undefined) {
    await db.workspace.update({
      where: { id: membership.workspaceId },
      data: { name: workspaceName },
    });
  }

  if (locale !== undefined) {
    await db.user.update({
      where: { id: user.id },
      data: { locale },
    });
  }

  return NextResponse.json({ success: true });
}
