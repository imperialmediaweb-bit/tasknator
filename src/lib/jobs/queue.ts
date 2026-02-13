import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const auditQueue = new Queue("audit", { connection });
export const planQueue = new Queue("plan", { connection });
export const assetQueue = new Queue("asset", { connection });
export const exportQueue = new Queue("export", { connection });

export type AuditJobData = {
  auditRunId: string;
  businessProfileId: string;
  workspaceId: string;
};

export type PlanJobData = {
  auditRunId: string;
  businessProfileId: string;
  workspaceId: string;
};

export type AssetJobData = {
  repairPlanId: string;
  assetType: string;
  businessProfileId: string;
  workspaceId: string;
};

export type ExportJobData = {
  repairPlanId: string;
  format: "pdf" | "zip" | "csv";
  workspaceId: string;
};

export async function enqueueAudit(data: AuditJobData) {
  return auditQueue.add("run-audit", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function enqueuePlan(data: PlanJobData) {
  return planQueue.add("generate-plan", data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

export async function enqueueAsset(data: AssetJobData) {
  return assetQueue.add("generate-asset", data, {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
  });
}

export async function enqueueExport(data: ExportJobData) {
  return exportQueue.add("create-export", data, {
    attempts: 2,
  });
}

export { connection, Queue, Worker, Job };
