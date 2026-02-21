const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const outputPath = path.join(__dirname, "..", "delivery-functions-1-4.pdf");
const doc = new PDFDocument({
  size: "A4",
  margins: { top: 60, bottom: 60, left: 55, right: 55 },
  info: {
    Title: "Tasknator — Functions 1 & 4 Delivery",
    Author: "Development Team",
  },
});

doc.pipe(fs.createWriteStream(outputPath));

const COLORS = {
  primary: "#4f46e5",
  dark: "#1e1b4b",
  text: "#334155",
  muted: "#64748b",
  accent: "#7c3aed",
  green: "#059669",
  orange: "#ea580c",
  bg: "#f8fafc",
  white: "#ffffff",
  line: "#e2e8f0",
};

// ── Helper functions ──

function drawHeader() {
  // Gradient-style header bar
  doc.rect(0, 0, doc.page.width, 110).fill(COLORS.primary);
  doc.rect(0, 100, doc.page.width, 10).fill(COLORS.accent);

  doc
    .font("Helvetica-Bold")
    .fontSize(28)
    .fillColor(COLORS.white)
    .text("Tasknator", 55, 30);

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#c7d2fe")
    .text("Functions 1 & 4 — Implementation Delivery", 55, 62);

  doc
    .fontSize(10)
    .text("February 2026", 55, 82);

  doc.moveDown(3);
  doc.y = 135;
}

function sectionTitle(text) {
  doc.moveDown(0.5);
  // Colored left bar
  const y = doc.y;
  doc.rect(55, y, 4, 22).fill(COLORS.primary);
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor(COLORS.dark)
    .text(text, 68, y + 2);
  doc.moveDown(0.8);
}

function subTitle(text) {
  doc.moveDown(0.3);
  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(COLORS.accent)
    .text(text, 55);
  doc.moveDown(0.3);
}

function bodyText(text) {
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(text, 55, doc.y, { width: doc.page.width - 110, lineGap: 3 });
  doc.moveDown(0.4);
}

function bulletPoint(text) {
  const x = 65;
  const y = doc.y;
  doc.circle(x, y + 5, 2).fill(COLORS.primary);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(text, x + 10, y, { width: doc.page.width - 130, lineGap: 2 });
  doc.moveDown(0.2);
}

function stepItem(number, text) {
  const x = 65;
  const y = doc.y;
  // Step number circle
  doc.circle(x + 6, y + 5, 8).fill(COLORS.primary);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(COLORS.white)
    .text(String(number), x + 1, y + 1.5, { width: 12, align: "center" });
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(COLORS.text)
    .text(text, x + 22, y, { width: doc.page.width - 150, lineGap: 2 });
  doc.moveDown(0.3);
}

function uiLocation(label, location) {
  const x = 65;
  const y = doc.y;
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.dark)
    .text(label + ": ", x, y, { continued: true });
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(location);
  doc.moveDown(0.15);
}

function divider() {
  doc.moveDown(0.5);
  doc
    .moveTo(55, doc.y)
    .lineTo(doc.page.width - 55, doc.y)
    .strokeColor(COLORS.line)
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.5);
}

function pipelineBox(text) {
  doc.moveDown(0.5);
  const y = doc.y;
  const w = doc.page.width - 110;
  doc.roundedRect(55, y, w, 50, 8).fill("#eef2ff");
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(COLORS.primary)
    .text(text, 70, y + 10, { width: w - 30, lineGap: 3, align: "center" });
  doc.y = y + 60;
}

function checkNewPage(minSpace) {
  if (doc.y > doc.page.height - minSpace) {
    doc.addPage();
    doc.y = 60;
  }
}

// ── Build the PDF ──

drawHeader();

// Intro
doc
  .font("Helvetica")
  .fontSize(11)
  .fillColor(COLORS.text)
  .text(
    "Here's a full update on what's been implemented. Functions 1 and 4 are done and working end-to-end.",
    55, doc.y, { width: doc.page.width - 110, lineGap: 3 }
  );

divider();

// ═══════════════════════════════════════════
// FUNCTION 1
// ═══════════════════════════════════════════

sectionTitle("Function 1 — Deep SEO Audit");

bodyText(
  "The platform now crawls up to 200 pages of a business website and produces a detailed technical SEO report. Every issue found includes the exact page URL and hard evidence — no guesswork."
);

subTitle("How it works");

stepItem(1,
  "You open a business profile and click \"Run Audit\". The system starts crawling the site immediately."
);

stepItem(2,
  "It checks robots.txt and sitemap.xml first, then visits pages in batches of 5 with a polite delay between requests. For each page it checks: title tag, meta description, H1 headings, canonical URL, word count, images, alt text, and response time. It stops after 200 pages or 5 minutes."
);

stepItem(3,
  "The analyzer runs 16 checks: missing titles, duplicate titles, missing meta descriptions, duplicate meta descriptions, missing H1, multiple H1s, 404 errors, 500 server errors, redirect chains, thin content (under 300 words), noindex on important pages, broken canonicals, missing sitemap, missing robots.txt, images without alt text, and slow pages (over 3 seconds). Each issue gets a severity level — CRITICAL, HIGH, MEDIUM, or LOW."
);

checkNewPage(120);

stepItem(4,
  "The AI (Anthropic, OpenAI, or Gemini — whichever is configured in Settings) scores the business across 6 categories: Website Quality, SEO, Social Media, Offer/Pricing, Reputation, and Local Presence."
);

stepItem(5,
  "The workspace owner gets an email notification when the audit finishes."
);

checkNewPage(200);

subTitle("Where to find it in the UI");

