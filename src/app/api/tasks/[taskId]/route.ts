import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await db.planTask.findUnique({
    where: { id: params.taskId },
    include: { repairPlan: { include: { businessProfile: { include: { workspace: true } } } } },
  });

  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const membership = await db.membership.findFirst({
    where: {
      userId: user.id,
      workspaceId: task.repairPlan.businessProfile.workspaceId,
    },
  });

  if (!membership) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const body = await req.json();
  const completed = body.completed !== undefined ? body.completed : !task.completed;

  const updated = await db.planTask.update({
    where: { id: params.taskId },
    data: { completed },
  });

  return NextResponse.json(updated);
}
