import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, DollarSign, Phone, Sparkles, Lock, ArrowRight } from "lucide-react";
import { canAccessModule } from "@/lib/billing/plans";
import { PlanTier } from "@prisma/client";

const SALES_DOCTOR_TYPES = ["OFFER_PACKAGES", "SALES_SCRIPTS"];

export default async function SalesDoctorPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
          subscription: true,
          businessProfiles: {
            include: {
              repairPlans: {
                include: {
                  assets: { include: { versions: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) redirect("/onboarding");

  const plan = membership.workspace.plan as PlanTier;
  const hasAccess = canAccessModule(plan, "SALES_DOCTOR");

  const allAssets = membership.workspace.businessProfiles.flatMap((biz) =>
    biz.repairPlans.flatMap((rp) =>
      rp.assets
        .filter((a) => SALES_DOCTOR_TYPES.includes(a.type))
        .map((asset) => ({
          ...asset,
          businessName: biz.name,
          businessId: biz.id,
          planTitle: rp.title,
        }))
    )
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const offerPackages = allAssets.filter((a) => a.type === "OFFER_PACKAGES");
  const salesScripts = allAssets.filter((a) => a.type === "SALES_SCRIPTS");

  if (!hasAccess) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Sales Doctor</h1>
        <p className="text-slate-500 mb-6">Sales Doctor is available on the Starter plan and above. Upgrade to access offer packages and sales scripts.</p>
        <Link
          href="/billing"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Upgrade Plan <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sales Doctor</h1>
        <p className="text-slate-500 text-sm mt-1">
          Redesign your offers with tiered pricing packages and proven sales scripts
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
          <DollarSign className="w-8 h-8 mb-3 text-emerald-200" />
          <h3 className="font-semibold text-lg">Offer Packages</h3>
          <p className="text-sm text-emerald-100 mt-1 mb-3">
            3-tier pricing (Basic / Standard / Premium) with features, ideal customer profiles, and upsell suggestions
          </p>
          <span className="text-2xl font-bold">{offerPackages.length}</span>
          <span className="text-emerald-200 text-sm ml-1">generated</span>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
          <Phone className="w-8 h-8 mb-3 text-blue-200" />
          <h3 className="font-semibold text-lg">Sales Scripts</h3>
          <p className="text-sm text-blue-100 mt-1 mb-3">
            Phone call scripts, WhatsApp sequences, and objection handling responses
          </p>
          <span className="text-2xl font-bold">{salesScripts.length}</span>
          <span className="text-blue-200 text-sm ml-1">generated</span>
        </div>
      </div>

      {/* Offer Packages Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-600" />
          Offer Packages
        </h2>
        {offerPackages.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-3">No offer packages yet. Run an audit with &quot;offer&quot; findings to auto-generate packages.</p>
            <Link href="/audits" className="text-sm text-indigo-600 font-medium hover:underline">
              Go to Audits
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offerPackages.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Offer Packages</span>
                </div>
                <h3 className="font-medium text-slate-900 text-sm">{asset.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{asset.businessName}</p>
                {asset.kpi && (
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded mt-2 inline-block">
                    KPI: {asset.kpi}
                  </span>
                )}
                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span>{asset.versions.length} version{asset.versions.length !== 1 ? "s" : ""}</span>
                  <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sales Scripts Section */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Phone className="w-5 h-5 text-blue-600" />
          Sales Scripts
        </h2>
        {salesScripts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
            <Phone className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500 mb-3">No sales scripts yet. Run an audit with &quot;offer&quot; findings to auto-generate scripts.</p>
            <Link href="/audits" className="text-sm text-indigo-600 font-medium hover:underline">
              Go to Audits
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {salesScripts.map((asset) => (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sales Script</span>
                </div>
                <h3 className="font-medium text-slate-900 text-sm">{asset.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{asset.businessName}</p>
                {asset.kpi && (
                  <span className="text-[10px] font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded mt-2 inline-block">
                    KPI: {asset.kpi}
                  </span>
                )}
                <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                  <span>{asset.versions.length} version{asset.versions.length !== 1 ? "s" : ""}</span>
                  <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">How Sales Doctor works</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <p className="text-sm font-medium text-slate-900">Run an Audit</p>
              <p className="text-xs text-slate-500 mt-0.5">AI analyzes your offers, pricing, and sales process</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <p className="text-sm font-medium text-slate-900">Generate Plan</p>
              <p className="text-xs text-slate-500 mt-0.5">Offer packages and sales scripts are auto-created from findings</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <p className="text-sm font-medium text-slate-900">Edit &amp; Deploy</p>
              <p className="text-xs text-slate-500 mt-0.5">Customize the generated content, then use it directly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
