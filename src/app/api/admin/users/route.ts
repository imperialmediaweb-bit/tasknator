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

    const { userId, isAdmin: setAdmin } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    await db.user.update({
      where: { id: userId },
      data: { isAdmin: !!setAdmin },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin users PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
