import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PLAN_CONFIGS } from "@/lib/billing/plans";
import { CheckCircle2, CreditCard, FileText, Crown } from "lucide-react";
import { BillingActions } from "./billing-actions";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await db.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: user.id },
    include: { workspace: { include: { subscription: true, invoices: { orderBy: { createdAt: "desc" }, take: 10 } } } },
  });

  if (!membership) redirect("/onboarding");

  const workspace = membership.workspace;
  const subscription = workspace.subscription;
  const currentPlan = PLAN_CONFIGS.find(p => p.tier === workspace.plan) || PLAN_CONFIGS[0];

  // Check if PayPal is configured
  const paypalConfig = await db.systemConfig.findUnique({ where: { key: "PAYPAL_CLIENT_ID" } }).catch(() => null);
  const paypalEnabled = !!(paypalConfig?.value || process.env.PAYPAL_CLIENT_ID);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing & Plans</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your subscription and view invoices</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-slate-900">Current Plan: {currentPlan.name}</h2>
            </div>
            <p className="text-sm text-slate-500">{currentPlan.description}</p>
            {subscription?.currentPeriodEnd && (
              <p className="text-xs text-slate-400 mt-2">
                {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-900">${currentPlan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              subscription?.status === "active" ? "bg-emerald-50 text-emerald-700" :
              subscription?.status === "past_due" ? "bg-rose-50 text-rose-700" :
              "bg-slate-50 text-slate-700"
            }`}>
              {subscription?.status || "active"}
            </span>
            {subscription?.paypalSubId && (
              <p className="text-[10px] text-slate-400 mt-1">via PayPal</p>
            )}
            {subscription?.stripeSubId && (
              <p className="text-[10px] text-slate-400 mt-1">via Stripe</p>
            )}
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLAN_CONFIGS.map((plan) => {
          const isCurrent = plan.tier === workspace.plan;
          return (
            <div key={plan.tier} className={`rounded-2xl p-6 border-2 transition-all ${
              isCurrent ? "border-indigo-500 bg-indigo-50/30" :
              plan.popular ? "border-purple-200 bg-white" :
              "border-slate-100 bg-white"
            }`}>
              {plan.popular && !isCurrent && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium mb-2">Most Popular</span>
              )}
              {isCurrent && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium mb-2">Current Plan</span>
              )}
              <h3 className="font-semibold text-slate-900">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1 text-slate-900">${plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && (
                <BillingActions planTier={plan.tier} workspaceId={workspace.id} paypalEnabled={paypalEnabled} />
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
            <CreditCard className="w-5 h-5 text-slate-400" />
            Payment Methods
          </h2>
          <form action="/api/billing/portal" method="POST">
            <button type="submit" className="text-sm text-indigo-600 font-medium hover:underline">
              Manage
            </button>
          </form>
        </div>
        <p className="text-sm text-slate-500">Manage your payment methods through the customer portal.</p>
        <div className="mt-3 flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-slate-50 text-xs font-medium text-slate-600 flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 10h20" stroke="currentColor" strokeWidth="2"/></svg>
            Stripe
          </div>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 ${paypalEnabled ? "bg-blue-50 text-blue-700" : "bg-slate-50 text-slate-400"}`}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944 3.72a.77.77 0 01.757-.659h6.515c2.168 0 3.696.467 4.54 1.388.393.43.648.903.764 1.406.122.53.124 1.165.006 1.943l-.013.083v.73l.572.324c.484.268.87.582 1.151.942.352.449.579.997.674 1.628.098.654.063 1.414-.103 2.26a7.286 7.286 0 01-.84 2.2 4.97 4.97 0 01-1.345 1.457 5.489 5.489 0 01-1.811.872c-.69.197-1.478.297-2.348.297H12.84a.95.95 0 00-.938.805l-.039.2-.66 4.179-.03.144a.95.95 0 01-.938.805H7.076z"/>
            </svg>
            PayPal{!paypalEnabled && " (not configured)"}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-50">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-slate-400" />
            Invoices
          </h2>
        </div>
        {workspace.invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-400">No invoices yet</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {workspace.invoices.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">${(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}</p>
                  <p className="text-xs text-slate-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-700"
                  }`}>{inv.status}</span>
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">PDF</a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
