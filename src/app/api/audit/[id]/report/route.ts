import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { generatePdfReport } from "@/lib/export/pdf";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const auditRun = await db.auditRun.findUnique({
      where: { id: params.id },
      include: {
        findings: true,
        businessProfile: true,
      },
    });

    if (!auditRun || auditRun.status !== "COMPLETED") {
      return NextResponse.json({ error: "Audit not found or not completed" }, { status: 404 });
    }

    const biz = auditRun.businessProfile;

    const pdf = await generatePdfReport({
      title: `Diagnostic Report — ${biz.name}`,
      businessName: biz.name,
      industry: biz.industry,
      country: biz.country,
      city: biz.city || undefined,
      websiteUrl: biz.websiteUrl || undefined,
      overallScore: auditRun.overallScore || 0,
      scores: [
        { label: "Website", score: auditRun.websiteScore || 0 },
        { label: "SEO", score: auditRun.seoScore || 0 },
        { label: "Social", score: auditRun.socialScore || 0 },
        { label: "Offer", score: auditRun.offerScore || 0 },
        { label: "Reputation", score: auditRun.reputationScore || 0 },
        { label: "Local", score: auditRun.localScore || 0 },
      ],
      rootCause: auditRun.rootCauseSummary || "",
      findings: auditRun.findings.map((f) => ({
        category: f.category,
        title: f.title,
        severity: f.severity,
        detail: f.detail,
      })),
      generatedAt: new Date(auditRun.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    const filename = `${biz.name.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}-audit-report.pdf`;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch (error: any) {
    console.error("PDF report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
