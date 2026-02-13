import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { PLAN_CONFIGS } from "@/lib/billing/plans";
import { CheckCircle2, CreditCard, FileText, Crown } from "lucide-react";

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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your subscription and view invoices</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-semibold">Current Plan: {currentPlan.name}</h2>
            </div>
            <p className="text-sm text-gray-500">{currentPlan.description}</p>
            {subscription?.currentPeriodEnd && (
              <p className="text-xs text-gray-400 mt-2">
                {subscription.cancelAtPeriodEnd ? "Cancels" : "Renews"} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">${currentPlan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
            <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
              subscription?.status === "active" ? "bg-green-50 text-green-700" :
              subscription?.status === "past_due" ? "bg-red-50 text-red-700" :
              "bg-gray-50 text-gray-700"
            }`}>
              {subscription?.status || "active"}
            </span>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {PLAN_CONFIGS.map((plan) => {
          const isCurrent = plan.tier === workspace.plan;
          return (
            <div key={plan.tier} className={`rounded-2xl p-6 border-2 transition-all ${
              isCurrent ? "border-blue-500 bg-blue-50/30" :
              plan.popular ? "border-violet-200 bg-white" :
              "border-gray-100 bg-white"
            }`}>
              {plan.popular && !isCurrent && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium mb-2">Most Popular</span>
              )}
              {isCurrent && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium mb-2">Current Plan</span>
              )}
              <h3 className="font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold mt-1">${plan.price}<span className="text-sm font-normal text-gray-500">/mo</span></p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              {!isCurrent && (
                <UpgradeButton planTier={plan.tier} workspaceId={workspace.id} />
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gray-400" />
            Payment Methods
          </h2>
          <ManagePaymentButton />
        </div>
        <p className="text-sm text-gray-500">Manage your payment methods through the Stripe customer portal.</p>
        <div className="mt-3 flex gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600 flex items-center gap-1">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 10h20" stroke="currentColor" strokeWidth="2"/></svg>
            Stripe
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-gray-50 text-xs font-medium text-gray-600">PayPal (coming soon)</div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            Invoices
          </h2>
        </div>
        {workspace.invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No invoices yet</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {workspace.invoices.map((inv) => (
              <div key={inv.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">${(inv.amount / 100).toFixed(2)} {inv.currency.toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    inv.status === "paid" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-700"
                  }`}>{inv.status}</span>
                  {inv.pdfUrl && (
                    <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">PDF</a>
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

function UpgradeButton({ planTier, workspaceId }: { planTier: string; workspaceId: string }) {
  return (
    <form action="/api/billing/checkout" method="POST">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="planTier" value={planTier} />
      <button type="submit" className="w-full mt-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
        Upgrade to {planTier}
      </button>
    </form>
  );
}

function ManagePaymentButton() {
  return (
    <form action="/api/billing/portal" method="POST">
      <button type="submit" className="text-sm text-blue-600 font-medium hover:underline">
        Manage
      </button>
    </form>
  );
}
