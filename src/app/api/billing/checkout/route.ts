import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripeAsync, PLANS, PlanKey } from "@/lib/billing/stripe";

export async function POST(req: NextRequest) {
  try {
    const stripe = await getStripeAsync();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { workspaceId } = body;

    // Support both priceId (direct) and planTier (lookup)
    let priceId = body.priceId;
    if (!priceId && body.planTier) {
      const plan = PLANS[body.planTier as PlanKey];
      if (!plan) {
        return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
      }
      priceId = plan.stripePriceId;
    }

    if (!priceId) {
      return NextResponse.json({ error: "priceId or planTier required" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const membership = await db.membership.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
      include: { workspace: { include: { subscription: true } } },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: membership.workspace.subscription?.stripeCustomerId || undefined,
      customer_email: membership.workspace.subscription?.stripeCustomerId ? undefined : session.user.email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/billing?success=true`,
      cancel_url: `${baseUrl}/billing?canceled=true`,
      metadata: { workspaceId },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
