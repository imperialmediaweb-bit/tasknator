import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPayPalWebhook } from "@/lib/billing/paypal";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const headerMap: Record<string, string> = {};
  req.headers.forEach((value, key) => { headerMap[key] = value; });

  // Verify webhook signature
  const isValid = await verifyPayPalWebhook(headerMap, body);
  if (!isValid) {
    console.error("PayPal webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const event = JSON.parse(body);
    const eventType = event.event_type;

    switch (eventType) {
      case "PAYMENT.SALE.COMPLETED": {
        // Recurring payment completed
        const resource = event.resource;
        const billingAgreementId = resource?.billing_agreement_id;
        if (billingAgreementId) {
          const sub = await db.subscription.findFirst({
            where: { paypalSubId: billingAgreementId },
          });
          if (sub) {
            await db.subscription.update({
              where: { id: sub.id },
              data: {
                status: "active",
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            });
            await db.invoice.create({
              data: {
                workspaceId: sub.workspaceId,
                amount: Math.round(parseFloat(resource.amount?.total || "0") * 100),
                currency: resource.amount?.currency?.toLowerCase() || "usd",
                status: "paid",
              },
            });
          }
        }
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subId = event.resource?.id;
        if (subId) {
          const sub = await db.subscription.findFirst({
            where: { paypalSubId: subId },
          });
          if (sub) {
            await db.subscription.update({
              where: { id: sub.id },
              data: { status: "canceled" },
            });
            await db.workspace.update({
              where: { id: sub.workspaceId },
              data: { plan: "STARTER" },
            });
          }
        }
        break;
      }

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED": {
        const billingAgreementId = event.resource?.billing_agreement_id;
        if (billingAgreementId) {
          await db.subscription.updateMany({
            where: { paypalSubId: billingAgreementId },
            data: { status: eventType === "PAYMENT.SALE.DENIED" ? "past_due" : "canceled" },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("PayPal webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
