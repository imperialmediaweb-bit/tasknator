import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    });
  }
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return (getStripe() as any)[prop];
  },
});

export const PLANS = {
  STARTER: {
    name: "Starter",
    price: 900, // $9
    stripePriceId: process.env.STRIPE_PRICE_STARTER!,
    businesses: 1,
    auditsPerMonth: 1,
    modules: ["WEBSITE_FIXER", "SALES_DOCTOR"],
    exports: "limited",
    teamMembers: 1,
  },
  PRO: {
    name: "Pro",
    price: 2900, // $29
    stripePriceId: process.env.STRIPE_PRICE_PRO!,
    businesses: 3,
    auditsPerMonth: 10,
    modules: ["WEBSITE_FIXER", "SALES_DOCTOR", "REPUTATION_FIXER", "ADS_REPAIR", "SEO_PLANNER", "CLIENT_RECOVERY"],
    exports: "full",
    teamMembers: 1,
  },
  AGENCY: {
    name: "Agency",
    price: 7900, // $79
    stripePriceId: process.env.STRIPE_PRICE_AGENCY!,
    businesses: 25,
    auditsPerMonth: 100,
    modules: ["WEBSITE_FIXER", "SALES_DOCTOR", "REPUTATION_FIXER", "ADS_REPAIR", "SEO_PLANNER", "CLIENT_RECOVERY", "COST_CUTTER"],
    exports: "full",
    teamMembers: 25,
    whiteLabel: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanLimits(plan: PlanKey) {
  return PLANS[plan];
}

export async function createCheckoutSession(params: {
  customerId?: string;
  priceId: string;
  workspaceId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: { workspaceId: params.workspaceId },
    allow_promotion_codes: true,
  });
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}
