import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailgun.org",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail(options: SendEmailOptions) {
  const from = options.from || process.env.EMAIL_FROM || "Tasknator <noreply@tasknator.com>";

  return transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });
}

export async function sendAuditReport(params: {
  to: string;
  businessName: string;
  score: number;
  reportUrl: string;
}) {
  return sendEmail({
    to: params.to,
    subject: `Audit Report Ready: ${params.businessName} — Score ${params.score}/100`,
    html: auditReportTemplate(params),
  });
}

function auditReportTemplate(params: { businessName: string; score: number; reportUrl: string }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0f172a; font-size: 24px;">Tasknator</h1>
    <p style="color: #64748b;">AI Business Diagnostics</p>
  </div>
  <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
    <h2 style="color: #0f172a; margin: 0 0 10px;">Your Audit Report is Ready</h2>
    <p style="color: #475569;">Business: <strong>${params.businessName}</strong></p>
    <div style="text-align: center; margin: 20px 0;">
      <span style="font-size: 48px; font-weight: 700; color: ${params.score >= 70 ? '#22c55e' : params.score >= 40 ? '#f59e0b' : '#ef4444'};">${params.score}</span>
      <span style="color: #64748b; font-size: 18px;">/100</span>
    </div>
    <div style="text-align: center;">
      <a href="${params.reportUrl}" style="display: inline-block; padding: 12px 32px; background: #2563eb; color: white; border-radius: 8px; text-decoration: none; font-weight: 600;">View Full Report</a>
    </div>
  </div>
  <p style="color: #94a3b8; font-size: 12px; text-align: center;">Tasknator — AI that fixes business bottlenecks</p>
</body>
</html>`;
}

export async function sendWelcomeEmail(params: { to: string; name: string }) {
  return sendEmail({
    to: params.to,
    subject: "Welcome to Tasknator — Let's fix your business",
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #0f172a; font-size: 24px;">Welcome to Tasknator</h1>
  </div>
  <p>Hi ${params.name || "there"},</p>
  <p>Thanks for joining Tasknator. We help businesses identify what's broken and generate actionable recovery plans.</p>
  <p><strong>Here's how to get started:</strong></p>
  <ol>
    <li>Set up your business profile</li>
    <li>Run your first audit</li>
    <li>Get your personalized repair plan</li>
  </ol>
  <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 40px;">Tasknator — AI that fixes business bottlenecks</p>
</body>
</html>`,
  });
}
