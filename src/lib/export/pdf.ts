import PDFDocument from "pdfkit";
import path from "path";
import fs from "fs";

// PDFKit's built-in fonts break in webpack/Next.js because .afm files aren't bundled.
// Copy them from node_modules to the expected webpack output location on first use.
let fontsCopied = false;
function ensurePdfkitFonts() {
  if (fontsCopied) return;
  try {
    const cwd = process.cwd();
    const targetDir = path.join(cwd, ".next", "server", "vendor-chunks", "data");
    if (!fs.existsSync(path.join(targetDir, "Helvetica.afm"))) {
      // Use filesystem path directly — require.resolve returns virtual webpack paths
      const pdfkitDataDir = path.join(cwd, "node_modules", "pdfkit", "js", "data");
      if (!fs.existsSync(pdfkitDataDir)) {
        console.error("[pdf] PDFKit data dir not found at:", pdfkitDataDir);
        return;
      }
      fs.mkdirSync(targetDir, { recursive: true });
      for (const file of fs.readdirSync(pdfkitDataDir)) {
        if (file.endsWith(".afm")) {
          fs.copyFileSync(path.join(pdfkitDataDir, file), path.join(targetDir, file));
        }
      }
      console.log("[pdf] Copied PDFKit font files to", targetDir);
    }
    fontsCopied = true;
  } catch (e: any) {
    console.error("[pdf] Failed to copy font files:", e.message);
  }
}

interface PdfBranding {
  companyName?: string;
  tagline?: string;
  websiteUrl?: string;
}

interface PdfData {
  title: string;
  businessName: string;
  industry: string;
  country?: string;
  city?: string;
  websiteUrl?: string;
  overallScore: number;
  scores: { label: string; score: number }[];
  rootCause: string;
  findings: { category: string; title: string; severity: string; detail: string; url?: string; evidence?: string }[];
  generatedAt?: string;
  crawlStats?: { pagesCrawled?: number; pagesErrored?: number; durationMs?: number; sitemapFound?: boolean; robotsTxtFound?: boolean };
  branding?: PdfBranding;
}

const COLORS = {
  primary: "#4f46e5",
  primaryDark: "#3730a3",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  textDark: "#111827",
  textMedium: "#374151",
  textLight: "#6b7280",
  textMuted: "#9ca3af",
  bg: "#f9fafb",
  border: "#e5e7eb",
  white: "#ffffff",
  criticalBg: "#fef2f2",
  highBg: "#fff7ed",
  mediumBg: "#fefce8",
  lowBg: "#eff6ff",
};

function getScoreColor(score: number): string {
  if (score >= 70) return COLORS.success;
  if (score >= 40) return COLORS.warning;
  return COLORS.danger;
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL": return COLORS.danger;
    case "HIGH": return "#f97316";
    case "MEDIUM": return COLORS.warning;
    case "LOW": return "#3b82f6";
    default: return COLORS.textLight;
  }
}

