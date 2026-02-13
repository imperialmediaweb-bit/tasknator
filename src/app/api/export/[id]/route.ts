import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import archiver from "archiver";
import { Readable } from "stream";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = req.nextUrl.searchParams.get("format") || "zip";
    const repairPlan = await db.repairPlan.findUnique({
      where: { id: params.id },
      include: {
        tasks: { orderBy: { sortOrder: "asc" } },
        assets: true,
        businessProfile: true,
      },
    });

    if (!repairPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (format === "zip") {
      // Generate ZIP
      const archive = archiver("zip", { zlib: { level: 9 } });
      const chunks: Buffer[] = [];

      archive.on("data", (chunk: Buffer) => chunks.push(chunk));

      // Plan markdown
      let planMd = `# Recovery Plan: ${repairPlan.title}\n\n`;
      planMd += `${repairPlan.summary || ""}\n\n`;
      planMd += `Business: ${repairPlan.businessProfile.name}\n`;
      planMd += `Industry: ${repairPlan.businessProfile.industry}\n\n`;

      const phases = ["DAY_30", "DAY_60", "DAY_90"];
      for (const phase of phases) {
        const phaseTasks = repairPlan.tasks.filter(t => t.phase === phase);
        if (phaseTasks.length > 0) {
          planMd += `## ${phase.replace("_", " ")}\n\n`;
          for (const task of phaseTasks) {
            planMd += `### ${task.title}\n`;
            planMd += `- Impact: ${task.impact}\n`;
            planMd += `- Time: ${task.timeEstimate}\n`;
            planMd += `- ${task.description}\n\n`;
          }
        }
      }

      archive.append(planMd, { name: "plan.md" });

      // Assets
      for (const asset of repairPlan.assets) {
        const ext = asset.type === "AD_COPY" ? "csv" : "md";
        const filename = `assets/${asset.type.toLowerCase()}.${ext}`;
        archive.append(asset.content, { name: filename });
      }

      await archive.finalize();

      const buffer = Buffer.concat(chunks);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${repairPlan.businessProfile.name.replace(/[^a-zA-Z0-9]/g, "_")}_recovery_plan.zip"`,
        },
      });
    }

    return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
