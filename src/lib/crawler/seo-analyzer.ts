/**
 * SEO Analyzer — takes CrawlResult and produces structured SEO findings.
 * EVERY issue produces a per-URL finding with: URL concerned + proof + priority.
 * This gives clients granular, actionable evidence for each problem.
 */

import { CrawlResult, CrawledPage } from "./seo-crawler";

export interface SEOIssue {
  category: string;
  title: string;
  detail: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  fixable: boolean;
  url: string;
  evidence: string;
}

const MAX_FINDINGS = 300;

function pathOf(url: string): string {
  try { return new URL(url).pathname; } catch { return url; }
}

export function analyzeCrawlResults(crawlResult: CrawlResult, businessUrl: string): SEOIssue[] {
  const issues: SEOIssue[] = [];
  const htmlPages = crawlResult.pages.filter((p) => p.statusCode === 200 && p.wordCount > 0);

  // ── 1. Missing <title> — one finding PER page ──
  for (const p of htmlPages) {
    if (!p.title) {
      issues.push({
        category: "seo",
        title: `Missing <title> tag: ${pathOf(p.url)}`,
        detail: `This page has no <title> tag. Without a title, search engines cannot display it properly in results and CTR drops significantly.`,
        severity: "CRITICAL",
        fixable: true,
        url: p.url,
        evidence: `HTML source contains no <title> element. Word count on page: ${p.wordCount}.`,
      });
    }
  }

  // ── 2. Duplicate titles — one finding per duplicate group, listing all URLs ──
  const titleMap = new Map<string, string[]>();
  for (const p of htmlPages) {
    if (p.title) {
      const existing = titleMap.get(p.title) || [];
      existing.push(p.url);
      titleMap.set(p.title, existing);
    }
  }
  for (const [title, urls] of Array.from(titleMap.entries())) {
    if (urls.length > 1) {
      for (const u of urls) {
        issues.push({
          category: "seo",
          title: `Duplicate title on ${pathOf(u)}`,
          detail: `This page shares its title "${title.substring(0, 80)}" with ${urls.length - 1} other page(s). Each page must have a unique <title> for optimal indexing.`,
          severity: "HIGH",
          fixable: true,
          url: u,
          evidence: `Title: "${title}". Also found on: ${urls.filter((x: string) => x !== u).join(", ")}`,
        });
      }
    }
  }

  // ── 3. Missing meta description — per URL ──
  for (const p of htmlPages) {
    if (!p.metaDescription) {
      issues.push({
        category: "seo",
        title: `Missing meta description: ${pathOf(p.url)}`,
        detail: `No <meta name="description"> found. Google will auto-generate a snippet which may not be compelling. Add a 150-160 character description.`,
        severity: "HIGH",
        fixable: true,
        url: p.url,
        evidence: `HTML source contains no <meta name="description" content="..."> tag.`,
      });
    }
  }

  // ── 4. Duplicate meta descriptions — per URL ──
  const metaMap = new Map<string, string[]>();
  for (const p of htmlPages) {
    if (p.metaDescription) {
      const existing = metaMap.get(p.metaDescription) || [];
      existing.push(p.url);
      metaMap.set(p.metaDescription, existing);
    }
  }
  for (const [desc, urls] of Array.from(metaMap.entries())) {
    if (urls.length > 1) {
      for (const u of urls) {
        issues.push({
          category: "seo",
          title: `Duplicate meta description on ${pathOf(u)}`,
          detail: `This page shares its meta description with ${urls.length - 1} other page(s). Unique descriptions improve CTR in search results.`,
          severity: "MEDIUM",
          fixable: true,
          url: u,
          evidence: `Meta description: "${desc.substring(0, 120)}...". Also on: ${urls.filter((x: string) => x !== u).join(", ")}`,
        });
      }
    }
  }

  // ── 5. Missing H1 — per URL ──
  for (const p of htmlPages) {
    if (p.h1s.length === 0) {
      issues.push({
        category: "seo",
        title: `Missing H1 heading: ${pathOf(p.url)}`,
        detail: `This page has no <h1> tag. The H1 is the primary heading signal for search engines and should describe the page content clearly.`,
        severity: "HIGH",
        fixable: true,
        url: p.url,
        evidence: `No <h1> element found in HTML source. Page title: "${p.title || "(none)"}".`,
      });
    }
  }

  // ── 6. Multiple H1s — per URL ──
  for (const p of htmlPages) {
    if (p.h1s.length > 1) {
      issues.push({
        category: "seo",
        title: `Multiple H1 tags: ${pathOf(p.url)}`,
        detail: `Found ${p.h1s.length} H1 tags on this page. Best practice is exactly one H1 per page to avoid diluting the heading signal.`,
        severity: "MEDIUM",
        fixable: true,
        url: p.url,
        evidence: `${p.h1s.length} H1 tags found: ${p.h1s.map((h) => `"${h}"`).join(", ")}`,
      });
    }
  }

  // ── 7. 4xx errors — per URL ──
  for (const p of crawlResult.pages) {
    if (p.statusCode >= 400 && p.statusCode < 500) {
      issues.push({
        category: "seo",
        title: `HTTP ${p.statusCode} error: ${pathOf(p.url)}`,
        detail: `This page returns a ${p.statusCode} error. Broken pages hurt UX and waste crawl budget. Fix the content or set up a 301 redirect.`,
        severity: "CRITICAL",
        fixable: true,
        url: p.url,
        evidence: `HTTP response status code: ${p.statusCode}. Response time: ${p.responseTimeMs}ms.`,
      });
    }
  }

  // ── 8. 5xx server errors — per URL ──
  for (const p of crawlResult.pages) {
    if (p.statusCode >= 500) {
      issues.push({
        category: "seo",
        title: `Server error (${p.statusCode}): ${pathOf(p.url)}`,
        detail: `This page returns a server error, indicating infrastructure problems. Server errors must be fixed immediately as they affect all visitors.`,
        severity: "CRITICAL",
        fixable: true,
        url: p.url,
        evidence: `HTTP response status code: ${p.statusCode}. Response time: ${p.responseTimeMs}ms.`,
      });
    }
  }

  // ── 9. Redirects — per URL ──
  for (const p of crawlResult.pages) {
    if (p.statusCode >= 300 && p.statusCode < 400) {
      issues.push({
        category: "seo",
        title: `Redirect (${p.statusCode}): ${pathOf(p.url)}`,
        detail: `This page redirects to ${p.redirectTarget || "unknown"}. Internal links should point to the final URL to avoid redirect chains and preserve link equity.`,
        severity: "MEDIUM",
        fixable: true,
        url: p.url,
        evidence: `${p.statusCode} redirect → ${p.redirectTarget || "unknown destination"}. Response time: ${p.responseTimeMs}ms.`,
      });
    }
  }

  // ── 10. Thin content — per URL ──
  const utilityPaths = ["/contact", "/login", "/register", "/cart", "/checkout", "/search", "/404", "/privacy", "/terms"];
  for (const p of htmlPages) {
    const path = pathOf(p.url).toLowerCase();
    if (p.wordCount < 300 && !utilityPaths.some((u) => path.includes(u))) {
      issues.push({
        category: "seo",
        title: `Thin content (${p.wordCount} words): ${pathOf(p.url)}`,
        detail: `This page has only ${p.wordCount} words. Pages with fewer than 300 words tend to rank poorly. Aim for 500+ words with valuable, original content.`,
        severity: p.wordCount < 100 ? "HIGH" : "MEDIUM",
        fixable: true,
        url: p.url,
        evidence: `Word count: ${p.wordCount}. Title: "${p.title || "(none)"}". H1: "${p.h1s[0] || "(none)"}".`,
      });
    }
  }

  // ── 11. Noindex on important pages — per URL ──
  for (const p of htmlPages) {
    if (p.noindex) {
      const path = pathOf(p.url);
      const isImportant = path === "/" || path.split("/").filter(Boolean).length <= 1;
      issues.push({
        category: "seo",
        title: `Noindex directive: ${path}`,
        detail: `This page has a noindex meta tag — it will NOT appear in search results. ${isImportant ? "This is a top-level page, which makes this especially damaging." : "Verify this is intentional."}`,
        severity: isImportant ? "CRITICAL" : "HIGH",
        fixable: true,
        url: p.url,
        evidence: `<meta name="robots" content="noindex"> detected on page.`,
      });
    }
  }

  // ── 12. Canonical issues — per URL ──
  for (const p of htmlPages) {
    if (p.canonical) {
      try {
        const canonicalParsed = new URL(p.canonical, p.url);
        const pageParsed = new URL(p.url);
        if (canonicalParsed.hostname !== pageParsed.hostname) {
          issues.push({
            category: "seo",
            title: `Canonical to external domain: ${pathOf(p.url)}`,
            detail: `The canonical tag points to ${canonicalParsed.hostname}, telling search engines to ignore this page in favor of that domain's version.`,
            severity: "HIGH",
            fixable: true,
            url: p.url,
            evidence: `Canonical URL: ${p.canonical}. Page domain: ${pageParsed.hostname}. Canonical domain: ${canonicalParsed.hostname}.`,
          });
        }
      } catch {
        // Invalid canonical URL
      }
    }
  }

  // ── 13. Missing sitemap.xml ──
  if (!crawlResult.sitemapFound) {
    issues.push({
      category: "seo",
      title: "No sitemap.xml found",
      detail: `No sitemap found at /sitemap.xml, /sitemap_index.xml, or referenced in robots.txt. A sitemap helps search engines discover and index all pages efficiently.`,
      severity: "CRITICAL",
      fixable: true,
      url: businessUrl,
      evidence: `Checked: ${businessUrl}/sitemap.xml, ${businessUrl}/sitemap_index.xml, and Sitemap directives in robots.txt. None returned valid XML.`,
    });
  }

  // ── 14. Missing robots.txt ──
  if (!crawlResult.stats.robotsTxtFound) {
    issues.push({
      category: "seo",
      title: "No robots.txt found",
      detail: `No robots.txt found at /robots.txt. While not required, it helps control crawling and can reference the sitemap.`,
      severity: "HIGH",
      fixable: true,
      url: businessUrl,
      evidence: `GET ${businessUrl}/robots.txt returned 404 or error.`,
    });
  }

  // ── 15. Images without alt text — per URL (pages with missing alt) ──
  for (const p of htmlPages) {
    if (p.imagesMissingAlt > 0) {
      const pct = p.imagesTotal > 0 ? Math.round((p.imagesMissingAlt / p.imagesTotal) * 100) : 0;
      issues.push({
        category: "seo",
        title: `${p.imagesMissingAlt} image${p.imagesMissingAlt > 1 ? "s" : ""} missing alt text: ${pathOf(p.url)}`,
        detail: `${p.imagesMissingAlt} of ${p.imagesTotal} images on this page lack alt attributes. Alt text is critical for accessibility and image SEO.`,
        severity: pct > 50 ? "HIGH" : "MEDIUM",
        fixable: true,
        url: p.url,
        evidence: `${p.imagesMissingAlt}/${p.imagesTotal} images (${pct}%) missing alt attribute on this page.`,
      });
    }
  }

  // ── 16. Slow pages — per URL ──
  for (const p of crawlResult.pages) {
    if (p.responseTimeMs > 3000 && p.statusCode === 200) {
      issues.push({
        category: "seo",
        title: `Slow response (${(p.responseTimeMs / 1000).toFixed(1)}s): ${pathOf(p.url)}`,
        detail: `This page took ${(p.responseTimeMs / 1000).toFixed(1)} seconds to respond. Google recommends pages load in under 2.5s. Slow pages hurt rankings and user experience.`,
        severity: p.responseTimeMs > 5000 ? "HIGH" : "MEDIUM",
        fixable: true,
        url: p.url,
        evidence: `Server response time: ${p.responseTimeMs}ms (${(p.responseTimeMs / 1000).toFixed(1)}s). Threshold: 3000ms.`,
      });
    }
  }

  // Sort by severity priority, then return capped
  const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
  issues.sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));

  return issues.slice(0, MAX_FINDINGS);
}

