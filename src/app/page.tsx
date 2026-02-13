import Link from "next/link";
import { ArrowRight, Zap, Shield, BarChart3, Target, Star, CheckCircle2, TrendingUp, FileText, Globe, Sparkles, ChevronRight, Play, ChevronDown, Mail } from "lucide-react";
import { getSiteBranding } from "@/lib/branding";

const FEATURES = [
  {
    icon: "Target",
    title: "AI Business Audit",
    description: "Deep diagnostic scan of your website, SEO, social presence, offers, and reputation. Get a clear scorecard.",
  },
  {
    icon: "FileText",
    title: "30/60/90 Day Repair Plan",
    description: "Actionable recovery roadmap prioritized by impact. Know exactly what to fix first.",
  },
  {
    icon: "Sparkles",
    title: "Ready-to-Use Assets",
    description: "Landing copy, ad scripts, email sequences, review replies — generated and editable instantly.",
  },
  {
    icon: "BarChart3",
    title: "Sales Doctor",
    description: "Redesign your offers with Basic/Standard/Premium packages and proven sales scripts.",
  },
  {
    icon: "Star",
    title: "Reputation Fixer",
    description: "Analyze reviews, generate professional replies, and create review-request campaigns.",
  },
  {
    icon: "TrendingUp",
    title: "Ads & SEO Repair",
    description: "Meta ads, Google ads, keyword lists, 30 article ideas — all tailored to your business.",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$9",
    period: "/month",
    description: "For solo businesses",
    features: ["1 business profile", "1 audit/month", "Website Fixer", "Sales Doctor", "Limited exports"],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For growing businesses",
    features: ["3 business profiles", "10 audits/month", "All modules", "Full PDF & ZIP exports", "Version history", "Priority support"],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Agency",
    price: "$79",
    period: "/month",
    description: "For agencies & teams",
    features: ["25 business profiles", "100 audits/month", "All modules + Cost Cutter", "White-label exports", "Team members (25)", "Dedicated support"],
    cta: "Start Free Trial",
    popular: false,
  },
];

const STEPS = [
  { step: "01", title: "Add Your Business", description: "Enter your business details, paste website content, or upload screenshots." },
  { step: "02", title: "Run AI Diagnosis", description: "Our AI analyzes your website, SEO, offers, social presence, and reputation." },
  { step: "03", title: "Get Recovery Plan", description: "Receive a prioritized 30/60/90-day plan with ready-to-use assets." },
  { step: "04", title: "Fix & Grow", description: "Implement fixes with generated copy, ads, emails, and scripts." },
];

const STATS = [
  { value: "10K+", label: "Businesses Analyzed" },
  { value: "94%", label: "Report Accuracy" },
  { value: "2.4x", label: "Avg Revenue Lift" },
  { value: "<3min", label: "Time to First Audit" },
];

const TESTIMONIALS = [
  {
    name: "Sarah Chen",
    role: "Owner, Bloom Studio",
    quote: "Tasknator found 14 critical issues I had no idea about. After fixing them, my online orders went up 180% in just 6 weeks. It paid for itself on day one.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "CEO, TechFix Pro",
    quote: "We were spending $3K/month on a marketing agency that couldn't tell us what was actually wrong. Tasknator diagnosed everything in 3 minutes for $29/month.",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    role: "Founder, Casa Bella Interiors",
    quote: "The 30/60/90 day plan was a game changer. Instead of feeling overwhelmed, I knew exactly what to fix each week. Revenue is up 2.1x since we started.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Managing Director, Peak Fitness",
    quote: "Our Google reviews went from 3.2 to 4.7 stars using the Reputation Fixer. New sign-ups increased 65% the following month. Incredible tool.",
    rating: 5,
  },
  {
    name: "Lisa Thompson",
    role: "Agency Owner, BrightPath Digital",
    quote: "I use the Agency plan to audit all my clients. It saves my team 20+ hours per client on initial diagnostics. White-label exports are the cherry on top.",
    rating: 5,
  },
  {
    name: "James O'Brien",
    role: "Owner, Craft & Cork Bistro",
    quote: "I was skeptical about AI auditing my restaurant business. But the findings were spot-on — missing Google Business profile, no email list, terrible meta descriptions. Fixed them all.",
    rating: 5,
  },
];

