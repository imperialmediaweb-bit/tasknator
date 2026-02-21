/**
 * Lightweight SEO crawler — BFS-based, fetch-only, zero external deps.
 * Designed to crawl 50-200 pages of a site to detect technical SEO issues.
 */

export interface CrawlConfig {
  maxPages: number;
  concurrency: number;
  delayMs: number;
  timeoutMs: number;
  totalTimeoutMs: number;
}

export interface CrawledPage {
  url: string;
  statusCode: number;
  redirectTarget?: string;
  title?: string;
  metaDescription?: string;
  h1s: string[];
  canonical?: string;
  noindex: boolean;
  wordCount: number;
  internalLinks: string[];
  externalLinks: string[];
  imagesTotal: number;
  imagesMissingAlt: number;
  responseTimeMs: number;
}

export interface CrawlResult {
  pages: CrawledPage[];
  sitemapFound: boolean;
  sitemapUrls: string[];
  robotsTxt: string | null;
  robotsBlocked: string[];
  stats: {
    pagesCrawled: number;
    pagesErrored: number;
    durationMs: number;
    sitemapFound: boolean;
    robotsTxtFound: boolean;
  };
}

const DEFAULT_CONFIG: CrawlConfig = {
  maxPages: 200,
  concurrency: 5,
  delayMs: 300,
  timeoutMs: 8000,
  totalTimeoutMs: 300000, // 5 min for up to 200 pages
};

const USER_AGENT = "BusinessFix-Audit/1.0 (SEO Crawler)";

