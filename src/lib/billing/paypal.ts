import { db } from "@/lib/db";

async function getConfig(key: string): Promise<string> {
  const row = await db.systemConfig.findUnique({ where: { key } }).catch(() => null);
  return row?.value || process.env[key] || "";
}

async function getAccessToken(): Promise<string> {
  const clientId = await getConfig("PAYPAL_CLIENT_ID");
  const clientSecret = await getConfig("PAYPAL_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const baseUrl = process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

function getBaseUrl(): string {
  return process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

export const PAYPAL_PLANS: Record<string, { name: string; price: string; tier: string }> = {
  STARTER: { name: "Tasknator Starter", price: "9.00", tier: "STARTER" },
  PRO: { name: "Tasknator Pro", price: "29.00", tier: "PRO" },
  AGENCY: { name: "Tasknator Agency", price: "79.00", tier: "AGENCY" },
};

export async function createPayPalOrder(planTier: string, workspaceId: string) {
  const token = await getAccessToken();
  const plan = PAYPAL_PLANS[planTier];
  if (!plan) throw new Error("Invalid plan tier");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: workspaceId,
        description: `${plan.name} - Monthly Subscription`,
        amount: {
          currency_code: "USD",
          value: plan.price,
        },
        custom_id: JSON.stringify({ workspaceId, planTier }),
      }],
      application_context: {
        brand_name: "Tasknator",
        landing_page: "BILLING",
        user_action: "PAY_NOW",
        return_url: `${appUrl}/api/billing/paypal?action=capture`,
        cancel_url: `${appUrl}/billing?canceled=true`,
      },
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal create order failed: ${error}`);
  }

  return res.json();
}

export async function capturePayPalOrder(orderId: string) {
  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`PayPal capture failed: ${error}`);
  }

  return res.json();
}

export async function verifyPayPalWebhook(headers: Record<string, string>, body: string): Promise<boolean> {
  const webhookId = await getConfig("PAYPAL_WEBHOOK_ID");
  if (!webhookId) return false;

  const token = await getAccessToken();

  const res = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }),
  });

  if (!res.ok) return false;
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

export async function isPayPalConfigured(): Promise<boolean> {
  const clientId = await getConfig("PAYPAL_CLIENT_ID");
  const clientSecret = await getConfig("PAYPAL_CLIENT_SECRET");
  return !!(clientId && clientSecret);
}