const FAQ_ITEMS = [
  {
    q: "What is Tasknator?",
    a: "Tasknator is an AI-powered platform that diagnoses what's wrong with your business's online presence (website, SEO, social, offers, reputation) and generates a complete recovery plan with ready-to-use marketing assets.",
  },
  {
    q: "How does the AI audit work?",
    a: "You provide your business details, website URL, and social profiles. Our AI (powered by Claude, GPT-4, and Gemini) analyzes everything and generates a scorecard across 6 categories, identifies specific issues with severity ratings, and creates a prioritized 30/60/90-day repair plan.",
  },
  {
    q: "How long does an audit take?",
    a: "Most audits complete in under 3 minutes. You'll receive your full scorecard, findings list, and repair plan immediately after the audit finishes.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes! All plans include a 7-day free trial. You can run your first audit completely free with no credit card required.",
  },
  {
    q: "What kind of businesses is this for?",
    a: "Tasknator works for any business with an online presence — restaurants, salons, fitness studios, agencies, SaaS companies, e-commerce stores, professional services, and more. If you have a website and want more customers, it's for you.",
  },
  {
    q: "Can I use Tasknator for my clients?",
    a: "Absolutely! Our Agency plan ($79/month) supports up to 25 business profiles and 100 audits/month with white-label exports and team access. Many marketing agencies use Tasknator to onboard and diagnose clients.",
  },
  {
    q: "What assets does Tasknator generate?",
    a: "Depending on your audit findings, Tasknator can generate: website copy, ad scripts (Meta & Google), email sequences, SMS sequences, review reply templates, SEO plans, sales scripts, offer packages, FAQs, win-back messages, and cost checklists.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. No contracts, no commitments. Cancel anytime from your billing page and you won't be charged again. Your data remains accessible until the end of your billing period.",
  },
];

