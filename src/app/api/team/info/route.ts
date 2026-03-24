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
    include: {
      workspace: {
        include: {
          memberships: {
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "No workspace found" }, { status: 404 });
  }

  return NextResponse.json({
    members: membership.workspace.memberships,
    currentUserId: user.id,
    isOwnerOrAdmin: ["OWNER", "ADMIN"].includes(membership.role),
    plan: membership.workspace.plan,
  });
}
