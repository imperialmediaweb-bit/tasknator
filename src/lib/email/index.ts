import nodemailer from "nodemailer";
import { db } from "@/lib/db";

// ─── Dynamic SMTP transporter (reads DB config first, then env) ──────────

async function getSmtpConfig() {
  const keys = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS", "EMAIL_FROM"];
  let dbConfig: Record<string, string> = {};
  try {
    const rows = await db.systemConfig.findMany({ where: { key: { in: keys } } });
    for (const r of rows) dbConfig[r.key] = r.value;
  } catch {
    // DB might not be ready yet — fall back to env
  }
  const get = (k: string) => dbConfig[k] || process.env[k] || "";
  return {
    host: get("SMTP_HOST") || "smtp.mailgun.org",
    port: parseInt(get("SMTP_PORT") || "587"),
    secure: get("SMTP_SECURE") === "true",
    user: get("SMTP_USER"),
    pass: get("SMTP_PASS"),
    from: get("EMAIL_FROM") || `${process.env.NEXT_PUBLIC_APP_NAME || "Tasknator"} <noreply@tasknator.com>`,
  };
}

async function getTransporter() {
  const cfg = await getSmtpConfig();
  return {
    transporter: nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    }),
    from: cfg.from,
    configured: !!(cfg.user && cfg.pass),
  };
}

// ─── Core send ───────────────────────────────────────────

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const { transporter, from, configured } = await getTransporter();
  if (!configured) {
    console.log(`[email] SMTP not configured — skipping email to ${options.to}: "${options.subject}"`);
    return null;
  }
  try {
    const result = await transporter.sendMail({
      from: options.from || from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    });
    console.log(`[email] Sent to ${options.to}: "${options.subject}" (messageId: ${result.messageId})`);
    return result;
  } catch (err: any) {
    console.error(`[email] Failed to send to ${options.to}: ${err.message}`);
    return null;
  }
}

// ─── Shared layout ───────────────────────────────────────

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Tasknator";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function emailLayout(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:28px 32px;">
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">${APP_NAME}</h1>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:32px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
            ${APP_NAME} &mdash; AI Business Diagnostics &amp; Recovery<br>
            <a href="${APP_URL}" style="color:#6366f1;text-decoration:none;">${APP_URL.replace(/https?:\/\//, "")}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(url: string, label: string, color = "#4f46e5") {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;padding:12px 32px;background:${color};color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>
  </div>`;
}

// ─── 1. Welcome Email ────────────────────────────────────

export async function sendWelcomeEmail(params: { to: string; name: string }) {
  return sendEmail({
    to: params.to,
    subject: `Welcome to ${APP_NAME} — Let's fix your business`,
    html: emailLayout("Welcome", `
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">Welcome, ${params.name || "there"}!</h2>
      <p style="color:#475569;line-height:1.6;">Thanks for joining <strong>${APP_NAME}</strong>. We help businesses identify what's broken and generate actionable recovery plans powered by AI.</p>
      <p style="color:#475569;line-height:1.6;"><strong>Get started in 3 steps:</strong></p>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
        <tr><td style="padding:8px 0;color:#475569;font-size:14px;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#eef2ff;color:#4f46e5;text-align:center;line-height:28px;font-weight:700;margin-right:10px;">1</span>
          Add your business profile
        </td></tr>
        <tr><td style="padding:8px 0;color:#475569;font-size:14px;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#eef2ff;color:#4f46e5;text-align:center;line-height:28px;font-weight:700;margin-right:10px;">2</span>
          Run your first AI audit
        </td></tr>
        <tr><td style="padding:8px 0;color:#475569;font-size:14px;">
          <span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:#eef2ff;color:#4f46e5;text-align:center;line-height:28px;font-weight:700;margin-right:10px;">3</span>
          Get your recovery plan &amp; assets
        </td></tr>
      </table>
      ${btn(`${APP_URL}/dashboard`, "Go to Dashboard")}
    `),
  });
}

// ─── 2. Audit Complete Email ─────────────────────────────

export async function sendAuditCompleteEmail(params: {
  to: string;
  businessName: string;
  score: number;
  reportUrl: string;
  findings: number;
  criticalCount: number;
}) {
  const scoreColor = params.score >= 70 ? "#22c55e" : params.score >= 40 ? "#f59e0b" : "#ef4444";
  return sendEmail({
    to: params.to,
    subject: `Audit Ready: ${params.businessName} — Score ${params.score}/100`,
    html: emailLayout("Audit Report", `
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">Your Audit Report is Ready</h2>
      <p style="color:#475569;">Business: <strong>${params.businessName}</strong></p>
      <div style="text-align:center;margin:24px 0;">
        <div style="display:inline-block;width:100px;height:100px;border-radius:50%;border:6px solid ${scoreColor};line-height:88px;text-align:center;">
          <span style="font-size:36px;font-weight:800;color:${scoreColor};">${params.score}</span>
        </div>
        <p style="color:#64748b;font-size:13px;margin:8px 0 0;">/100 overall score</p>
      </div>
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f8fafc;border-radius:8px;padding:16px;margin:16px 0;">
        <tr>
          <td style="padding:6px 16px;color:#475569;font-size:14px;"><strong>${params.findings}</strong> findings identified</td>
        </tr>
        <tr>
          <td style="padding:6px 16px;color:#ef4444;font-size:14px;"><strong>${params.criticalCount}</strong> critical issues</td>
        </tr>
      </table>
      ${btn(params.reportUrl, "View Full Report")}
      <p style="color:#94a3b8;font-size:12px;text-align:center;">Generate a recovery plan from your audit to get step-by-step fixes.</p>
    `),
  });
}