function normalizeUrl(url: string, base: string): string | null {
  try {
    const resolved = new URL(url, base);
    // Remove fragment and trailing slash for dedup
    resolved.hash = "";
    let path = resolved.pathname.replace(/\/+$/, "") || "/";
    return `${resolved.protocol}//${resolved.hostname}${path}${resolved.search}`;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT },
      redirect: "manual", // We handle redirects ourselves to detect chains
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

function parseHtmlPage(html: string, pageUrl: string, hostname: string): Partial<CrawledPage> {
  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : undefined;

  // Meta description
  const metaDescMatch =
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)/i) ||
    html.match(/<meta[^>]*content=["']([^"']*)[^>]*name=["']description["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : undefined;

  // H1 tags
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  const h1s: string[] = [];
  let h1Match;
  while ((h1Match = h1Regex.exec(html)) !== null) {
    h1s.push(h1Match[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
  }

  // Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : undefined;

  // Noindex
  const noindex = /<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);

  // Internal/external links
  const linkRegex = /href=["']([^"'#][^"']*)/gi;
  const internalLinks: string[] = [];
  const externalLinks: string[] = [];
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    // Skip non-http links
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    try {
      const resolved = new URL(href, pageUrl);
      if (resolved.hostname === hostname) {
        const norm = normalizeUrl(href, pageUrl);
        if (norm) internalLinks.push(norm);
      } else {
        externalLinks.push(resolved.href);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  // Word count
  const textContent = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;

  // Images
  const imgRegex = /<img[^>]*>/gi;
  let imagesTotal = 0;
  let imagesMissingAlt = 0;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    imagesTotal++;
    const hasAlt = /alt=["'][^"']+/i.test(imgMatch[0]);
    if (!hasAlt) imagesMissingAlt++;
  }

  return {
    title,
    metaDescription,
    h1s,
    canonical,
    noindex,
    wordCount,
    internalLinks: Array.from(new Set(internalLinks)),
    externalLinks: Array.from(new Set(externalLinks)),
    imagesTotal,
    imagesMissingAlt,
  };
}

function parseSitemapXml(xml: string, hostname: string): string[] {
  const urls: string[] = [];
  // Match <loc> tags
  const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
  let match;
  while ((match = locRegex.exec(xml)) !== null) {
    const url = match[1].trim();
    try {
      const parsed = new URL(url);
      if (parsed.hostname === hostname) {
        urls.push(url);
      }
    } catch {
      // Skip invalid URLs
    }
  }
  return urls;
}

function parseRobotsDisallow(robotsTxt: string): string[] {
  const blocked: string[] = [];
  const lines = robotsTxt.split("\n");
  let inRelevantBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.toLowerCase().startsWith("user-agent:")) {
      const agent = trimmed.slice("user-agent:".length).trim().toLowerCase();
      inRelevantBlock = agent === "*" || agent.includes("businessfix");
    }
    if (inRelevantBlock && trimmed.toLowerCase().startsWith("disallow:")) {
      const path = trimmed.slice("disallow:".length).trim();
      if (path) blocked.push(path);
    }
  }
  return blocked;
}

export async function crawlSite(
  rootUrl: string,
  config: Partial<CrawlConfig> = {}
): Promise<CrawlResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTime = Date.now();

  // Normalize root URL
  if (!rootUrl.startsWith("http")) rootUrl = "https://" + rootUrl;
  const rootParsed = new URL(rootUrl);
  const hostname = rootParsed.hostname;
  const origin = rootParsed.origin;

  const visited = new Set<string>();
  const queue: string[] = [];
  const pages: CrawledPage[] = [];
  let pagesErrored = 0;

  // Step 1: Fetch robots.txt
  let robotsTxt: string | null = null;
  let robotsBlocked: string[] = [];
  let robotsTxtFound = false;
  try {
    const res = await fetchWithTimeout(`${origin}/robots.txt`, cfg.timeoutMs);
    if (res.ok) {
      robotsTxt = await res.text();
      robotsBlocked = parseRobotsDisallow(robotsTxt);
      robotsTxtFound = true;
    }
  } catch {
    // robots.txt not available
  }

  // Step 2: Fetch sitemap.xml
  let sitemapUrls: string[] = [];
  let sitemapFound = false;

  // Check robots.txt for Sitemap directive
  const sitemapDirectives: string[] = [];
  if (robotsTxt) {
    const sitemapRegex = /^Sitemap:\s*(.+)$/gim;
    let sMatch;
    while ((sMatch = sitemapRegex.exec(robotsTxt)) !== null) {
      sitemapDirectives.push(sMatch[1].trim());
    }
  }

  const sitemapUrlsToTry = [
    ...sitemapDirectives,
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
  ];

  for (const sitemapUrl of Array.from(new Set(sitemapUrlsToTry))) {
    try {
      const res = await fetchWithTimeout(sitemapUrl, cfg.timeoutMs);
      if (res.ok) {
        const xml = await res.text();
        const urls = parseSitemapXml(xml, hostname);
        if (urls.length > 0) {
          sitemapFound = true;
          sitemapUrls = urls.slice(0, 500); // Cap at 500
          break;
        }
      }
    } catch {
      // Sitemap not available at this URL
    }
  }

  // Step 3: Seed the queue
  const rootNorm = normalizeUrl(rootUrl, rootUrl);
  if (rootNorm) {
    queue.push(rootNorm);
    visited.add(rootNorm);
  }

  for (const su of sitemapUrls) {
    const norm = normalizeUrl(su, rootUrl);
    if (norm && !visited.has(norm)) {
      queue.push(norm);
      visited.add(norm);
    }
  }

  // Step 4: BFS crawl loop
  while (queue.length > 0 && pages.length < cfg.maxPages) {
    // Check total timeout
    if (Date.now() - startTime > cfg.totalTimeoutMs) {
      console.log(`[crawler] Total timeout reached after ${pages.length} pages`);
      break;
    }

    // Take a batch
    const batch = queue.splice(0, cfg.concurrency);
    const results = await Promise.allSettled(
      batch.map(async (url) => {
        // Check if URL is blocked by robots.txt
        const urlPath = new URL(url).pathname;
        for (const blocked of robotsBlocked) {
          if (urlPath.startsWith(blocked)) {
            return null; // Skip blocked URLs
          }
        }

        const pageStart = Date.now();
        try {
          const res = await fetchWithTimeout(url, cfg.timeoutMs);
          const responseTimeMs = Date.now() - pageStart;

          // Handle redirects
          if (res.status >= 300 && res.status < 400) {
            const location = res.headers.get("location");
            const redirectTarget = location ? normalizeUrl(location, url) : undefined;

            // Add redirect target to queue
            if (redirectTarget && !visited.has(redirectTarget)) {
              visited.add(redirectTarget);
              queue.push(redirectTarget);
            }

            return {
              url,
              statusCode: res.status,
              redirectTarget: redirectTarget || undefined,
              h1s: [],
              noindex: false,
              wordCount: 0,
              internalLinks: [],
              externalLinks: [],
              imagesTotal: 0,
              imagesMissingAlt: 0,
              responseTimeMs,
            } as CrawledPage;
          }

          // Handle errors
          if (!res.ok) {
            return {
              url,
              statusCode: res.status,
              h1s: [],
              noindex: false,
              wordCount: 0,
              internalLinks: [],
              externalLinks: [],
              imagesTotal: 0,
              imagesMissingAlt: 0,
              responseTimeMs,
            } as CrawledPage;
          }

          // Only parse HTML pages
          const contentType = res.headers.get("content-type") || "";
          if (!contentType.includes("text/html")) {
            return null; // Skip non-HTML (PDFs, images, etc.)
          }

          const html = await res.text();
          const parsed = parseHtmlPage(html, url, hostname);

          // Add discovered internal links to queue
          for (const link of parsed.internalLinks || []) {
            if (!visited.has(link) && visited.size < cfg.maxPages * 3) {
              visited.add(link);
              queue.push(link);
            }
          }

          return {
            url,
            statusCode: res.status,
            ...parsed,
            h1s: parsed.h1s || [],
            noindex: parsed.noindex || false,
            wordCount: parsed.wordCount || 0,
            internalLinks: parsed.internalLinks || [],
            externalLinks: parsed.externalLinks || [],
            imagesTotal: parsed.imagesTotal || 0,
            imagesMissingAlt: parsed.imagesMissingAlt || 0,
            responseTimeMs,
          } as CrawledPage;
        } catch (err: any) {
          pagesErrored++;
          return {
            url,
            statusCode: 0,
            h1s: [],
            noindex: false,
            wordCount: 0,
            internalLinks: [],
            externalLinks: [],
            imagesTotal: 0,
            imagesMissingAlt: 0,
            responseTimeMs: Date.now() - pageStart,
          } as CrawledPage;
        }
      })
    );

    // Collect successful results
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) {
        pages.push(result.value);
      }
    }

    // Polite delay between batches
    if (queue.length > 0 && pages.length < cfg.maxPages) {
      await sleep(cfg.delayMs);
    }
  }

  const durationMs = Date.now() - startTime;
  console.log(`[crawler] Done: ${pages.length} pages in ${durationMs}ms (${pagesErrored} errors)`);

  return {
    pages,
    sitemapFound,
    sitemapUrls,
    robotsTxt,
    robotsBlocked,
    stats: {
      pagesCrawled: pages.length,
      pagesErrored,
      durationMs,
      sitemapFound,
      robotsTxtFound,
    },
  };
}
