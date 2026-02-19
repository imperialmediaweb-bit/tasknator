import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowLeft, Calendar, Download, ExternalLink, Globe, Target, TrendingUp } from "lucide-react";

export default async function AuditReportPage({ params }: { params: { id: string; auditId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const auditRun = await db.auditRun.findUnique({
    where: { id: params.auditId },
    include: {
      findings: true,
      businessProfile: true,
    },
  });

  if (!auditRun) notFound();

  const biz = auditRun.businessProfile;
  const scores = [
    { label: "Website", score: auditRun.websiteScore, icon: "globe" },
    { label: "SEO", score: auditRun.seoScore, icon: "search" },
    { label: "Social", score: auditRun.socialScore, icon: "share" },
    { label: "Offer", score: auditRun.offerScore, icon: "tag" },
    { label: "Reputation", score: auditRun.reputationScore, icon: "star" },
    { label: "Local", score: auditRun.localScore, icon: "map" },
  ];

  const severityOrder = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];
  const sortedFindings = [...auditRun.findings].sort(
    (a, b) => severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity)
  );

  const criticalCount = auditRun.findings.filter(f => f.severity === "CRITICAL").length;
  const highCount = auditRun.findings.filter(f => f.severity === "HIGH").length;
  const mediumCount = auditRun.findings.filter(f => f.severity === "MEDIUM").length;
  const lowCount = auditRun.findings.filter(f => f.severity === "LOW" || f.severity === "INFO").length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <Link href={`/business/${biz.id}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to {biz.name}
        </Link>
        {auditRun.status === "COMPLETED" && (
          <a
            href={`/api/audit/${auditRun.id}/report`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Download className="w-4 h-4" /> Download PDF Report
          </a>
        )}
      </div>

      {/* Report Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute right-8 top-1/2 -translate-y-1/2">
          <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${
                (auditRun.overallScore ?? 0) >= 70 ? "text-green-600" :
                (auditRun.overallScore ?? 0) >= 40 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {auditRun.overallScore ?? "—"}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">/100</span>
            </div>
          </div>
        </div>
        <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider mb-1">Diagnostic Report</p>
        <h1 className="text-2xl font-bold pr-36">{biz.name}</h1>
        <div className="flex items-center gap-4 text-indigo-200 text-sm mt-2">
          <span>{biz.industry}</span>
          {biz.city && <span>{biz.city}, {biz.country}</span>}
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date(auditRun.createdAt).toLocaleDateString()}</span>
        </div>
        <div className="flex gap-4 mt-4 text-xs">
          <span className="px-2 py-1 rounded-lg bg-red-500/20 text-red-100">{criticalCount} Critical</span>
          <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-100">{highCount} High</span>
          <span className="px-2 py-1 rounded-lg bg-yellow-500/20 text-yellow-100">{mediumCount} Medium</span>
          <span className="px-2 py-1 rounded-lg bg-blue-500/20 text-blue-100">{lowCount} Low</span>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" /> Score Breakdown
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {scores.map((s) => {
            const score = s.score ?? 0;
            const color = score >= 70 ? "green" : score >= 40 ? "yellow" : "red";
            return (
              <div key={s.label} className="text-center">
                <div className="relative inline-flex items-center justify-center w-16 h-16 mb-2">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="28" fill="none" stroke="#f3f4f6" strokeWidth="6" />
                    <circle
                      cx="32" cy="32" r="28" fill="none"
                      stroke={color === "green" ? "#22c55e" : color === "yellow" ? "#f59e0b" : "#ef4444"}
                      strokeWidth="6"
                      strokeDasharray={`${(score / 100) * 175.93} 175.93`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className={`absolute text-sm font-bold ${
                    color === "green" ? "text-green-600" : color === "yellow" ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {score}
                  </span>
                </div>
                <p className="text-xs font-medium text-gray-500">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* SEO Crawl Summary */}
      {auditRun.crawlStats && (() => {
        const cs = auditRun.crawlStats as any;
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" /> SEO Crawl Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{cs.pagesCrawled ?? 0}</p>
                <p className="text-xs text-gray-500">Pages Crawled</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{cs.pagesErrored ?? 0}</p>
                <p className="text-xs text-gray-500">Errors Found</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{((cs.durationMs ?? 0) / 1000).toFixed(1)}s</p>
                <p className="text-xs text-gray-500">Crawl Duration</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${cs.sitemapFound ? "text-green-600" : "text-red-600"}`}>
                  {cs.sitemapFound ? "Yes" : "No"}
                </p>
                <p className="text-xs text-gray-500">Sitemap Found</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${cs.robotsTxtFound ? "text-green-600" : "text-red-600"}`}>
                  {cs.robotsTxtFound ? "Yes" : "No"}
                </p>
                <p className="text-xs text-gray-500">Robots.txt</p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Root Cause */}
      {auditRun.rootCauseSummary && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-2">Root Cause Analysis</h3>
              <p className="text-sm text-orange-800 leading-relaxed">{auditRun.rootCauseSummary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Findings */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-6 border-b border-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">Findings ({auditRun.findings.length})</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {sortedFindings.map((finding) => (
            <div key={finding.id} className="p-5 hover:bg-gray-50/50 transition-colors">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  finding.severity === "CRITICAL" ? "bg-red-100 text-red-700" :
                  finding.severity === "HIGH" ? "bg-orange-100 text-orange-700" :
                  finding.severity === "MEDIUM" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {finding.severity}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{finding.title}</h4>
                    <span className="text-[10px] font-medium text-gray-400 uppercase bg-gray-50 px-2 py-0.5 rounded">{finding.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{finding.detail}</p>
                  {finding.url && (
                    <a href={finding.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-1.5 inline-flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> {finding.url}
                    </a>
                  )}
                  {finding.evidence && (
                    <details className="mt-1.5">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Show evidence</summary>
                      <pre className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2 overflow-x-auto whitespace-pre-wrap">{finding.evidence}</pre>
                    </details>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    {finding.fixable && (
                      <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Fixable</span>
                    )}
                    {finding.fixed && (
                      <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">Fixed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status info for non-completed audits */}
      {auditRun.status !== "COMPLETED" && (
        <div className={`rounded-2xl p-6 text-center ${
          auditRun.status === "RUNNING" ? "bg-blue-50 border border-blue-100" :
          auditRun.status === "FAILED" ? "bg-red-50 border border-red-100" :
          "bg-gray-50 border border-gray-100"
        }`}>
          <p className={`text-lg font-semibold ${
            auditRun.status === "RUNNING" ? "text-blue-700" :
            auditRun.status === "FAILED" ? "text-red-700" :
            "text-gray-700"
          }`}>
            Audit {auditRun.status === "RUNNING" ? "in progress..." : auditRun.status === "FAILED" ? "failed" : "queued"}
          </p>
          {auditRun.progress > 0 && (
            <div className="w-48 h-2 bg-blue-100 rounded-full mx-auto mt-3 overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${auditRun.progress}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
