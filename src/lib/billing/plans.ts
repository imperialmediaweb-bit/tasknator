import { PlanTier } from "@prisma/client";

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: {
    businesses: number;
    auditsPerMonth: number;
    teamMembers: number;
    exports: "limited" | "full";
  };
  modules: string[];
  popular?: boolean;
}

export const PLAN_CONFIGS: PlanConfig[] = [
  {
    tier: "STARTER",
    name: "Starter",
    price: 9,
    description: "Perfect for solo businesses getting started with AI diagnostics",
    features: [
      "1 business profile",
      "1 audit per month",
      "Website Fixer module",
      "Sales Doctor module",
      "Limited exports",
      "Email support",
    ],
    limits: { businesses: 1, auditsPerMonth: 1, teamMembers: 1, exports: "limited" },
    modules: ["WEBSITE_FIXER", "SALES_DOCTOR"],
  },
  {
    tier: "PRO",
    name: "Pro",
    price: 29,
    description: "For growing businesses that need the full diagnostic toolkit",
    features: [
      "3 business profiles",
      "10 audits per month",
      "All modules (except Cost Cutter)",
      "Full PDF & ZIP exports",
      "Version history",
      "Priority support",
    ],
    limits: { businesses: 3, auditsPerMonth: 10, teamMembers: 1, exports: "full" },
    modules: ["WEBSITE_FIXER", "SALES_DOCTOR", "REPUTATION_FIXER", "ADS_REPAIR", "SEO_PLANNER", "CLIENT_RECOVERY"],
    popular: true,
  },
  {
    tier: "AGENCY",
    name: "Agency",
    price: 79,
    description: "For agencies managing multiple client businesses",
    features: [
      "25 business profiles",
      "100 audits per month",
      "All modules including Cost Cutter",
      "PDF & ZIP exports with your branding",
      "White-label: your logo, name & domain",
      "Team members (up to 25)",
      "Dedicated support",
    ],
    limits: { businesses: 25, auditsPerMonth: 100, teamMembers: 25, exports: "full" },
    modules: ["WEBSITE_FIXER", "SALES_DOCTOR", "REPUTATION_FIXER", "ADS_REPAIR", "SEO_PLANNER", "CLIENT_RECOVERY", "COST_CUTTER"],
  },
];

export function canAccessModule(plan: PlanTier, module: string): boolean {
  const config = PLAN_CONFIGS.find((p) => p.tier === plan);
  return config?.modules.includes(module) ?? false;
}

export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_CONFIGS.find((p) => p.tier === tier)!;
}
