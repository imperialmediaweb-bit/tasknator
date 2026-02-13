import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { getStripeAsync } from "@/lib/billing/stripe";

async function getWebhookSecret(): Promise<string> {
  const row = await db.systemConfig.findUnique({ where: { key: "STRIPE_WEBHOOK_SECRET" } }).catch(() => null);
  return row?.value || process.env.STRIPE_WEBHOOK_SECRET || "";
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
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          await db.subscription.updateMany({
            where: { stripeSubId: invoice.subscription as string },
            data: { status: "past_due" },
          });
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
