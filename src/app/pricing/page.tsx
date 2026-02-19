import Link from "next/link";
import { Check, Zap, Crown, Building2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 9,
    tier: "STARTER",
    description: "Perfect for solo businesses getting started with AI diagnostics",
    icon: Zap,
    color: "slate",
    features: [
      "1 business profile",
      "1 audit per month",
      "Website Fixer module",
      "Sales Doctor module",
      "Limited exports",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: 29,
    tier: "PRO",
    description: "For growing businesses that need the full diagnostic toolkit",
    icon: Crown,
    color: "indigo",
    popular: true,
    features: [
      "3 business profiles",
      "10 audits per month",
      "All modules (except Cost Cutter)",
      "Full PDF & ZIP exports",
      "Version history",
      "Priority support",
    ],
  },
  {
    name: "Agency",
    price: 79,
    tier: "AGENCY",
    description: "For agencies managing multiple client businesses",
    icon: Building2,
    color: "purple",
    features: [
      "25 business profiles",
      "100 audits per month",
      "All modules including Cost Cutter",
      "PDF & ZIP exports with your branding",
      "White-label: your logo, name & domain",
      "Team members (up to 25)",
      "Dedicated support",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            BusinessFix AI
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link href="/register" className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Choose the plan that fits your business. All plans include AI-powered audits, repair plans, and asset generation.
        </p>
      </div>

      {/* Plans */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`relative rounded-2xl border ${
                plan.popular
                  ? "border-indigo-200 shadow-xl shadow-indigo-500/10 scale-105"
                  : "border-slate-200 shadow-sm"
              } bg-white p-8 flex flex-col`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  plan.color === "purple" ? "bg-purple-50" :
                  plan.color === "indigo" ? "bg-indigo-50" :
                  "bg-slate-50"
                }`}>
                  <plan.icon className={`w-6 h-6 ${
                    plan.color === "purple" ? "text-purple-600" :
                    plan.color === "indigo" ? "text-indigo-600" :
                    "text-slate-600"
                  }`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      plan.color === "purple" ? "text-purple-500" :
                      plan.color === "indigo" ? "text-indigo-500" :
                      "text-emerald-500"
                    }`} />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={`block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl"
                    : "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-6">
            {[
              { q: "Can I upgrade or downgrade at any time?", a: "Yes, you can change your plan at any time. Changes take effect immediately, and your billing will be prorated." },
              { q: "What happens when I reach my audit limit?", a: "You'll see a notification when you're close to your monthly limit. You can upgrade your plan to get more audits, or wait until the next billing cycle." },
              { q: "Is there a free trial?", a: "Every new account starts with the Starter plan features. You can explore the platform and run your first audit to see the value before committing." },
              { q: "What does white-label mean?", a: "On the Agency plan, you can replace our branding with your own logo, company name, and custom domain. Your clients will see your brand on all reports and exports." },
              { q: "Can I cancel anytime?", a: "Absolutely. There are no long-term contracts. Cancel anytime and you'll retain access through the end of your billing period." },
            ].map((faq) => (
              <div key={faq.q} className="bg-white rounded-xl border border-slate-100 p-6">
                <h3 className="font-semibold text-slate-900 mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <div className="max-w-7xl mx-auto px-6">
          <Link href="/" className="text-slate-500 hover:text-slate-700 font-medium">BusinessFix AI</Link>
          <span className="mx-2">·</span>
          <Link href="/login" className="hover:text-slate-600">Sign in</Link>
          <span className="mx-2">·</span>
          <Link href="/register" className="hover:text-slate-600">Register</Link>
        </div>
      </footer>
    </div>
  );
}
