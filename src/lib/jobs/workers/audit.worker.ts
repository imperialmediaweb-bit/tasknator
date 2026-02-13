import { Worker, Job } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { createProvider, generateWithFallback } from "../../ai/provider";
import { decrypt } from "../../crypto";
import { AUDIT_SYSTEM_PROMPT, buildAuditPrompt } from "../../ai/prompts";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const db = new PrismaClient();

async function processAudit(job: Job) {
  const { auditRunId, businessProfileId, workspaceId } = job.data;

  await db.auditRun.update({
    where: { id: auditRunId },
    data: { status: "RUNNING", startedAt: new Date(), progress: 10 },
  });
  await job.updateProgress(10);

  const businessProfile = await db.businessProfile.findUnique({
    where: { id: businessProfileId },
  });

  if (!businessProfile) throw new Error("Business profile not found");

  // Get AI providers
  const providerKeys = await db.providerKey.findMany({
    where: { workspaceId, isActive: true },
  });

  const providers: { type: any; apiKey: string }[] = [];
  for (const pk of providerKeys) {
    const apiKey = await decrypt(pk.encryptedKey, pk.nonce);
    providers.push({ type: pk.provider, apiKey });
  }

  // Add default providers
  if (process.env.ANTHROPIC_API_KEY) providers.push({ type: "ANTHROPIC", apiKey: process.env.ANTHROPIC_API_KEY });
  if (process.env.OPENAI_API_KEY) providers.push({ type: "OPENAI", apiKey: process.env.OPENAI_API_KEY });
  if (process.env.GEMINI_API_KEY) providers.push({ type: "GEMINI", apiKey: process.env.GEMINI_API_KEY });

  await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 30 } });
  await job.updateProgress(30);

  // Generate audit
  const response = await generateWithFallback(providers, {
    messages: [
      { role: "system", content: AUDIT_SYSTEM_PROMPT },
      { role: "user", content: buildAuditPrompt(businessProfile) },
    ],
    maxTokens: 4096,
    temperature: 0.3,
  });

  await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 70 } });
  await job.updateProgress(70);

  // Parse response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response");
  const auditData = JSON.parse(jsonMatch[0]);

  // Save findings
  for (const finding of auditData.findings || []) {
    await db.auditFinding.create({
      data: {
        auditRunId,
        category: finding.category,
        title: finding.title,
        detail: finding.detail,
        severity: finding.severity,
        fixable: finding.fixable ?? true,
      },
    });
  }

  await db.auditRun.update({ where: { id: auditRunId }, data: { progress: 90 } });
  await job.updateProgress(90);

  // Complete
  await db.auditRun.update({
    where: { id: auditRunId },
    data: {
      status: "COMPLETED",
      progress: 100,
      overallScore: auditData.overallScore,
      websiteScore: auditData.websiteScore,
      seoScore: auditData.seoScore,
      socialScore: auditData.socialScore,
      offerScore: auditData.offerScore,
      reputationScore: auditData.reputationScore,
      localScore: auditData.localScore,
      rootCauseSummary: auditData.rootCauseSummary,
      rawResponse: JSON.stringify(auditData),
      finishedAt: new Date(),
    },
  });

  await job.updateProgress(100);
  return { success: true, score: auditData.overallScore };
}

const worker = new Worker("audit", processAudit, {
  connection: connection as any,
  concurrency: 3,
});

worker.on("completed", (job) => {
  console.log(`Audit job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
  console.error(`Audit job ${job?.id} failed:`, err.message);
  if (job) {
    await db.auditRun.update({
      where: { id: job.data.auditRunId },
      data: { status: "FAILED" },
    });
  }
});

export default worker;
