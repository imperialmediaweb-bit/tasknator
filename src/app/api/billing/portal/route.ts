import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getStripe } from "@/lib/billing/stripe";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const membership = await db.membership.findFirst({
      where: { userId: user.id },
      include: { workspace: { include: { subscription: true } } },
    });

    if (!membership?.workspace.subscription?.stripeCustomerId) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.workspace.subscription.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Portal error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
