"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Globe, Users, Target, ArrowRight, ArrowLeft, Upload, CheckCircle2, Sparkles } from "lucide-react";

const INDUSTRIES = [
  "Restaurant / Food Service", "Retail / E-commerce", "Professional Services", "Healthcare / Dental",
  "Real Estate", "Auto / Automotive", "Beauty / Salon / Spa", "Fitness / Gym",
  "Construction / Home Services", "Legal Services", "Accounting / Finance", "Marketing / Agency",
  "Education / Training", "Technology / SaaS", "Travel / Hospitality", "Other",
];

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", "France",
  "Romania", "Spain", "Italy", "Netherlands", "Brazil", "Mexico", "India", "Other",
];

const REVENUE_RANGES = [
  "Under $1,000/mo", "$1,000 - $5,000/mo", "$5,000 - $10,000/mo", "$10,000 - $25,000/mo",
  "$25,000 - $50,000/mo", "$50,000 - $100,000/mo", "$100,000+/mo", "Prefer not to say",
];

const GOALS = [
  { value: "MORE_LEADS", label: "Get more leads & calls", icon: "📞" },
  { value: "MORE_CONVERSIONS", label: "Increase conversions & sales", icon: "💰" },
  { value: "IMPROVE_REVIEWS", label: "Improve online reviews", icon: "⭐" },
  { value: "REDUCE_COSTS", label: "Reduce operating costs", icon: "📉" },
];

const PAINS = [
  { value: "NO_CALLS", label: "Nobody is calling / no inquiries" },
  { value: "LOW_CONVERSIONS", label: "Traffic but no sales" },
  { value: "BAD_REVIEWS", label: "Negative reviews hurting us" },
  { value: "ADS_NOT_WORKING", label: "Ads not delivering results" },
  { value: "EXPENSIVE_OPERATIONS", label: "Operations too expensive" },
];

