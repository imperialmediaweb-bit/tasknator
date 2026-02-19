import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { ArrowRight, BarChart3, Building2, Calendar, Download, ExternalLink, FileText, Globe, MapPin, RefreshCw, Target, TrendingUp, Zap } from "lucide-react";
import { FindingFixButton } from "./finding-fix-button";
import { StartAuditButton } from "./start-audit-button";
import { GeneratePlanCard } from "./generate-plan-button";

export default async function BusinessDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const business = await db.businessProfile.findUnique({
    where: { id: params.id },
    include: {
      auditRuns: { orderBy: { createdAt: "desc" }, take: 5, include: { findings: true } },
      repairPlans: { orderBy: { createdAt: "desc" }, take: 5, include: { tasks: true, assets: true } },
    },
  });

  if (!business) notFound();

  const latestAudit = business.auditRuns[0];
  const latestPlan = business.repairPlans[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-violet-100 flex items-center justify-center text-blue-700 font-bold text-xl">
            {business.name[0]}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {business.industry}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {business.city ? `${business.city}, ` : ""}{business.country}</span>
              {business.websiteUrl && (
                <a href={business.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                  <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <StartAuditButton businessId={business.id} hasAudit={!!latestAudit} />
      </div>

      {/* Score Cards */}
      {latestAudit && latestAudit.status === "COMPLETED" && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Overall", score: latestAudit.overallScore, main: true },
            { label: "Website", score: latestAudit.websiteScore },
            { label: "SEO", score: latestAudit.seoScore },
            { label: "Social", score: latestAudit.socialScore },
            { label: "Offer", score: latestAudit.offerScore },
            { label: "Reputation", score: latestAudit.reputationScore },
            { label: "Local", score: latestAudit.localScore },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl p-4 border ${item.main ? "bg-gradient-to-br from-blue-600 to-violet-600 text-white border-transparent col-span-2 md:col-span-1" : "bg-white border-gray-100"}`}>
              <p className={`text-xs font-medium mb-1 ${item.main ? "text-blue-100" : "text-gray-400"}`}>{item.label}</p>
              <p className={`text-2xl font-bold ${
                item.main ? "text-white" :
                (item.score ?? 0) >= 70 ? "text-green-600" :
                (item.score ?? 0) >= 40 ? "text-yellow-600" :
                "text-red-600"
              }`}>
                {item.score ?? "—"}<span className={`text-sm font-normal ${item.main ? "text-blue-200" : "text-gray-400"}`}>/100</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Root Cause */}
      {latestAudit?.rootCauseSummary && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-orange-900 mb-1">Root Cause Analysis</h3>
              <p className="text-sm text-orange-800">{latestAudit.rootCauseSummary}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Findings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Audit Findings</h2>
            <div className="flex items-center gap-3">
              {latestAudit && (
                <span className="text-sm text-gray-400">
                  {latestAudit.findings.length} issues found
                  {(latestAudit as any).crawlStats?.pagesCrawled && (
                    <span className="ml-2 text-indigo-500">· {(latestAudit as any).crawlStats.pagesCrawled} pages crawled</span>
                  )}
                </span>
              )}
              {latestAudit?.status === "COMPLETED" && (
                <>
                  <Link href={`/business/${business.id}/audit/${latestAudit.id}`} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100 transition-colors">
                    Full Report
                  </Link>
                  <a href={`/api/audit/${latestAudit.id}/report`} className="text-xs px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 font-medium hover:bg-violet-100 transition-colors flex items-center gap-1">
                    <Download className="w-3 h-3" /> PDF
                  </a>
                </>
              )}
            </div>
          </div>
          {!latestAudit ? (
            <div className="p-12 text-center">
              <Target className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500">Run an audit to see findings</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {latestAudit.findings.map((finding) => (
                <div key={finding.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          finding.severity === "CRITICAL" ? "bg-red-500" :
                          finding.severity === "HIGH" ? "bg-orange-500" :
                          finding.severity === "MEDIUM" ? "bg-yellow-500" :
                          "bg-blue-500"
                        }`} />
                        <span className="text-xs font-medium text-gray-400 uppercase">{finding.category}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          finding.severity === "CRITICAL" ? "bg-red-50 text-red-700" :
                          finding.severity === "HIGH" ? "bg-orange-50 text-orange-700" :
                          finding.severity === "MEDIUM" ? "bg-yellow-50 text-yellow-700" :
                          "bg-blue-50 text-blue-700"
                        }`}>
                          {finding.severity}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm">{finding.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{finding.detail}</p>
                      {(finding as any).url && (
                        <a href={(finding as any).url} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] text-blue-600 hover:underline mt-1 inline-flex items-center gap-0.5">
                          <ExternalLink className="w-2.5 h-2.5" /> {(finding as any).url}
                        </a>
                      )}
                    </div>
                    {finding.fixable && !finding.fixed && (
                      <FindingFixButton findingId={finding.id} />
                    )}
                    {finding.fixed && (
                      <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium flex-shrink-0">
                        Fixed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Panel */}
        <div className="space-y-4">
          {/* Generate Plan */}
          {latestAudit?.status === "COMPLETED" && (
            <GeneratePlanCard auditRunId={latestAudit.id} hasPlan={!!latestPlan} planId={latestPlan?.id} businessId={business.id} />
          )}

          {/* Plan Tasks Progress */}
          {latestPlan && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Repair Plan</h3>
              <div className="space-y-3">
                {["DAY_30", "DAY_60", "DAY_90"].map((phase) => {
                  const tasks = latestPlan.tasks.filter(t => t.phase === phase);
                  const completed = tasks.filter(t => t.completed).length;
                  return (
                    <div key={phase}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{phase.replace("_", " ")}</span>
                        <span className="text-gray-400">{completed}/{tasks.length}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${tasks.length > 0 ? (completed / tasks.length) * 100 : 0}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href={`/business/${business.id}/plan/${latestPlan.id}`} className="flex items-center gap-1 text-sm text-blue-600 font-medium mt-3 hover:underline">
                View full plan <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Export */}
          {latestPlan && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-2">Export</h3>
              <p className="text-xs text-gray-500 mb-3">Download your recovery plan and assets.</p>
              <a href={`/api/export/${latestPlan.id}?format=zip`} className="block w-full text-center py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Download ZIP
              </a>
            </div>
          )}

          {/* Business Info Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Quick Info</h3>
            <dl className="space-y-2 text-sm">
              {business.primaryGoal && <div className="flex justify-between"><dt className="text-gray-500">Goal</dt><dd className="text-gray-900 font-medium">{business.primaryGoal.replace(/_/g, " ")}</dd></div>}
              {business.mainPain && <div className="flex justify-between"><dt className="text-gray-500">Pain</dt><dd className="text-gray-900 font-medium">{business.mainPain.replace(/_/g, " ")}</dd></div>}
              {business.revenueRange && <div className="flex justify-between"><dt className="text-gray-500">Revenue</dt><dd className="text-gray-900 font-medium">{business.revenueRange}</dd></div>}
              {business.teamSize && <div className="flex justify-between"><dt className="text-gray-500">Team</dt><dd className="text-gray-900 font-medium">{business.teamSize} people</dd></div>}
            </dl>
          </div>
        </div>
      </div>

      {/* Audit History */}
      {business.auditRuns.length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h2 className="text-lg font-semibold">Audit History</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {business.auditRuns.map((audit) => (
              <div key={audit.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                    audit.status === "COMPLETED" ? "bg-green-50 text-green-700" :
                    audit.status === "RUNNING" ? "bg-blue-50 text-blue-700" :
                    audit.status === "FAILED" ? "bg-red-50 text-red-700" :
                    "bg-gray-50 text-gray-700"
                  }`}>
                    {audit.overallScore || "—"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{audit.status}</p>
                    <p className="text-xs text-gray-400">{new Date(audit.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <Link href={`/business/${business.id}/audit/${audit.id}`} className="text-sm text-blue-600 hover:underline">
                  View
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

