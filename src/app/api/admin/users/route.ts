import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

async function isAdmin(email: string) {
  const user = await db.user.findUnique({ where: { email }, select: { isAdmin: true } });
  return user?.isAdmin === true;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        memberships: {
          include: { workspace: { include: { subscription: true } } },
          take: 1,
        },
      },
    });

    return NextResponse.json(users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin,
      createdAt: u.createdAt,
      workspace: u.memberships[0]?.workspace?.name || null,
      plan: u.memberships[0]?.workspace?.plan || null,
      role: u.memberships[0]?.role || null,
      subscriptionStatus: u.memberships[0]?.workspace?.subscription?.status || null,
    })));
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    // Handle plan assignment
    if (body.plan !== undefined) {
      const validPlans = ["STARTER", "PRO", "AGENCY"];
      if (!validPlans.includes(body.plan)) {
        return NextResponse.json({ error: "Invalid plan. Must be STARTER, PRO, or AGENCY" }, { status: 400 });
      }

      // Find user's workspace through membership
      const membership = await db.membership.findFirst({
        where: { userId },
        select: { workspaceId: true },
      });

      if (!membership) {
        return NextResponse.json({ error: "User has no workspace" }, { status: 400 });
      }

      await db.workspace.update({
        where: { id: membership.workspaceId },
        data: { plan: body.plan },
      });

      return NextResponse.json({ success: true, message: `Plan updated to ${body.plan}` });
    }

    // Handle admin toggle
    if (body.isAdmin !== undefined) {
      await db.user.update({
        where: { id: userId },
        data: { isAdmin: !!body.isAdmin },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
