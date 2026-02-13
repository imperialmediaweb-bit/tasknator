import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // id here is the auditRunId
    const auditRun = await db.auditRun.findUnique({
      where: { id: params.id },
      include: {
        findings: true,
        businessProfile: { include: { workspace: true } },
      },
    });

    if (!auditRun || auditRun.status !== "COMPLETED") {
      return NextResponse.json({ error: "Audit not found or not completed" }, { status: 404 });
    }

    const biz = auditRun.businessProfile;

    // Create repair plan
    const repairPlan = await db.repairPlan.create({
      data: {
        businessProfileId: biz.id,
        title: `Recovery Plan for ${biz.name}`,
        summary: `Based on the diagnostic audit (score: ${auditRun.overallScore}/100), this 30/60/90-day plan addresses the identified issues for ${biz.name} (${biz.industry}).`,
      },
    });

    // Generate plan tasks from findings
    const criticalFindings = auditRun.findings.filter(f => f.severity === "CRITICAL" || f.severity === "HIGH");
    const mediumFindings = auditRun.findings.filter(f => f.severity === "MEDIUM");
    const lowFindings = auditRun.findings.filter(f => f.severity === "LOW" || f.severity === "INFO");

    let sortOrder = 0;

    // Day 30 tasks from critical findings
    for (const finding of criticalFindings) {
      await db.planTask.create({
        data: {
          repairPlanId: repairPlan.id,
          phase: "DAY_30",
          title: `Fix: ${finding.title}`,
          description: finding.detail,
          impact: "high",
          timeEstimate: "2-4 hours",
          sortOrder: sortOrder++,
        },
      });
    }

    // Day 60 tasks from medium findings
    for (const finding of mediumFindings) {
      await db.planTask.create({
        data: {
          repairPlanId: repairPlan.id,
          phase: "DAY_60",
          title: `Improve: ${finding.title}`,
          description: finding.detail,
          impact: "medium",
          timeEstimate: "1-3 hours",
          sortOrder: sortOrder++,
        },
      });
    }

    // Day 90 tasks from low findings
    for (const finding of lowFindings) {
      await db.planTask.create({
        data: {
          repairPlanId: repairPlan.id,
          phase: "DAY_90",
          title: `Optimize: ${finding.title}`,
          description: finding.detail,
          impact: "low",
          timeEstimate: "1-2 hours",
          sortOrder: sortOrder++,
        },
      });
    }

    return NextResponse.json({ repairPlanId: repairPlan.id }, { status: 201 });
  } catch (error: any) {
    console.error("Generate plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
