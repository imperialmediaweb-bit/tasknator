import { User, Workspace, Membership, BusinessProfile, AuditRun, AuditFinding, RepairPlan, PlanTask, Asset, AssetVersion } from "@prisma/client";

export type UserWithMemberships = User & {
  memberships: (Membership & { workspace: Workspace })[];
};

export type BusinessProfileFull = BusinessProfile & {
  auditRuns: AuditRun[];
  repairPlans: RepairPlan[];
};

export type AuditRunWithFindings = AuditRun & {
  findings: AuditFinding[];
  businessProfile: BusinessProfile;
};

export type RepairPlanFull = RepairPlan & {
  tasks: PlanTask[];
  assets: (Asset & { versions: AssetVersion[] })[];
  businessProfile: BusinessProfile;
};

export type AssetWithVersions = Asset & {
  versions: AssetVersion[];
};

export interface AuditScores {
  overallScore: number;
  websiteScore: number;
  seoScore: number;
  socialScore: number;
  offerScore: number;
  reputationScore: number;
  localScore: number;
}

export interface GeneratedFinding {
  category: string;
  title: string;
  detail: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  fixable: boolean;
}

export interface GeneratedPlan {
  title: string;
  summary: string;
  tasks: {
    phase: "DAY_30" | "DAY_60" | "DAY_90";
    title: string;
    description: string;
    impact: string;
    timeEstimate: string;
    sortOrder: number;
  }[];
}
