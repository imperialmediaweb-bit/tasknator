import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { FileText, Palette, Sparkles } from "lucide-react";

export default async function AssetsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: {
      workspace: {
        include: {
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

  const allAssets = membership.workspace.businessProfiles.flatMap((biz) =>
    biz.repairPlans.flatMap((plan) =>
      plan.assets.map((asset) => ({
        ...asset,
        businessName: biz.name,
        businessId: biz.id,
        planTitle: plan.title,
      }))
    )
  ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assets</h1>
        <p className="text-slate-500 text-sm mt-1">AI-generated content: ads, emails, scripts, website copy, and more</p>
      </div>

      {allAssets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
          <Palette className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-700 mb-1">No assets yet</h3>
          <p className="text-sm text-slate-400 mb-4">Assets are generated from your repair plans. Run an audit and generate a plan first.</p>
          <Link href="/audits" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Sparkles className="w-4 h-4" /> View Audits
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAssets.map((asset) => (
            <Link
              key={asset.id}
              href={`/assets/${asset.id}`}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{asset.type.replace(/_/g, " ")}</span>
              </div>
              <h3 className="font-medium text-slate-900 text-sm">{asset.title}</h3>
              <p className="text-xs text-slate-400 mt-1">{asset.businessName}</p>
              <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                <span>{asset.versions.length} version{asset.versions.length !== 1 ? "s" : ""}</span>
                <span>{new Date(asset.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
