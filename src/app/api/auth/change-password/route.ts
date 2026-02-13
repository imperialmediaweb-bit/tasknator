import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (!user.passwordHash) {
    return NextResponse.json({ error: "Account uses social login, cannot change password" }, { status: 400 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both current and new password are required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: hash },
  });

  return NextResponse.json({ success: true });
}
