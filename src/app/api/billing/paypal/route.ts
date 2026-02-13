import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPayPalOrder, capturePayPalOrder, PAYPAL_PLANS } from "@/lib/billing/paypal";

// POST = create PayPal order
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planTier, workspaceId } = await req.json();

    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const membership = await db.membership.findUnique({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
    });

    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const order = await createPayPalOrder(planTier, workspaceId);
    const approveUrl = order.links?.find((l: any) => l.rel === "approve")?.href;

    return NextResponse.json({ orderId: order.id, approveUrl });
  } catch (error: any) {
    console.error("PayPal create order error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// GET = capture after PayPal redirect
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token"); // PayPal order ID

    if (!token) {
      return NextResponse.redirect(new URL("/billing?error=missing_token", req.url));
    }

    const order = await capturePayPalOrder(token);

    if (order.status === "COMPLETED") {
      const purchaseUnit = order.purchase_units?.[0];
      let workspaceId: string | undefined;
      let planTier: string | undefined;

      try {
        const customData = JSON.parse(purchaseUnit?.custom_id || "{}");
        workspaceId = customData.workspaceId;
        planTier = customData.planTier;
      } catch {}

      if (workspaceId && planTier) {
        const validTier = planTier as "STARTER" | "PRO" | "AGENCY";

        await db.subscription.upsert({
          where: { workspaceId },
          update: {
            paypalSubId: order.id,
            planTier: validTier,
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
          create: {
            workspaceId,
            paypalSubId: order.id,
            planTier: validTier,
            status: "active",
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });

        await db.workspace.update({
          where: { id: workspaceId },
          data: { plan: validTier },
        });

        // Create invoice record
        const amount = parseFloat(PAYPAL_PLANS[planTier]?.price || "0") * 100;
        await db.invoice.create({
          data: {
            workspaceId,
            amount,
            currency: "usd",
            status: "paid",
          },
        });
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/billing?success=true`);
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/billing?error=capture_failed`);
  }
}
