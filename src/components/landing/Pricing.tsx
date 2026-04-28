import Link from "next/link";
import { Check } from "lucide-react";

export function Pricing() {
  return (
    <section
      id="pricing"
      className="border-t border-slate-100 bg-slate-50/80 pb-16 pt-10 sm:pb-24 sm:pt-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-[#1c3d6e] sm:text-4xl">
          Pricing Plans
        </h2>
        <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch md:gap-5 lg:gap-6">
          <div className="pricing-card-shadow flex min-h-[480px] flex-col rounded-xl bg-white px-8 pb-8 pt-10">
            <h3 className="text-lg font-bold text-slate-900">Starter</h3>
            <p className="mt-3 text-4xl font-bold leading-none text-slate-900">
              $19<span className="text-lg font-semibold text-slate-500">/month</span>
            </p>
            <div className="mt-5 h-px w-full bg-slate-200" />
            <p className="mt-6 text-center text-sm font-normal text-slate-600">
              For solo businesses
            </p>
            <ul className="mt-6 flex-1 space-y-3">
              {["1 business profile", "1 audit/month", "Website Fixer", "Sales Doctor", "Limited exports"].map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2f80ed]" strokeWidth={2.75} />
                  <span className="text-sm text-slate-600">{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className="mt-8 block w-full rounded-lg bg-[#1c57a3] py-3.5 text-center text-sm font-semibold text-white shadow-[0_2px_8px_rgba(28,87,163,0.35)] transition hover:bg-[#164877]"
            >
              Start Free Trial
            </Link>
          </div>
          <div className="pricing-card-shadow relative scale-105 flex min-h-[480px] flex-col overflow-visible rounded-3xl bg-white shadow-2xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-gradient-to-r from-[#1c57a3] to-[#254078] px-6 py-2 rounded-full text-xs font-bold text-white whitespace-nowrap">
                Most Popular
              </div>
            </div>
            <div className="pricing-header-gradient relative px-6 pb-14 pt-10 text-center text-white">
              <h3 className="text-lg font-bold text-white">Pro</h3>
              <p className="mt-3 text-4xl font-bold leading-none">
                $79<span className="text-lg font-semibold text-white/85">/month</span>
              </p>
              <svg
                className="absolute bottom-0 left-0 block h-[3rem] w-full text-white"
                viewBox="0 0 1440 48"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M0,22 Q720,6 1440,24 L1440,48 L0,48 Z"
                />
              </svg>
            </div>
            <div className="flex flex-1 flex-col bg-white px-8 pb-8 pt-6">
              <p className="text-center text-sm text-slate-600">For growing businesses</p>
              <ul className="mt-6 space-y-3">
                {["3 business profiles", "10 audits/month", "All modules", "Full PDF & ZIP exports", "Version history"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2f80ed]" strokeWidth={2.75} />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex-1" />
              <Link
                href="/register"
                className="mt-8 block w-full rounded-lg bg-[#1c57a3] py-3.5 text-center text-sm font-semibold text-white shadow-[0_2px_8px_rgba(28,87,163,0.35)] transition hover:bg-[#164877]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
          <div className="pricing-card-shadow flex min-h-[380px] flex-col overflow-hidden rounded-xl bg-white">
            <div className="pricing-header-gradient relative px-6 pb-14 pt-10 text-center text-white">
              <h3 className="text-lg font-bold text-white">Agency</h3>
              <p className="mt-3 text-4xl font-bold leading-none">
                $149<span className="text-lg font-semibold text-white/85">/month</span>
              </p>
              <svg
                className="absolute bottom-0 left-0 block h-[3.25rem] w-full text-white"
                viewBox="0 0 1440 52"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path
                  fill="currentColor"
                  d="M0,20 C320,46 400,6 720,22 C1040,40 1120,4 1440,22 L1440,52 L0,52 Z"
                />
              </svg>
            </div>
            <div className="flex flex-1 flex-col bg-white px-8 pb-8 pt-6">
              <p className="text-center text-sm text-slate-600">For agencies &amp; teams</p>
              <ul className="mt-6 space-y-3">
                {["25 business profiles", "100 audits/month", "All modules + Cost Cutter", "White-label exports", "Team members (25)"].map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#2f80ed]" strokeWidth={2.75} />
                    <span className="text-sm text-slate-600">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="flex-1" />
              <Link
                href="/register"
                className="mt-8 block w-full rounded-lg bg-[#1c57a3] py-3.5 text-center text-sm font-semibold text-white shadow-[0_2px_8px_rgba(28,87,163,0.35)] transition hover:bg-[#164877]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-2">
          {["Free trial included", "No contracts", "Cancel anytime"].map(
            (label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-[#1c3d6e]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f80ed]">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
                {label}
              </div>
            )
          )}
        </div>
        <p className="mx-auto mt-7 max-w-2xl text-center text-sm italic text-slate-500">
          By subscribing, you agree to our{" "}
          <a
            href="#"
            className="font-bold not-italic text-[#2f80ed] hover:underline"
          >
            Terms &amp; Privacy Policy
          </a>
        </p>
      </div>
    </section>
  );
}