uiLocation("Start an audit", "Business profile page → \"Run Audit\" button");
uiLocation("All audits", "Sidebar → Audits");
uiLocation("Full report", "/business/[id]/audit/[auditId]");
uiLocation("Crawl summary", "Top of report — pages crawled, errors, duration, sitemap/robots status");
uiLocation("Score breakdown", "6 circular gauges: Website, SEO, Social, Offer, Reputation, Local");
uiLocation("Root cause", "Orange card below scores — AI-generated summary of main problems");
uiLocation("Findings list", "Sorted by severity, each with clickable URL + expandable evidence");
uiLocation("PDF export", "\"Download PDF Report\" button in the top-right corner");

divider();
checkNewPage(200);

// ═══════════════════════════════════════════
// FUNCTION 4
// ═══════════════════════════════════════════

sectionTitle("Function 4 — Asset Generator with Deploy Tasks");

bodyText(
  "After an audit completes, you can generate a 30/60/90-day recovery plan. The system takes all the audit findings and turns them into actionable tasks and marketing assets, each with a KPI target and step-by-step deployment instructions."
);

subTitle("How it works");

stepItem(1,
  "Click \"Generate Plan\" on the business profile page after the audit is done."
);

stepItem(2,
  "The system creates tasks in three phases: Day 30 (Quick Wins — critical/high fixes, 2-4h each), Day 60 (Build Momentum — medium improvements, 1-3h each), Day 90 (Scale & Optimize — low-priority optimizations, 1-2h each)."
);

checkNewPage(200);

stepItem(3,
  "Based on finding categories, the system generates specific marketing assets with KPI targets:"
);

bulletPoint("Website → Website Copy & CTAs (bounce rate < 40%)");
bulletPoint("SEO → SEO Content Plan (organic traffic +20% in 60 days)");
bulletPoint("Social → Ad Copy (CTR > 2%), Captions (engagement > 5%), Hook Scripts (hook rate > 50%), UGC Scripts (CTR > 3%)");
bulletPoint("Offer → Pricing Packages (conversion +15%), Sales Scripts (close rate +20%), Creative Brief (ROAS > 3x)");
bulletPoint("Reputation → Review Reply Templates (100% response within 24h)");
bulletPoint("Local → Email Sequences (open rate > 25%)");

checkNewPage(120);

stepItem(4,
  "Every asset gets its own deployment task with 5 concrete steps. Example for Hook Scripts: select top 3 hooks → film each → post on TikTok/Reels/Shorts → track hook rate → double down on winner after 48h."
);

stepItem(5,
  "Assets start as placeholders. Click \"Regenerate\" to fill them with AI-generated content. Every save and regeneration creates a new version — full version history preserved."
);

checkNewPage(200);

subTitle("Where to find it in the UI");

uiLocation("Generate a plan", "Business profile → \"Generate Plan\" (after audit)");
uiLocation("All plans", "Sidebar → Repair Plans");
uiLocation("Plan detail", "/business/[id]/plan/[planId] — tasks by phase, progress card");
uiLocation("Task details", "Checkbox, impact badge, time estimate, \"X assets linked\" count");
uiLocation("Assets grid", "Bottom of plan page — type, title, KPI, versions");
uiLocation("Asset editor", "/assets/[id] — KPI target (green), linked task (blue)");
uiLocation("Version history", "\"Versions\" dropdown — click to restore any version");
uiLocation("Regenerate", "\"Regenerate\" button — generates fresh AI content");
uiLocation("All assets", "Sidebar → Assets");
uiLocation("Export", "\"Export ZIP\" button on plan page");

divider();
checkNewPage(180);

// ═══════════════════════════════════════════
// SALES DOCTOR
// ═══════════════════════════════════════════

sectionTitle("Sales Doctor");

bodyText(
  "A dedicated module in the sidebar showing only Offer Packages and Sales Scripts — the two asset types focused on revenue. Think of it as a focused workspace for the sales team."
);

bodyText(
  "They see overview cards showing how many offer packages and sales scripts have been generated, then can click into any one to edit it. It includes a \"How it works\" guide: Run Audit → Generate Plan → Edit & Deploy."
);

bodyText(
  "Sales Doctor requires the Starter plan or above. On the free plan it shows an upgrade prompt. It pulls from the same assets generated by Function 4, just filtered to sales-relevant content."
);

subTitle("Where to find it");
uiLocation("Sales Doctor", "Sidebar → Sales Doctor");

divider();
checkNewPage(120);

// ═══════════════════════════════════════════
// FULL PIPELINE
// ═══════════════════════════════════════════

sectionTitle("The Full Pipeline");

pipelineBox(
  "Add Business  →  Run Audit (200 pages)  →  View Report (per-URL evidence)  →  Generate Plan (30/60/90 days)  →  View Tasks + Deploy Steps  →  Open Asset Editor  →  Regenerate with AI  →  Track KPI"
);

doc.moveDown(0.5);
bodyText(
  "Everything is accessible from the sidebar: Businesses, Audits, Repair Plans, Assets, Sales Doctor."
);

// Footer line right after content
doc.moveDown(1);
doc
  .moveTo(55, doc.y)
  .lineTo(doc.page.width - 55, doc.y)
  .strokeColor(COLORS.line)
  .lineWidth(0.5)
  .stroke();
doc.moveDown(0.3);
doc
  .font("Helvetica")
  .fontSize(8)
  .fillColor(COLORS.muted)
  .text("Tasknator — AI Business Diagnostics Platform  |  February 2026", 55, doc.y, {
    width: doc.page.width - 110,
    align: "center",
  });

doc.end();
console.log("PDF generated:", outputPath);
