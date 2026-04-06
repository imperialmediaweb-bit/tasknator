"use client";

import { useState } from "react";
import { Diamond, Lock, CreditCard, Check, HelpCircle, ChevronDown } from "lucide-react";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const trustItems = [
    {
      icon: "diamond",
      title: "Your data stays yours.",
      bold: true,
    },
    {
      icon: "lock",
      title: "Encrypted & secure",
      bold: false,
    },
    {
      icon: "card",
      title: "Payments via Stripe",
      bold: false,
    },
    {
      icon: "check",
      title: "No data selling",
      bold: false,
    },
  ];

  const faqItems = [
    {
      q: "What is Recovra.ai?",
      a: "Recovra.ai is an AI-powered platform that diagnoses what's wrong with your business's online presence (website, SEO, social, offers, reputation) and generates a complete recovery plan with ready-to-use marketing assets.",
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
      a: "Recovra.ai works for any business with an online presence — restaurants, salons, fitness studios, agencies, SaaS companies, e-commerce stores, professional services, and more. If you have a website and want more customers, it's for you.",
    },
    {
      q: "Can I use Recovra.ai for my clients?",
      a: "Absolutely! Our Agency plan ($149/month) supports up to 25 business profiles and 100 audits/month with white-label exports and team access. Many marketing agencies use Recovra.ai to onboard and diagnose clients.",
    },
    {
      q: "What assets does Recovra.ai generate?",
      a: "Depending on your audit findings, Recovra.ai can generate: website copy, ad scripts (Meta & Google), email sequences, SMS sequences, review reply templates, SEO plans, sales scripts, offer packages, FAQs, win-back messages, and cost checklists.",
    },
    {
      q: "Can I cancel anytime?",
      a: "Yes. No contracts, no commitments. Cancel anytime from your billing page and you won't be charged again. Your data remains accessible until the end of your billing period.",
    },
  ];

  return (
    <section
      id="trust-faq"
      className="bg-white py-16 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            FAQ
          </div>
          <h2 className="text-3xl font-bold sm:text-4xl">
            Frequently asked <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">questions</span>
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-12">
        <div className="divide-y divide-[#e4e9ef]">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className={`flex items-center gap-3.5 ${
                item === trustItems[0] ? "pb-4 pt-0" : item === trustItems[trustItems.length - 1] ? "pt-4" : "py-4"
              }`}
            >
              {item.icon === "diamond" && (
                <Diamond
                  className="h-5 w-5 shrink-0 fill-[#2b6fdd] text-[#2b6fdd]"
                  strokeWidth={1.25}
                  aria-hidden
                />
              )}
              {item.icon === "lock" && (
                <Lock
                  className="h-5 w-5 shrink-0 text-slate-900"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              {item.icon === "card" && (
                <CreditCard
                  className="h-5 w-5 shrink-0 text-[#2b6fdd]"
                  strokeWidth={2}
                  aria-hidden
                />
              )}
              {item.icon === "check" && (
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e53935] text-white shadow-sm"
                  aria-hidden
                >
                  <Check className="h-4 w-4" strokeWidth={3} />
                </span>
              )}
              <span
                className={`text-[1.02rem] ${
                  item.bold ? "font-bold" : "font-normal"
                } ${item.bold ? "text-[#142d52]" : "text-slate-800"}`}
              >
                {item.title}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {faqItems.map((item, index) => (
            <button
              key={item.q}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full text-left"
            >
              <div className="flex items-center gap-3.5 rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-4 shadow-[0_1px_3px_rgba(15,35,55,0.06)] transition-all hover:shadow-md">
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#2b6fdd] text-white shadow-sm">
                  <HelpCircle
                    className="h-4 w-4 opacity-95"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                </span>
                <span className="flex-1 font-bold text-[#142d52] text-[0.98rem]">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 shrink-0 text-[#2b6fdd] transition-transform duration-300 ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </div>
              {openIndex === index && (
                <div className="mt-2 ml-[62px] border-l-2 border-[#e2e8f0] pl-4 py-3">
                  <p className="text-[0.98rem] leading-relaxed text-[#4b5d73]">
                    {item.a}
                  </p>
                </div>
              )}
            </button>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
