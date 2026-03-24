import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return db.user.findUnique({
    where: { email: session.user.email },
    include: {
      memberships: {
        include: { workspace: true },
      },
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function getUserWorkspace(userId: string, workspaceId?: string) {
  if (workspaceId) {
    const membership = await db.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { workspace: true },
    });
    return membership;
  }
  
  const membership = await db.membership.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return membership;
}
