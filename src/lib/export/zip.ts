import archiver from "archiver";

interface ExportData {
  planTitle: string;
  planSummary: string;
  businessName: string;
  industry: string;
  tasks: { phase: string; title: string; description: string; impact: string; timeEstimate: string }[];
  assets: { type: string; title: string; content: string }[];
}

export async function generateExportZip(data: ExportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on("data", (chunk: Buffer) => chunks.push(chunk));
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    // Plan markdown
    let planMd = `# ${data.planTitle}\n\n`;
    planMd += `> ${data.planSummary}\n\n`;
    planMd += `**Business:** ${data.businessName}\n`;
    planMd += `**Industry:** ${data.industry}\n\n---\n\n`;

    const phases = ["DAY_30", "DAY_60", "DAY_90"];
    for (const phase of phases) {
      const phaseTasks = data.tasks.filter((t) => t.phase === phase);
      if (phaseTasks.length > 0) {
        planMd += `## ${phase.replace("_", " ")}\n\n`;
        for (const task of phaseTasks) {
          planMd += `### ${task.title}\n`;
          planMd += `- **Impact:** ${task.impact}\n`;
          planMd += `- **Estimated time:** ${task.timeEstimate}\n`;
          planMd += `- ${task.description}\n\n`;
        }
      }
    }
    archive.append(planMd, { name: "plan.md" });

    // Assets
    for (const asset of data.assets) {
      const ext = asset.type === "AD_COPY" ? "csv" : "md";
      const safeName = asset.type.toLowerCase().replace(/[^a-z0-9]/g, "_");
      archive.append(asset.content, { name: `assets/${safeName}.${ext}` });
    }

    // Summary txt
    const summary = `Tasknator Recovery Plan Export
==============================
Business: ${data.businessName}
Industry: ${data.industry}
Plan: ${data.planTitle}
Tasks: ${data.tasks.length}
Assets: ${data.assets.length}
Generated: ${new Date().toISOString()}
`;
    archive.append(summary, { name: "README.txt" });

    archive.finalize();
  });
}