function IconComponent({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, any> = { Target, FileText, Sparkles, BarChart3, Star, TrendingUp };
  const Icon = icons[name] || Zap;
  return <Icon className={className} />;
}

export default async function HomePage() {
  const branding = await getSiteBranding();

  return (
    <div className="relative overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.siteName} className="h-8 max-w-[180px] object-contain" />
              ) : (
                <>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold text-gray-900">{branding.siteName}</span>
                </>
              )}
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
              <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
              <Link href="/blog" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Blog</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Get Started <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-t from-blue-50 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              AI-Powered Business Diagnostics
              <ChevronRight className="w-3 h-3" />
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-slide-up">
              Your business is
              <span className="text-gradient"> broken.</span>
              <br />
              We&apos;ll fix it with
              <span className="text-gradient"> AI.</span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              Tasknator diagnoses why your business isn&apos;t performing and generates a complete recovery plan with ready-to-use marketing assets — in minutes, not months.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-lg font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Start Free Diagnosis <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-gray-200 text-gray-700 text-lg font-medium hover:bg-gray-50 transition-all"
              >
                <Play className="w-5 h-5" /> See How It Works
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Setup in 2 minutes
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4 text-green-500" />
                Works worldwide
              </div>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative max-w-5xl mx-auto animate-slide-up" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-gray-900/10 border border-gray-200">
              <div className="bg-gray-900 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 text-center text-xs text-gray-400">app.tasknator.com/dashboard</div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 p-8 min-h-[400px]">
                <div className="grid grid-cols-12 gap-4">
                  <div className="col-span-3 space-y-3">
                    <div className="h-8 bg-white rounded-lg shadow-sm border border-gray-100" />
                    <div className="space-y-2">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`h-9 rounded-lg ${i === 1 ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="col-span-9 space-y-4">
                    <div className="flex gap-4">
                      {["Overall: 42/100", "Website: 35", "SEO: 28", "Social: 55"].map((label, i) => (
                        <div key={i} className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                          <div className="text-xs text-gray-400 mb-1">{label.split(":")[0]}</div>
                          <div className={`text-2xl font-bold ${i === 0 ? 'text-orange-500' : i < 3 ? 'text-red-500' : 'text-yellow-500'}`}>
                            {label.split(": ")[1]}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
                      <div className="text-sm font-semibold text-gray-700">Critical Findings</div>
                      {["No clear CTA on homepage", "Missing meta descriptions", "No Google Business profile"].map((finding, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-red-50/50">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-sm text-gray-700">{finding}</span>
                          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Fix Now</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-purple-500/10 rounded-3xl blur-2xl" />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="relative py-12 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-700 text-sm font-medium mb-4">
              All-in-One Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Every tool you need to <span className="text-gradient">repair your business</span>
            </h2>
            <p className="text-gray-600 text-lg">
              From diagnosis to execution — get a complete recovery toolkit powered by AI.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group relative p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-violet-50 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-violet-100 transition-colors">
                  <IconComponent name={feature.icon} className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
              Simple Process
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              From broken to <span className="text-gradient">booming</span> in 4 steps
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.step} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-blue-200 to-transparent -translate-x-4" />
                )}
                <div className="text-5xl font-black text-blue-100 mb-4">{step.step}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-sm font-medium mb-4">
              Trusted by Thousands
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Real businesses, <span className="text-gradient">real results</span>
            </h2>
            <p className="text-gray-600 text-lg">
              See what business owners are saying about Tasknator.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-blue-50 transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Plans that scale with <span className="text-gradient">your growth</span>
            </h2>
            <p className="text-gray-600 text-lg">Start free, upgrade when you need more power.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? "bg-gradient-to-b from-blue-600 to-violet-700 text-white shadow-2xl shadow-blue-500/25 scale-105"
                    : "bg-white border border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold">
                    MOST POPULAR
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`text-lg font-semibold mb-1 ${plan.popular ? "text-white" : "text-gray-900"}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm ${plan.popular ? "text-blue-100" : "text-gray-500"}`}>
                    {plan.description}
                  </p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={`text-sm ${plan.popular ? "text-blue-200" : "text-gray-500"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.popular ? "text-blue-200" : "text-green-500"}`} />
                      <span className={plan.popular ? "text-blue-50" : "text-gray-600"}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.popular
                      ? "bg-white text-blue-700 hover:bg-blue-50"
                      : "bg-gray-900 text-white hover:bg-gray-800"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-8">
            All plans include a 7-day free trial. Cancel anytime. Payments via Stripe & PayPal.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-sm font-medium mb-4">
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Frequently asked <span className="text-gradient">questions</span>
            </h2>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <details
                key={i}
                className="group rounded-2xl border border-gray-100 bg-white overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer p-6 text-left">
                  <span className="text-sm font-semibold text-gray-900 pr-4">{item.q}</span>
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="px-6 pb-6 -mt-2">
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section id="newsletter" className="py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-3">
            Stay in the loop
          </h2>
          <p className="text-gray-600 mb-8">
            Get weekly tips on fixing business bottlenecks, new features, and case studies. No spam, unsubscribe anytime.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              name="email"
              placeholder="you@company.com"
              required
              className="flex-1 h-12 px-5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="h-12 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-4">Join 3,200+ business owners. Unsubscribe anytime.</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-6">
            Stop guessing.<br />
            <span className="text-gradient">Start fixing.</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of business owners who used Tasknator to identify what&apos;s broken and get back on track.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white text-lg font-semibold shadow-2xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Run Your Free Audit <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt={branding.siteName} className="h-7 max-w-[150px] object-contain" />
              ) : (
                <>
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">{branding.siteName}</span>
                </>
              )}
              <span className="text-sm text-gray-400 ml-2">{branding.tagline}</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
              <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
