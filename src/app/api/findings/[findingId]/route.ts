import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { findingId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const finding = await db.auditFinding.findUnique({
    where: { id: params.findingId },
    include: { auditRun: { include: { businessProfile: true } } },
  });

  if (!finding) return NextResponse.json({ error: "Finding not found" }, { status: 404 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      workspaceId: finding.auditRun.businessProfile.workspaceId,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const fixed = body.fixed !== undefined ? body.fixed : !finding.fixed;

  const updated = await db.auditFinding.update({
    where: { id: params.findingId },
    data: { fixed },
  });

  return NextResponse.json(updated);
}