type FormData = {
  name: string;
  industry: string;
  country: string;
  city: string;
  websiteUrl: string;
  description: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  linkedinUrl: string;
  googleBusinessUrl: string;
  revenueRange: string;
  customersMonth: string;
  avgOrderValue: string;
  marketingBudget: string;
  teamSize: string;
  primaryGoal: string;
  mainPain: string;
  websiteText: string;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: "", industry: "", country: "", city: "", websiteUrl: "", description: "",
    facebookUrl: "", instagramUrl: "", tiktokUrl: "", linkedinUrl: "", googleBusinessUrl: "",
    revenueRange: "", customersMonth: "", avgOrderValue: "", marketingBudget: "", teamSize: "",
    primaryGoal: "", mainPain: "", websiteText: "",
  });

  const steps = [
    { title: "Business Info", icon: Building2 },
    { title: "Online Presence", icon: Globe },
    { title: "Metrics", icon: Users },
    { title: "Goals & Pain Points", icon: Target },
    { title: "Website Snapshot", icon: Upload },
  ];

  function updateForm(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const [auditStatus, setAuditStatus] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    try {
      const res = await fetch("/api/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          customersMonth: form.customersMonth ? parseInt(form.customersMonth) : null,
          avgOrderValue: form.avgOrderValue ? parseFloat(form.avgOrderValue) : null,
          marketingBudget: form.marketingBudget ? parseFloat(form.marketingBudget) : null,
          teamSize: form.teamSize ? parseInt(form.teamSize) : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create business");
      const data = await res.json();

      // Auto-start audit after business creation
      setAuditStatus("Starting audit...");
      try {
        const auditRes = await fetch(`/api/audit/${data.id}/start`, { method: "POST" });
        if (auditRes.ok) {
          setAuditStatus("Audit started! Redirecting...");
        }
      } catch {
        // Audit start failed, still redirect to business page
      }

      router.push(`/business/${data.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((s, i) => (
            <div key={s.title} className="flex items-center">
              <div className={`flex items-center gap-2 ${i <= step ? "text-blue-600" : "text-gray-300"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  i < step ? "bg-blue-600 text-white" :
                  i === step ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className="hidden sm:block text-sm font-medium">{s.title}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-px mx-2 ${i < step ? "bg-blue-600" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        {/* Step 0: Business Info */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Tell us about your business</h2>
              <p className="text-sm text-gray-500">We&apos;ll use this to run your diagnostic audit.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Business name *</label>
              <input
                type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)}
                placeholder="e.g. Joe's Pizza"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry *</label>
              <select
                value={form.industry} onChange={(e) => updateForm("industry", e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select industry</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country *</label>
                <select
                  value={form.country} onChange={(e) => updateForm("country", e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <input
                  type="text" value={form.city} onChange={(e) => updateForm("city", e.target.value)}
                  placeholder="e.g. New York"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website URL</label>
              <input
                type="url" value={form.websiteUrl} onChange={(e) => updateForm("websiteUrl", e.target.value)}
                placeholder="https://www.example.com"
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Short description</label>
              <textarea
                value={form.description} onChange={(e) => updateForm("description", e.target.value)}
                placeholder="Briefly describe what your business does..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Step 1: Online Presence */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Online presence</h2>
              <p className="text-sm text-gray-500">Add your social media and business profile links (all optional).</p>
            </div>
            {[
              { label: "Facebook URL", field: "facebookUrl" as const, placeholder: "https://facebook.com/yourbusiness" },
              { label: "Instagram URL", field: "instagramUrl" as const, placeholder: "https://instagram.com/yourbusiness" },
              { label: "TikTok URL", field: "tiktokUrl" as const, placeholder: "https://tiktok.com/@yourbusiness" },
              { label: "LinkedIn URL", field: "linkedinUrl" as const, placeholder: "https://linkedin.com/company/yourbusiness" },
              { label: "Google Business Profile", field: "googleBusinessUrl" as const, placeholder: "https://g.page/yourbusiness" },
            ].map((item) => (
              <div key={item.field}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{item.label}</label>
                <input
                  type="url" value={form[item.field]} onChange={(e) => updateForm(item.field, e.target.value)}
                  placeholder={item.placeholder}
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Metrics */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Business metrics</h2>
              <p className="text-sm text-gray-500">Help us understand your current situation. All fields optional.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly revenue range</label>
              <select
                value={form.revenueRange} onChange={(e) => updateForm("revenueRange", e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Select range</option>
                {REVENUE_RANGES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Customers/month</label>
                <input
                  type="number" value={form.customersMonth} onChange={(e) => updateForm("customersMonth", e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Avg order value ($)</label>
                <input
                  type="number" value={form.avgOrderValue} onChange={(e) => updateForm("avgOrderValue", e.target.value)}
                  placeholder="e.g. 75"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Marketing budget/mo ($)</label>
                <input
                  type="number" value={form.marketingBudget} onChange={(e) => updateForm("marketingBudget", e.target.value)}
                  placeholder="e.g. 500"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Team size</label>
                <input
                  type="number" value={form.teamSize} onChange={(e) => updateForm("teamSize", e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Goals */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Goals & pain points</h2>
              <p className="text-sm text-gray-500">What&apos;s your primary objective and biggest challenge?</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary goal</label>
              <div className="grid grid-cols-2 gap-3">
                {GOALS.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => updateForm("primaryGoal", goal.value)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                      form.primaryGoal === goal.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <span className="text-2xl">{goal.icon}</span>
                    <span className="text-sm font-medium">{goal.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Main pain point</label>
              <div className="space-y-2">
                {PAINS.map((pain) => (
                  <button
                    key={pain.value}
                    type="button"
                    onClick={() => updateForm("mainPain", pain.value)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      form.mainPain === pain.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      form.mainPain === pain.value ? "border-blue-500" : "border-gray-300"
                    }`}>
                      {form.mainPain === pain.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <span className="text-sm">{pain.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Website Snapshot */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Website snapshot</h2>
              <p className="text-sm text-gray-500">
                Paste your homepage text or describe your current website. This helps us generate more accurate recommendations.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Homepage text (copy & paste from your website)
              </label>
              <textarea
                value={form.websiteText}
                onChange={(e) => updateForm("websiteText", e.target.value)}
                placeholder="Paste your homepage content here... (headlines, descriptions, service offerings, etc.)"
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">AI will analyze your inputs</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    If no website text is provided, we&apos;ll generate recommendations based on your industry and business details, clearly labeled as assumptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && (!form.name || !form.industry || !form.country)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !form.name || !form.industry || !form.country}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? (
                <>{auditStatus || "Creating business..."}</>
              ) : (
                <>Create & Run Audit <Sparkles className="w-4 h-4" /></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
