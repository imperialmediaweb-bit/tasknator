/**
 * SEO Analyzer — takes CrawlResult and produces structured SEO findings
 * with affected URL + evidence + priority for each issue.
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

const MAX_FINDINGS = 50;

function truncateUrls(urls: string[], max: number = 5): string {
  if (urls.length <= max) return urls.join(", ");
  return urls.slice(0, max).join(", ") + ` ... and ${urls.length - max} more`;
}

export function analyzeCrawlResults(crawlResult: CrawlResult, businessUrl: string): SEOIssue[] {
  const issues: SEOIssue[] = [];
  const htmlPages = crawlResult.pages.filter((p) => p.statusCode === 200 && p.wordCount > 0);

  // 1. Missing titles
  const missingTitles = htmlPages.filter((p) => !p.title);
  if (missingTitles.length > 0) {
    issues.push({
      category: "seo",
      title: `${missingTitles.length} page${missingTitles.length > 1 ? "s" : ""} missing <title> tag`,
      detail: `Pages without title tags are invisible in search results. Affected: ${truncateUrls(missingTitles.map((p) => p.url))}`,
      severity: "CRITICAL",
      fixable: true,
      url: missingTitles[0].url,
      evidence: `No <title> tag found on ${missingTitles.length} page(s)`,
    });
  }

  // 2. Duplicate titles
  const titleMap = new Map<string, string[]>();
  for (const p of htmlPages) {
    if (p.title) {
      const existing = titleMap.get(p.title) || [];
      existing.push(p.url);
      titleMap.set(p.title, existing);
    }
  }
  const dupTitles = Array.from(titleMap.entries()).filter(([, urls]) => urls.length > 1);
  for (const [title, urls] of dupTitles.slice(0, 5)) {
    issues.push({
      category: "seo",
      title: `Duplicate title: "${title.substring(0, 60)}${title.length > 60 ? "..." : ""}"`,
      detail: `${urls.length} pages share the same title tag. Each page should have a unique, descriptive title. Pages: ${truncateUrls(urls)}`,
      severity: "HIGH",
      fixable: true,
      url: urls[0],
      evidence: `Title "${title}" found on ${urls.length} pages: ${urls.join(", ")}`,
    });
  }

  // 3. Missing meta descriptions
  const missingMeta = htmlPages.filter((p) => !p.metaDescription);
  if (missingMeta.length > 0) {
    issues.push({
      category: "seo",
      title: `${missingMeta.length} page${missingMeta.length > 1 ? "s" : ""} missing meta description`,
      detail: `Meta descriptions control your snippet in search results. Without them, Google auto-generates text that may not be compelling. Affected: ${truncateUrls(missingMeta.map((p) => p.url))}`,
      severity: "HIGH",
      fixable: true,
      url: missingMeta[0].url,
      evidence: `No <meta name="description"> found on ${missingMeta.length} page(s)`,
    });
  }

  // 4. Duplicate meta descriptions
  const metaMap = new Map<string, string[]>();
  for (const p of htmlPages) {
    if (p.metaDescription) {
      const existing = metaMap.get(p.metaDescription) || [];
      existing.push(p.url);
      metaMap.set(p.metaDescription, existing);
    }
  }
  const dupMeta = Array.from(metaMap.entries()).filter(([, urls]) => urls.length > 1);
  for (const [desc, urls] of dupMeta.slice(0, 3)) {
    issues.push({
      category: "seo",
      title: `Duplicate meta description across ${urls.length} pages`,
      detail: `Same meta description found on multiple pages. Each page needs a unique description for optimal CTR. Pages: ${truncateUrls(urls)}`,
      severity: "MEDIUM",
      fixable: true,
      url: urls[0],
      evidence: `Meta description "${desc.substring(0, 100)}..." shared by: ${urls.join(", ")}`,
    });
  }

  // 5. Missing H1
  const missingH1 = htmlPages.filter((p) => p.h1s.length === 0);
  if (missingH1.length > 0) {
    issues.push({
      category: "seo",
      title: `${missingH1.length} page${missingH1.length > 1 ? "s" : ""} missing H1 heading`,
      detail: `H1 tags are the main heading signal for search engines. Every page should have exactly one H1. Affected: ${truncateUrls(missingH1.map((p) => p.url))}`,
      severity: "HIGH",
      fixable: true,
      url: missingH1[0].url,
      evidence: `No <h1> tag found on ${missingH1.length} page(s)`,
    });
  }

  // 6. Multiple H1s
  const multiH1 = htmlPages.filter((p) => p.h1s.length > 1);
  for (const p of multiH1.slice(0, 5)) {
    issues.push({
      category: "seo",
      title: `Multiple H1 tags on ${new URL(p.url).pathname}`,
      detail: `Found ${p.h1s.length} H1 tags on this page. Best practice is to have exactly one H1 per page. H1s found: "${p.h1s.join('", "')}"`,
      severity: "MEDIUM",
      fixable: true,
      url: p.url,
      evidence: `Found ${p.h1s.length} H1 tags: ${p.h1s.map((h) => `"${h}"`).join(", ")}`,
    });
  }

  // 7. 4xx errors
  const errors4xx = crawlResult.pages.filter((p) => p.statusCode >= 400 && p.statusCode < 500);
  if (errors4xx.length > 0) {
    for (const p of errors4xx.slice(0, 10)) {
      issues.push({
        category: "seo",
        title: `HTTP ${p.statusCode} error: ${new URL(p.url).pathname}`,
        detail: `This page returns a ${p.statusCode} error. Broken pages hurt user experience and waste crawl budget. Fix the page or set up a proper redirect.`,
        severity: "CRITICAL",
        fixable: true,
        url: p.url,
        evidence: `HTTP response status: ${p.statusCode}`,
      });
    }
    if (errors4xx.length > 10) {
      issues.push({
        category: "seo",
        title: `${errors4xx.length} total 4xx errors found across site`,
        detail: `Found ${errors4xx.length} pages with 4xx errors. Most common: ${truncateUrls(errors4xx.map((p) => `${p.url} (${p.statusCode})`))}`,
        severity: "CRITICAL",
        fixable: true,
        url: errors4xx[0].url,
        evidence: `${errors4xx.length} pages with client errors`,
      });
    }
  }

  // 8. 5xx errors
  const errors5xx = crawlResult.pages.filter((p) => p.statusCode >= 500);
  if (errors5xx.length > 0) {
    for (const p of errors5xx.slice(0, 5)) {
      issues.push({
        category: "seo",
        title: `Server error (${p.statusCode}) on ${new URL(p.url).pathname}`,
        detail: `This page returns a server error. Server errors indicate infrastructure problems that need immediate attention.`,
        severity: "CRITICAL",
        fixable: true,
        url: p.url,
        evidence: `HTTP response status: ${p.statusCode}`,
      });
    }
  }

  // 9. Redirects
  const redirects = crawlResult.pages.filter(
    (p) => p.statusCode >= 300 && p.statusCode < 400
  );
  if (redirects.length > 0) {
    for (const p of redirects.slice(0, 5)) {
      issues.push({
        category: "seo",
        title: `Redirect (${p.statusCode}) on ${new URL(p.url).pathname}`,
        detail: `This page redirects to ${p.redirectTarget || "unknown"}. Internal links should point directly to the final URL to avoid redirect chains and preserve link equity.`,
        severity: "MEDIUM",
        fixable: true,
        url: p.url,
        evidence: `${p.statusCode} redirect → ${p.redirectTarget || "unknown destination"}`,
      });
    }
  }

  // 10. Thin content
  const utilityPaths = ["/contact", "/login", "/register", "/cart", "/checkout", "/search", "/404", "/privacy", "/terms"];
  const thinContent = htmlPages.filter((p) => {
    const path = new URL(p.url).pathname.toLowerCase();
    return p.wordCount < 300 && !utilityPaths.some((u) => path.includes(u));
  });
  if (thinContent.length > 0) {
    issues.push({
      category: "seo",
      title: `${thinContent.length} page${thinContent.length > 1 ? "s" : ""} with thin content (<300 words)`,
      detail: `Pages with very little content tend to rank poorly. Aim for 500+ words on important pages. Affected: ${truncateUrls(thinContent.map((p) => `${p.url} (${p.wordCount} words)`))}`,
      severity: "HIGH",
      fixable: true,
      url: thinContent[0].url,
      evidence: `${thinContent.length} pages with fewer than 300 words. Lowest: ${thinContent.sort((a, b) => a.wordCount - b.wordCount).slice(0, 3).map((p) => `${new URL(p.url).pathname} (${p.wordCount} words)`).join(", ")}`,
    });
  }

  // 11. Noindex on potentially important pages
  const noindexPages = htmlPages.filter((p) => p.noindex);
  const importantNoindex = noindexPages.filter((p) => {
    const path = new URL(p.url).pathname;
    return path === "/" || path.split("/").length <= 2;
  });
  if (importantNoindex.length > 0) {
    for (const p of importantNoindex.slice(0, 5)) {
      issues.push({
        category: "seo",
        title: `Noindex found on important page: ${new URL(p.url).pathname}`,
        detail: `This page has a noindex meta tag, which means it will NOT appear in search results. If this is unintentional, remove the noindex directive immediately.`,
        severity: "HIGH",
        fixable: true,
        url: p.url,
        evidence: `<meta name="robots" content="noindex"> detected`,
      });
    }
  }

  // 12. Canonical issues
  for (const p of htmlPages.slice(0, 50)) {
    if (p.canonical) {
      try {
        const canonicalParsed = new URL(p.canonical, p.url);
        const pageParsed = new URL(p.url);
        if (canonicalParsed.hostname !== pageParsed.hostname) {
          issues.push({
            category: "seo",
            title: `Canonical points to different domain: ${new URL(p.url).pathname}`,
            detail: `The canonical tag on this page points to a different domain (${canonicalParsed.hostname}). This tells search engines to ignore this page in favor of the other domain's version.`,
            severity: "MEDIUM",
            fixable: true,
            url: p.url,
            evidence: `Canonical: ${p.canonical} (different from page domain: ${pageParsed.hostname})`,
          });
        }
      } catch {
        // Invalid canonical URL
      }
    }
  }

  // 13. Missing sitemap.xml
  if (!crawlResult.sitemapFound) {
    issues.push({
      category: "seo",
      title: "No sitemap.xml found",
      detail: `No sitemap was found at ${businessUrl}/sitemap.xml or in robots.txt. A sitemap helps search engines discover and index all your pages efficiently. Create and submit a sitemap to Google Search Console.`,
      severity: "CRITICAL",
      fixable: true,
      url: businessUrl,
      evidence: "No sitemap.xml found at /sitemap.xml or /sitemap_index.xml, and no Sitemap directive in robots.txt",
    });
  }

  // 14. Missing robots.txt
  if (!crawlResult.stats.robotsTxtFound) {
    issues.push({
      category: "seo",
      title: "No robots.txt found",
      detail: `No robots.txt was found at ${businessUrl}/robots.txt. While not strictly required, robots.txt helps control how search engines crawl your site and can point to your sitemap.`,
      severity: "HIGH",
      fixable: true,
      url: businessUrl,
      evidence: "HTTP 404 or error when requesting /robots.txt",
    });
  }

  // 15. Images without alt text
  const totalImages = htmlPages.reduce((sum, p) => sum + p.imagesTotal, 0);
  const missingAlt = htmlPages.reduce((sum, p) => sum + p.imagesMissingAlt, 0);
  if (totalImages > 0 && missingAlt > 0) {
    const pct = Math.round((missingAlt / totalImages) * 100);
    issues.push({
      category: "seo",
      title: `${pct}% of images (${missingAlt}/${totalImages}) missing alt text`,
      detail: `Alt text is essential for accessibility and image SEO. ${missingAlt} out of ${totalImages} images across the site are missing descriptive alt attributes. Add meaningful alt text to all images.`,
      severity: pct > 50 ? "HIGH" : "MEDIUM",
      fixable: true,
      url: htmlPages.find((p) => p.imagesMissingAlt > 0)?.url || businessUrl,
      evidence: `${missingAlt} images without alt attribute out of ${totalImages} total (${pct}%)`,
    });
  }

  // 16. Slow pages (> 3 seconds)
  const slowPages = crawlResult.pages.filter((p) => p.responseTimeMs > 3000 && p.statusCode === 200);
  if (slowPages.length > 0) {
    issues.push({
      category: "seo",
      title: `${slowPages.length} page${slowPages.length > 1 ? "s" : ""} with slow response time (>3s)`,
      detail: `Slow pages hurt user experience and search rankings. Google recommends pages load in under 2.5 seconds. Affected: ${truncateUrls(slowPages.map((p) => `${new URL(p.url).pathname} (${(p.responseTimeMs / 1000).toFixed(1)}s)`))}`,
      severity: "MEDIUM",
      fixable: true,
      url: slowPages[0].url,
      evidence: `${slowPages.length} pages exceeding 3s response time. Slowest: ${(Math.max(...slowPages.map((p) => p.responseTimeMs)) / 1000).toFixed(1)}s`,
    });
  }

  // Trim to max findings
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

  return `SEO CRAWL DATA (automated scan of ${stats.pagesCrawled} pages):
- Pages with missing title tags: ${missingTitles}
- Pages with missing meta descriptions: ${missingMeta}
- Pages with missing H1: ${missingH1}
- 4xx errors found: ${errors4xx}
- 5xx errors found: ${errors5xx}
- Thin content pages (<300 words): ${thinContent}
- Sitemap.xml: ${stats.sitemapFound ? "found" : "NOT FOUND"}
- Robots.txt: ${stats.robotsTxtFound ? "found" : "NOT FOUND"}
- Average page response time: ${avgResponseTime}ms

NOTE: Detailed per-page technical SEO issues are documented separately by the crawler. Focus your SEO findings on content strategy, keyword optimization, and higher-level SEO recommendations rather than technical page-level issues.`;
}