export async function generatePdfReport(data: PdfData): Promise<Buffer> {
  ensurePdfkitFonts();
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const pageWidth = doc.page.width - 100; // 50 margin each side

    // White-label branding
    const brandName = data.branding?.companyName || "Tasknator";
    const brandTagline = data.branding?.tagline || "AI Business Diagnostics Report";
    const brandUrl = data.branding?.websiteUrl || "www.tasknator.com";
    const isWhiteLabel = !!data.branding?.companyName;

    // ─── Header Banner ───────────────────────────────────
    doc.rect(0, 0, doc.page.width, 120).fill(COLORS.primary);
    doc.fontSize(28).font("Helvetica-Bold").fillColor(COLORS.white).text(brandName.toUpperCase(), 50, 30);
    doc.fontSize(11).font("Helvetica").fillColor("#c7d2fe").text(brandTagline, 50, 62);
    doc.fontSize(9).fillColor("#a5b4fc").text(data.generatedAt || new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }), 50, 80);

    // Overall score circle in header
    const scoreX = doc.page.width - 120;
    doc.circle(scoreX, 60, 35).fill(COLORS.white);
    doc.fontSize(24).font("Helvetica-Bold").fillColor(getScoreColor(data.overallScore));
    const scoreText = String(data.overallScore);
    const scoreTextWidth = doc.widthOfString(scoreText);
    doc.text(scoreText, scoreX - scoreTextWidth / 2, 47);
    doc.fontSize(7).font("Helvetica").fillColor(COLORS.textLight);
    doc.text("/100", scoreX - 8, 72);

    doc.y = 140;

    // ─── Business Info Section ───────────────────────────
    doc.fontSize(16).font("Helvetica-Bold").fillColor(COLORS.textDark).text(data.businessName, 50);
    doc.moveDown(0.3);

    const infoParts: string[] = [];
    if (data.industry) infoParts.push(data.industry);
    if (data.city && data.country) infoParts.push(`${data.city}, ${data.country}`);
    else if (data.country) infoParts.push(data.country);
    if (data.websiteUrl) infoParts.push(data.websiteUrl);

    doc.fontSize(10).font("Helvetica").fillColor(COLORS.textLight).text(infoParts.join("  |  "), 50);
    doc.moveDown(1.5);

    // ─── Score Breakdown ─────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.primary).text("SCORE BREAKDOWN", 50);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.moveDown(0.8);

    const barHeight = 14;
    const barMaxWidth = pageWidth - 120;
    const labelWidth = 100;

    for (const score of data.scores) {
      const y = doc.y;
      const color = getScoreColor(score.score);
      const barWidth = (score.score / 100) * barMaxWidth;

      doc.fontSize(10).font("Helvetica").fillColor(COLORS.textMedium).text(score.label, 50, y + 1, { width: labelWidth });

      const barX = 50 + labelWidth + 10;
      doc.roundedRect(barX, y, barMaxWidth, barHeight, 3).fill("#f3f4f6");
      if (barWidth > 0) {
        doc.roundedRect(barX, y, Math.max(barWidth, 6), barHeight, 3).fill(color);
      }
      doc.fontSize(10).font("Helvetica-Bold").fillColor(COLORS.textDark);
      doc.text(`${score.score}`, barX + barMaxWidth + 8, y + 1);
      doc.y = y + barHeight + 8;
    }

    doc.moveDown(1);

    // ─── SEO Crawl Stats ────────────────────────────────
    if (data.crawlStats && data.crawlStats.pagesCrawled) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.primary).text("SEO CRAWL SUMMARY", 50);
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(COLORS.border).lineWidth(1).stroke();
      doc.moveDown(0.5);
      const cs = data.crawlStats;
      doc.fontSize(10).font("Helvetica").fillColor(COLORS.textDark);
      doc.text(`Pages Crawled: ${cs.pagesCrawled}    Errors: ${cs.pagesErrored || 0}    Duration: ${((cs.durationMs || 0) / 1000).toFixed(1)}s    Sitemap: ${cs.sitemapFound ? "Found" : "Not Found"}    Robots.txt: ${cs.robotsTxtFound ? "Found" : "Not Found"}`, 50, doc.y, { width: pageWidth });
      doc.moveDown(1);
    }

    // ─── Root Cause Analysis ─────────────────────────────
    if (data.rootCause) {
      doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.primary).text("ROOT CAUSE ANALYSIS", 50);
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(COLORS.border).lineWidth(1).stroke();
      doc.moveDown(0.5);

      const rcY = doc.y;
      const rcHeight = doc.heightOfString(data.rootCause, { width: pageWidth - 30 }) + 20;
      doc.roundedRect(50, rcY, pageWidth, rcHeight, 6).fill("#fff7ed");
      doc.roundedRect(50, rcY, 4, rcHeight, 2).fill("#f97316");
      doc.fontSize(10).font("Helvetica").fillColor("#9a3412").text(data.rootCause, 65, rcY + 10, { width: pageWidth - 30 });
      doc.y = rcY + rcHeight + 15;
    }

    // ─── Findings ────────────────────────────────────────
    doc.fontSize(14).font("Helvetica-Bold").fillColor(COLORS.primary).text("AUDIT FINDINGS", 50);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.moveDown(0.5);

    doc.fontSize(9).font("Helvetica").fillColor(COLORS.textLight).text(`${data.findings.length} issues identified`, 50);
    doc.moveDown(0.8);

    const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
    const grouped = new Map<string, typeof data.findings>();
    for (const f of data.findings) {
      const arr = grouped.get(f.severity) || [];
      arr.push(f);
      grouped.set(f.severity, arr);
    }

    for (const severity of severityOrder) {
      const findings = grouped.get(severity);
      if (!findings || findings.length === 0) continue;

      for (const finding of findings) {
        const estimatedHeight = 60 + doc.heightOfString(finding.detail, { width: pageWidth - 30 });
        if (doc.y + estimatedHeight > doc.page.height - 80) {
          doc.addPage();
        }

        const y = doc.y;
        const sevColor = getSeverityColor(finding.severity);

        const badgeText = finding.severity;
        doc.fontSize(7).font("Helvetica-Bold");
        const badgeWidth = doc.widthOfString(badgeText) + 12;
        doc.roundedRect(50, y, badgeWidth, 16, 3).fill(sevColor);
        doc.fontSize(7).font("Helvetica-Bold").fillColor(COLORS.white).text(badgeText, 56, y + 4);

        doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted).text(finding.category.toUpperCase(), 50 + badgeWidth + 8, y + 4);

        doc.y = y + 20;
        doc.fontSize(11).font("Helvetica-Bold").fillColor(COLORS.textDark).text(finding.title, 50);
        doc.moveDown(0.2);
        doc.fontSize(9).font("Helvetica").fillColor(COLORS.textMedium).text(finding.detail, 50, doc.y, { width: pageWidth });
        if (finding.url) {
          doc.moveDown(0.2);
          doc.fontSize(8).font("Helvetica").fillColor(COLORS.primary).text(`URL: ${finding.url}`, 50, doc.y, { width: pageWidth, link: finding.url });
        }
        if (finding.evidence) {
          doc.moveDown(0.2);
          doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted).text(`Evidence: ${finding.evidence}`, 50, doc.y, { width: pageWidth });
        }
        doc.moveDown(0.8);
        doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor("#f3f4f6").lineWidth(0.5).stroke();
        doc.moveDown(0.5);
      }
    }

    // ─── Footer ──────────────────────────────────────────
    doc.moveDown(2);
    if (doc.y > doc.page.height - 80) doc.addPage();

    doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).font("Helvetica").fillColor(COLORS.textMuted);
    if (isWhiteLabel) {
      doc.text(`Generated by ${brandName}`, 50, doc.y, { align: "center" });
      if (brandUrl) {
        doc.moveDown(0.3);
        doc.fontSize(7).fillColor(COLORS.textMuted).text(brandUrl, { align: "center" });
      }
    } else {
      doc.text("Generated by Tasknator — AI that diagnoses & fixes business bottlenecks", 50, doc.y, { align: "center" });
      doc.moveDown(0.3);
      doc.fontSize(7).fillColor(COLORS.textMuted).text("www.tasknator.com", { align: "center" });
    }

    doc.end();
  });
}
