import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auditRun = await db.auditRun.findUnique({
      where: { id: params.id },
      include: { findings: true },
    });

    if (!auditRun) {
      return NextResponse.json({ error: "Audit not found" }, { status: 404 });
    }

    return NextResponse.json(auditRun);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
