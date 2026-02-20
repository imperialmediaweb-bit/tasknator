import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeAsync } from "@/lib/billing/stripe";
import {
  sendInvoiceEmail,
  sendPaymentFailedEmail,
  sendSubscriptionChangedEmail,
} from "@/lib/email";

async function getWebhookSecret(): Promise<string> {
  const row = await db.systemConfig.findUnique({ where: { key: "STRIPE_WEBHOOK_SECRET" } }).catch(() => null);
  return row?.value || process.env.STRIPE_WEBHOOK_SECRET || "";
}

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
  const stripe = await getStripeAsync();
  const body = await req.text();
  const signature = headers().get("stripe-signature")!;
  const webhookSecret = await getWebhookSecret();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const workspaceId = session.metadata?.workspaceId;
        if (workspaceId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          const priceId = sub.items.data[0]?.price.id;

          let planTier: "STARTER" | "PRO" | "AGENCY" = "STARTER";
          if (priceId === process.env.STRIPE_PRICE_PRO) planTier = "PRO";
          else if (priceId === process.env.STRIPE_PRICE_AGENCY) planTier = "AGENCY";

          await db.subscription.upsert({
            where: { workspaceId },
            update: {
              stripeCustomerId: session.customer as string,
              stripeSubId: sub.id,
              planTier,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
            create: {
              workspaceId,
              stripeCustomerId: session.customer as string,
              stripeSubId: sub.id,
              planTier,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
            },
          });

          await db.workspace.update({
            where: { id: workspaceId },
            data: { plan: planTier },
          });

          // Email: subscription activated
          const ownerEmail = await getWorkspaceOwnerEmail(workspaceId);
          if (ownerEmail) {
            sendSubscriptionChangedEmail({
              to: ownerEmail,
              action: "upgraded",
              planName: planLabel(planTier),
              periodEnd: new Date(sub.current_period_end * 1000).toLocaleDateString(),
            }).catch(console.error);
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await db.subscription.findUnique({
          where: { stripeSubId: sub.id },
        });
        if (existing) {
          await db.subscription.update({
            where: { stripeSubId: sub.id },
            data: {
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            },
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await db.subscription.findUnique({
          where: { stripeSubId: sub.id },
        });
        if (existing) {
          await db.subscription.update({
            where: { stripeSubId: sub.id },
            data: { status: "canceled" },
          });
          await db.workspace.update({
            where: { id: existing.workspaceId },
            data: { plan: "STARTER" },
          });

          // Email: subscription canceled
          const ownerEmail = await getWorkspaceOwnerEmail(existing.workspaceId);
          if (ownerEmail) {
            sendSubscriptionChangedEmail({
              to: ownerEmail,
              action: "canceled",
              planName: planLabel(existing.planTier),
              periodEnd: existing.currentPeriodEnd?.toLocaleDateString(),
            }).catch(console.error);
          }
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await db.subscription.findUnique({
            where: { stripeSubId: invoice.subscription as string },
          });
          if (sub) {
            await db.invoice.create({
              data: {
                workspaceId: sub.workspaceId,
                stripeInvId: invoice.id,
                amount: invoice.amount_paid,
                currency: invoice.currency,
                status: "paid",
                pdfUrl: invoice.invoice_pdf,
                hostedUrl: invoice.hosted_invoice_url,
                periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
                periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
              },
            });

            // Email: invoice/payment receipt
            const ownerEmail = await getWorkspaceOwnerEmail(sub.workspaceId);
            if (ownerEmail) {
              sendInvoiceEmail({
                to: ownerEmail,
                planName: planLabel(sub.planTier),
                amount: (invoice.amount_paid / 100).toFixed(2),
                currency: invoice.currency,
                invoiceUrl: invoice.hosted_invoice_url,
                pdfUrl: invoice.invoice_pdf,
                periodEnd: invoice.period_end
                  ? new Date(invoice.period_end * 1000).toLocaleDateString()
                  : undefined,
              }).catch(console.error);
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          const sub = await db.subscription.findFirst({
            where: { stripeSubId: invoice.subscription as string },
          });
          await db.subscription.updateMany({
            where: { stripeSubId: invoice.subscription as string },
            data: { status: "past_due" },
          });

          // Email: payment failed
          if (sub) {
            const ownerEmail = await getWorkspaceOwnerEmail(sub.workspaceId);
            if (ownerEmail) {
              sendPaymentFailedEmail({
                to: ownerEmail,
                planName: planLabel(sub.planTier),
                amount: `$${((invoice.amount_due || 0) / 100).toFixed(2)}`,
              }).catch(console.error);
            }
          }
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