// ─── 3. Invoice / Payment Email ──────────────────────────

export async function sendInvoiceEmail(params: {
  to: string;
  planName: string;
  amount: string;
  currency: string;
  invoiceUrl?: string | null;
  pdfUrl?: string | null;
  periodEnd?: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Payment received — ${APP_NAME} ${params.planName} plan`,
    html: emailLayout("Payment Confirmation", `
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">Payment Confirmed</h2>
      <p style="color:#475569;line-height:1.6;">Thank you! Your payment has been processed successfully.</p>
      <table cellpadding="0" cellspacing="0" width="100%" style="background:#f0fdf4;border-radius:8px;margin:16px 0;">
        <tr><td style="padding:16px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding:4px 0;color:#475569;font-size:14px;">Plan</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${params.planName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#475569;font-size:14px;">Amount</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${params.amount} ${params.currency.toUpperCase()}</td>
            </tr>
            ${params.periodEnd ? `<tr>
              <td style="padding:4px 0;color:#475569;font-size:14px;">Next renewal</td>
              <td style="padding:4px 0;color:#0f172a;font-size:14px;text-align:right;">${params.periodEnd}</td>
            </tr>` : ""}
          </table>
        </td></tr>
      </table>
      ${params.invoiceUrl ? btn(params.invoiceUrl, "View Invoice") : ""}
      ${params.pdfUrl ? `<p style="text-align:center;"><a href="${params.pdfUrl}" style="color:#6366f1;font-size:13px;text-decoration:none;">Download PDF</a></p>` : ""}
    `),
  });
}

// ─── 4. Payment Failed Email ─────────────────────────────

export async function sendPaymentFailedEmail(params: {
  to: string;
  planName: string;
  amount: string;
  retryUrl?: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Payment failed — Action required for your ${APP_NAME} account`,
    html: emailLayout("Payment Failed", `
      <h2 style="color:#dc2626;margin:0 0 12px;font-size:20px;">Payment Failed</h2>
      <p style="color:#475569;line-height:1.6;">We couldn't process your payment of <strong>${params.amount}</strong> for the <strong>${params.planName}</strong> plan.</p>
      <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #ef4444;">
        <p style="color:#991b1b;font-size:14px;margin:0;">Please update your payment method to avoid service interruption. Your account will be downgraded if payment is not resolved within 7 days.</p>
      </div>
      ${btn(params.retryUrl || `${APP_URL}/billing`, "Update Payment Method", "#dc2626")}
    `),
  });
}

// ─── 5. Subscription Changed Email ───────────────────────

export async function sendSubscriptionChangedEmail(params: {
  to: string;
  action: "upgraded" | "downgraded" | "canceled" | "reactivated";
  planName: string;
  periodEnd?: string;
}) {
  const titles: Record<string, string> = {
    upgraded: "Plan Upgraded",
    downgraded: "Plan Changed",
    canceled: "Subscription Canceled",
    reactivated: "Subscription Reactivated",
  };
  const messages: Record<string, string> = {
    upgraded: `You've upgraded to the <strong>${params.planName}</strong> plan. Your new features are now active!`,
    downgraded: `Your plan has been changed to <strong>${params.planName}</strong>.`,
    canceled: `Your subscription has been canceled. You'll retain access to your current plan until the end of your billing period${params.periodEnd ? ` (${params.periodEnd})` : ""}.`,
    reactivated: `Your <strong>${params.planName}</strong> subscription is now active again.`,
  };
  return sendEmail({
    to: params.to,
    subject: `${titles[params.action]} — ${APP_NAME}`,
    html: emailLayout(titles[params.action], `
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">${titles[params.action]}</h2>
      <p style="color:#475569;line-height:1.6;">${messages[params.action]}</p>
      ${btn(`${APP_URL}/billing`, "Manage Billing")}
    `),
  });
}

// ─── 6. Password Reset Email ─────────────────────────────

export async function sendPasswordResetEmail(params: {
  to: string;
  resetUrl: string;
  name?: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Reset your ${APP_NAME} password`,
    html: emailLayout("Password Reset", `
      <h2 style="color:#0f172a;margin:0 0 12px;font-size:20px;">Reset Your Password</h2>
      <p style="color:#475569;line-height:1.6;">Hi ${params.name || "there"}, we received a request to reset your password. Click the button below to choose a new one.</p>
      ${btn(params.resetUrl, "Reset Password")}
      <p style="color:#94a3b8;font-size:12px;text-align:center;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `),
  });
}

// ─── 7. Audit Failed Email ───────────────────────────────

export async function sendAuditFailedEmail(params: {
  to: string;
  businessName: string;
  reason: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Audit failed for ${params.businessName}`,
    html: emailLayout("Audit Failed", `
      <h2 style="color:#dc2626;margin:0 0 12px;font-size:20px;">Audit Could Not Complete</h2>
      <p style="color:#475569;line-height:1.6;">The audit for <strong>${params.businessName}</strong> was unable to complete.</p>
      <div style="background:#fef2f2;border-radius:8px;padding:16px;margin:16px 0;border-left:4px solid #ef4444;">
        <p style="color:#991b1b;font-size:14px;margin:0;">${params.reason}</p>
      </div>
      ${btn(`${APP_URL}/dashboard`, "Go to Dashboard")}
    `),
  });
}

// Legacy export alias
export const sendAuditReport = sendAuditCompleteEmail;
