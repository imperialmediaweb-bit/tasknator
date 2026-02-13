import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
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
    return NextResponse.json({ error: "Not authorized to invite members" }, { status: 403 });
  }

  const { email, role = "MEMBER" } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!["ADMIN", "MEMBER", "VIEWER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check plan limits
  const memberCount = await db.membership.count({
    where: { workspaceId: membership.workspaceId },
  });

  const plan = membership.workspace.plan;
  const maxMembers = plan === "AGENCY" ? 25 : plan === "PRO" ? 1 : 1;
  if (memberCount >= maxMembers) {
    return NextResponse.json({
      error: `Your ${plan} plan allows up to ${maxMembers} team member${maxMembers > 1 ? "s" : ""}. Upgrade to add more.`,
    }, { status: 403 });
  }

  // Find or create user
  let invitedUser = await db.user.findUnique({ where: { email } });
  if (!invitedUser) {
    // Create user without password - they'll need to sign up
    invitedUser = await db.user.create({
      data: { email, name: email.split("@")[0] },
    });
  }

  // Check if already a member
  const existing = await db.membership.findUnique({
    where: { userId_workspaceId: { userId: invitedUser.id, workspaceId: membership.workspaceId } },
  });

  if (existing) {
    return NextResponse.json({ error: "User is already a member of this workspace" }, { status: 400 });
  }

  // Create membership
  await db.membership.create({
    data: {
      userId: invitedUser.id,
      workspaceId: membership.workspaceId,
      role: role as any,
    },
  });

  return NextResponse.json({ success: true, email });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { membershipId } = await req.json();

  const target = await db.membership.findUnique({ where: { id: membershipId } });
  if (!target || target.workspaceId !== membership.workspaceId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot remove the workspace owner" }, { status: 400 });
  }

  await db.membership.delete({ where: { id: membershipId } });

  return NextResponse.json({ success: true });
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
  });

  if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { membershipId, role } = await req.json();

  if (!["ADMIN", "MEMBER", "VIEWER"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const target = await db.membership.findUnique({ where: { id: membershipId } });
  if (!target || target.workspaceId !== membership.workspaceId) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  if (target.role === "OWNER") {
    return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 400 });
  }

  await db.membership.update({
    where: { id: membershipId },
    data: { role: role as any },
  });

  return NextResponse.json({ success: true });
}