/**
 * Build a compact crawl summary string for injecting into the AI audit prompt.
 */
export function buildCrawlSummary(crawlResult: CrawlResult): string {
  const { pages, stats } = crawlResult;
  const htmlPages = pages.filter((p) => p.statusCode === 200 && p.wordCount > 0);
  const missingTitles = htmlPages.filter((p) => !p.title).length;
  const missingMeta = htmlPages.filter((p) => !p.metaDescription).length;
  const missingH1 = htmlPages.filter((p) => p.h1s.length === 0).length;
  const errors4xx = pages.filter((p) => p.statusCode >= 400 && p.statusCode < 500).length;
  const errors5xx = pages.filter((p) => p.statusCode >= 500).length;
  const thinContent = htmlPages.filter((p) => p.wordCount < 300).length;
  const avgResponseTime = pages.length > 0
    ? Math.round(pages.reduce((s, p) => s + p.responseTimeMs, 0) / pages.length)
    : 0;

  return `SEO CRAWL DATA (deep scan of ${stats.pagesCrawled} pages, up to 200):
- Pages with missing title tags: ${missingTitles}
- Pages with missing meta descriptions: ${missingMeta}
- Pages with missing H1: ${missingH1}
- 4xx errors found: ${errors4xx}
- 5xx errors found: ${errors5xx}
- Thin content pages (<300 words): ${thinContent}
- Sitemap.xml: ${stats.sitemapFound ? "found" : "NOT FOUND"}
- Robots.txt: ${stats.robotsTxtFound ? "found" : "NOT FOUND"}
- Average page response time: ${avgResponseTime}ms

NOTE: Detailed per-page technical SEO issues (with URL + evidence + priority) are documented separately by the crawler. Focus your SEO findings on content strategy, keyword optimization, and higher-level SEO recommendations rather than repeating technical page-level issues.`;
}
