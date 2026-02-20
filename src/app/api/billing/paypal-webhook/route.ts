import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPayPalWebhook } from "@/lib/billing/paypal";
import {
  sendInvoiceEmail,
  sendPaymentFailedEmail,
  sendSubscriptionChangedEmail,
} from "@/lib/email";

async function getWorkspaceOwnerEmail(workspaceId: string): Promise<string | null> {
  const owner = await db.membership.findFirst({
    where: { workspaceId, role: "OWNER" },
    include: { user: true },
  });
  return owner?.user?.email || null;
}

function planLabel(tier: string) {
  return tier === "AGENCY" ? "Agency" : tier === "PRO" ? "Pro" : "Starter";
}

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
            const amount = Math.round(parseFloat(resource.amount?.total || "0") * 100);
            const currency = resource.amount?.currency?.toLowerCase() || "usd";
            await db.invoice.create({
              data: {
                workspaceId: sub.workspaceId,
                amount,
                currency,
                status: "paid",
              },
            });

            // Email: payment receipt
            const ownerEmail = await getWorkspaceOwnerEmail(sub.workspaceId);
            if (ownerEmail) {
              sendInvoiceEmail({
                to: ownerEmail,
                planName: planLabel(sub.planTier),
                amount: (amount / 100).toFixed(2),
                currency,
                periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
              }).catch(console.error);
            }
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

            // Email: subscription canceled
            const ownerEmail = await getWorkspaceOwnerEmail(sub.workspaceId);
            if (ownerEmail) {
              sendSubscriptionChangedEmail({
                to: ownerEmail,
                action: "canceled",
                planName: planLabel(sub.planTier),
              }).catch(console.error);
            }
          }
        }
        break;
      }

      case "PAYMENT.SALE.DENIED":
      case "PAYMENT.SALE.REFUNDED": {
        const billingAgreementId = event.resource?.billing_agreement_id;
        if (billingAgreementId) {
          const sub = await db.subscription.findFirst({
            where: { paypalSubId: billingAgreementId },
          });
          await db.subscription.updateMany({
            where: { paypalSubId: billingAgreementId },
            data: { status: eventType === "PAYMENT.SALE.DENIED" ? "past_due" : "canceled" },
          });

          // Email: payment failed
          if (sub && eventType === "PAYMENT.SALE.DENIED") {
            const ownerEmail = await getWorkspaceOwnerEmail(sub.workspaceId);
            if (ownerEmail) {
              sendPaymentFailedEmail({
                to: ownerEmail,
                planName: planLabel(sub.planTier),
                amount: `$${parseFloat(event.resource?.amount?.total || "0").toFixed(2)}`,
              }).catch(console.error);
            }
          }
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
