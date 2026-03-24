import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// ioredis and bullmq have incompatible Redis type definitions; cast is required
export const auditQueue = new Queue("audit", { connection: connection as never });
export const planQueue = new Queue("plan", { connection: connection as never });
export const assetQueue = new Queue("asset", { connection: connection as never });
export const exportQueue = new Queue("export", { connection: connection as never });

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
