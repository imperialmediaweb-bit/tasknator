import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronDown,
  ChevronRight,
  Lock,
  CreditCard,
  Check,
  AlertTriangle,
  HelpCircle,
  Diamond,
} from "lucide-react";
import { getSiteBranding } from "@/lib/branding";
import { db } from "@/lib/db";

function NavDropdown({
  label,
  children,
  light,
}: {
  label: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div className="relative group py-2">
      <button
        type="button"
        className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
          light ? "text-white/90 hover:text-white" : "text-slate-700 hover:text-slate-900"
        }`}
        aria-expanded="false"
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className="h-4 w-4 opacity-80" strokeWidth={2} />
      </button>
      <div className="invisible absolute left-0 top-full z-50 pt-1 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100">
        <div className="min-w-[11rem] rounded-lg border border-slate-100 bg-white py-1 shadow-lg shadow-slate-900/10">
          {children}
        </div>
      </div>
    </div>
  );
}

function DropdownLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="block px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50">
      {children}
    </Link>
  );
}

export default async function HomePage() {
  const [branding, footerItems] = await Promise.all([
    getSiteBranding(),
    db.menuItem.findMany({ where: { location: "FOOTER", visible: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <header className="landing-hero-bg relative text-white">
        <div className="landing-hero-waves" aria-hidden>
          <svg className="wave-1 text-sky-200/50" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path
              fill="currentColor"
              fillOpacity="0.35"
              d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          </svg>
          <svg className="wave-2 text-white" viewBox="0 0 1440 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path
              fill="currentColor"
              fillOpacity="0.12"
              d="M0,128L60,133.3C120,139,240,149,360,154.7C480,160,600,160,720,138.7C840,117,960,75,1080,69.3C1200,64,1320,96,1380,112L1440,128L1440,200L1380,200C1320,200,1200,200,1080,200C960,200,840,200,720,200C600,200,480,200,360,200C240,200,120,200,60,200L0,200Z"
            />
          </svg>
        </div>

        <nav className="relative z-30 border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center">
              {branding.logoUrl?.startsWith("http") ? (
                <img src={branding.logoUrl} alt={branding.siteName} width={220} height={72} className="h-10 w-auto max-w-[220px] object-contain" />
              ) : (
                <Image src={branding.logoUrl || "/logo1.png"} alt={branding.siteName} width={220} height={72} className="h-10 w-auto object-contain" priority />
              )}
            </Link>
            <div className="flex items-center gap-3">
              <details className="relative md:hidden">
                <summary className="cursor-pointer list-none rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
                  Menu
                </summary>
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[13rem] rounded-lg border border-slate-100 bg-white py-2 shadow-xl">
                  <Link href="#features" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    Product
                  </Link>
                  <Link href="#pricing" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    Pricing
                  </Link>
                  <Link href="/blog" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    Resources
                  </Link>
                  <Link href="/blog" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    Blog
                  </Link>
                  <Link href="#trust-faq" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    Support
                  </Link>
                </div>
              </details>

              <div className="hidden items-center gap-1 md:flex">
                <NavDropdown label="Product" light>
                  <DropdownLink href="#features">Features</DropdownLink>
                  <DropdownLink href="#how-it-works">How it works</DropdownLink>
                </NavDropdown>
                <Link href="#pricing" className="px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white">
                  Pricing
                </Link>
                <NavDropdown label="Resources" light>
                  <DropdownLink href="#features">Documentation</DropdownLink>
                  <DropdownLink href="#trust-faq">Help center</DropdownLink>
                </NavDropdown>
                <Link href="/blog" className="px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white">
                  Blog
                </Link>
                <Link href="#trust-faq" className="px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:text-white">
                  Support
                </Link>
              </div>

              <Link href="/login" className="rounded-lg bg-[#1c57a3] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#174a8c]">
                Start Login
              </Link>
            </div>
          </div>
        </nav>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-4 pb-28 pt-10 sm:px-6 sm:pb-32 lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:pb-36 lg:pt-8 xl:gap-16">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-[2.75rem] lg:leading-[1.15]">
              Diagnose. Recover. Optimize - Instantly with AI.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
              {branding.siteName} identifies hidden issues, explains root causes, and gives you a clear recovery plan in seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-b from-[#2563eb] to-[#1550c9] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/35 transition hover:from-[#1e56dc] hover:to-[#1246b5]"
              >
                Start Free Trial
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white/80 bg-transparent px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Demo
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm text-white/85">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                <span>Secure &amp; encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                <span>Payments via Stripe</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" aria-hidden />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>

          <div className="hero-dashboard-stage relative flex min-h-[280px] justify-center py-4 pb-8 pt-2 sm:pb-10 lg:min-h-[400px] lg:justify-end lg:justify-self-end lg:pl-4 lg:pr-0 lg:pb-16 lg:pt-1 xl:translate-x-1">
            <div className="pointer-events-none absolute bottom-3 left-[14%] h-10 w-[74%] max-w-md rounded-[50%] bg-black/35 blur-2xl sm:bottom-5 lg:bottom-10 lg:left-[24%] lg:h-12 lg:w-[54%] lg:max-w-lg" aria-hidden />
            <div className="hero-dashboard-tilt relative z-[2] w-full max-w-[470px] will-change-transform sm:max-w-[495px] lg:max-w-[535px] xl:max-w-[555px]">
              <div className="hero-device-bezel relative rounded-[1.25rem] p-[10px]">
                <div className="overflow-hidden rounded-[0.7rem] bg-[#0a0e14] ring-1 ring-black/60">
                  <Image
                    src="/landing-hero-dashboard.png"
                    alt={`${branding.siteName} dashboard preview`}
                    width={1200}
                    height={900}
                    className="h-auto w-full object-cover object-top"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero-base-waves" aria-hidden>
          <svg className="hero-wave-layer-a" viewBox="0 0 1440 200" height="200" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,72 C360,22 720,118 1080,52 C1260,28 1380,58 1440,46 L1440,220 L0,220 Z" />
          </svg>
          <svg className="hero-wave-layer-b" viewBox="0 0 1440 200" height="200" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,88 C300,120 540,40 840,78 C1020,98 1200,68 1440,92 L1440,220 L0,220 Z" />
          </svg>
          <svg className="hero-wave-layer-c" viewBox="0 0 1440 200" height="200" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,102 C420,72 620,130 960,92 C1140,76 1320,108 1440,96 L1440,220 L0,220 Z" />
          </svg>
          <svg className="hero-wave-layer-d" viewBox="0 0 1440 200" height="200" preserveAspectRatio="none">
            <path fill="currentColor" d="M0,118 C480,88 720,138 1200,108 C1320,100 1380,118 1440,110 L1440,220 L0,220 Z" />
          </svg>
        </div>
      </header>

      <section className="relative z-10 border-b border-slate-200/50 bg-gradient-to-b from-[#eef6fc] via-[#f5f9fc] to-[#fafcfe] py-6 text-center sm:py-7">
        <p className="text-sm font-semibold sm:text-base">
          <span className="text-black">Trusted by </span>
          <span className="text-[#286fd7]">founders, operators, and growth teams.</span>
        </p>
      </section>

      <section id="how-it-works" className="border-b border-slate-100/80 bg-[#f3f9fc] py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-stretch gap-12 md:flex-row md:items-center md:justify-between md:gap-4 lg:gap-6">
            {[
              { n: "1.", title: "Diagnose", desc: "Scan your systems" },
              { n: "2.", title: "Analyze", desc: "Identify root causes" },
              { n: "3.", title: "Recover", desc: "Get a recovery plan" },
            ].map((step, i) => (
              <Fragment key={step.title}>
                <div className="flex flex-1 items-center gap-4 md:min-w-0">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-transparent text-lg font-bold text-[#2f80ed]" aria-hidden>
                    {step.n}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-lg font-bold text-[#1c3d6e]">{step.title}</div>
                    <div className="mt-0.5 text-sm font-normal text-[#666666]">{step.desc}</div>
                  </div>
                </div>
                {i < 2 && <ChevronRight className="hidden h-8 w-8 shrink-0 text-slate-400 md:block lg:h-9 lg:w-9" strokeWidth={1.5} aria-hidden />}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="bg-[#f8fafc] py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mx-auto max-w-4xl text-center text-3xl font-bold leading-tight text-[#1c3d6e] sm:text-4xl">
            See exactly what&apos;s broken - and how to fix it.
          </h2>
          <div className="relative mt-12 sm:mt-14">
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-12 lg:gap-x-14 xl:gap-x-16">
              <div className="relative z-0 lg:min-h-[1px]">
                <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_24px_-4px_rgba(15,35,70,0.12)] ring-1 ring-slate-200/90">
                  <Image
                    src="/landing-features-dashboard.png"
                    alt={`${branding.siteName} features`}
                    width={1100}
                    height={900}
                    className="h-auto w-full object-cover object-left-top"
                  />
                </div>
              </div>
              <div className="relative z-10 flex flex-col justify-start lg:pt-2">
                <ul className="space-y-5">
                  {[
                    "AI-powered diagnostics",
                    "Root cause analysis",
                    "Actionable recovery steps",
                    "Continuous optimization insights",
                  ].map((item) => (
                    <li key={item} className="flex gap-3.5">
                      <Check className="mt-0.5 h-6 w-6 shrink-0 text-[#2f80ed]" strokeWidth={2.75} aria-hidden />
                      <span className="text-base font-medium leading-relaxed text-[#1c3d6e]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="relative z-20 mx-auto mt-8 w-full max-w-2xl rounded-xl border border-slate-200/90 bg-[#f4f6f8] p-4 shadow-md sm:p-5 lg:absolute lg:bottom-0 lg:left-[34%] lg:mt-0 lg:w-[min(66%,36rem)] lg:translate-y-[42%] lg:mx-0">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" strokeWidth={2} />
                <p className="text-sm leading-relaxed text-slate-600">
                  AI-generated insights may vary and are for informational purposes only. Not professional advice.
                </p>
              </div>
            </div>
          </div>
          <div className="h-6 sm:h-8 lg:h-10" aria-hidden />
        </div>
      </section>

      <section id="pricing" className="border-t border-slate-100 bg-slate-50/80 pb-16 pt-10 sm:pb-24 sm:pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-[#1c3d6e] sm:text-4xl">Pricing Plans</h2>
          <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch md:gap-5 lg:gap-6">
            <div className="pricing-card-shadow flex min-h-[380px] flex-col rounded-xl bg-white px-8 pb-8 pt-10">
              <h3 className="text-lg font-bold text-slate-900">Starter</h3>
              <p className="mt-3 text-4xl font-bold leading-none text-slate-900">
                $19<span className="text-lg font-semibold text-slate-500">/mo</span>
              </p>
              <div className="mt-5 h-px w-full bg-slate-200" />
              <p className="mt-6 flex-1 text-center text-sm font-normal text-slate-600">Basic Diagnostics</p>
              <Link href="/register" className="mt-8 block w-full rounded-lg bg-[#1c57a3] py-3.5 text-center text-sm font-semibold text-white shadow-[0_2px_8px_rgba(28,87,163,0.35)] transition hover:bg-[#164877]">
                Start Trial
              </Link>
            </div>
            <div className="pricing-card-shadow flex min-h-[380px] flex-col overflow-hidden rounded-xl bg-white">
              <div className="pricing-header-gradient relative px-6 pb-14 pt-10 text-center text-white">
                <h3 className="text-lg font-bold text-white">Growth</h3>
                <p className="mt-3 text-4xl font-bold leading-none">
                  $49<span className="text-lg font-semibold text-white/85">/mo</span>
                </p>
                <svg className="absolute bottom-0 left-0 block h-[3rem] w-full text-white" viewBox="0 0 1440 48" preserveAspectRatio="none" aria-hidden>
                  <path fill="currentColor" d="M0,22 Q720,6 1440,24 L1440,48 L0,48 Z" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col bg-white px-8 pb-8 pt-6 text-center">
                <p className="text-sm text-slate-600">Full Diagnostics</p>
                <p className="mt-2 text-sm text-slate-600">Recovery Plans</p>
                <div className="flex-1" />
                <Link href="/register" className="mt-8 block w-full rounded-lg bg-[#1c57a3] py-3.5 text-center text-sm font-semibold text-white shadow-[0_2px_8px_rgba(28,87,163,0.35)] transition hover:bg-[#164877]">
                  Start Trial
                </Link>
              </div>
            </div>
            <div className="pricing-card-shadow flex min-h-[380px] flex-col overflow-hidden rounded-xl bg-white">
              <div className="pricing-header-gradient relative px-6 pb-14 pt-10 text-center text-white">
                <h3 className="text-lg font-bold text-white">Pro</h3>
                <p className="mt-3 text-4xl font-bold leading-none">
                  $99<span className="text-lg font-semibold text-white/85">/mo</span>
                </p>
                <svg className="absolute bottom-0 left-0 block h-[3.25rem] w-full text-white" viewBox="0 0 1440 52" preserveAspectRatio="none" aria-hidden>
                  <path fill="currentColor" d="M0,20 C320,46 400,6 720,22 C1040,40 1120,4 1440,22 L1440,52 L0,52 Z" />
                </svg>
              </div>
              <div className="flex flex-1 flex-col bg-white px-8 pb-8 pt-6 text-center">
                <p className="text-sm text-slate-600">Unlimited Usage</p>
                <p className="mt-2 text-sm text-slate-600">Advanced Insights</p>
                <div className="flex-1" />
                <Link href="/register" className="mt-8 block w-full rounded-lg bg-[#1c57a3] py-3.5 text-center text-sm font-semibold text-white shadow-[0_2px_8px_rgba(28,87,163,0.35)] transition hover:bg-[#164877]">
                  Start Trial
                </Link>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-2">
            {["Free trial included", "No contracts", "Cancel anytime"].map((label) => (
              <div key={label} className="flex items-center gap-2 text-sm text-[#1c3d6e]">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2f80ed]">
                  <Check className="h-3 w-3 text-white" strokeWidth={3} />
                </span>
                {label}
              </div>
            ))}
          </div>
          <p className="mx-auto mt-7 max-w-2xl text-center text-sm italic text-slate-500">
            By subscribing, you agree to our{" "}
            <a href="#" className="font-bold not-italic text-[#2f80ed] hover:underline">
              Terms &amp; Privacy Policy
            </a>
          </p>
        </div>
      </section>

      <section id="trust-faq" className="border-t border-[#edf2f7] bg-[#f8f9fb] py-12 sm:py-14">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:gap-12 lg:px-8">
          <div className="divide-y divide-[#e4e9ef]">
            <div className="flex items-center gap-3.5 pb-4 pt-0">
              <Diamond className="h-5 w-5 shrink-0 fill-[#2b6fdd] text-[#2b6fdd]" strokeWidth={1.25} aria-hidden />
              <span className="text-[1.02rem] font-bold text-[#142d52]">Your data stays yours.</span>
            </div>
            <div className="flex items-center gap-3.5 py-4">
              <Lock className="h-5 w-5 shrink-0 text-slate-900" strokeWidth={2} aria-hidden />
              <span className="text-[1.02rem] font-normal text-slate-800">Encrypted &amp; secure</span>
            </div>
            <div className="flex items-center gap-3.5 py-4">
              <CreditCard className="h-5 w-5 shrink-0 text-[#2b6fdd]" strokeWidth={2} aria-hidden />
              <span className="text-[1.02rem] font-normal text-slate-800">Payments as Stripe</span>
            </div>
            <div className="flex items-center gap-3.5 pt-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#e53935] text-white shadow-sm" aria-hidden>
                <Check className="h-4 w-4" strokeWidth={3} />
              </span>
              <span className="text-[1.02rem] font-normal text-slate-800">No data selling</span>
            </div>
          </div>

          <div className="flex flex-col gap-3.5">
            {[
              { q: "Is this accurate?", a: "AI outputs may vary — always validate." },
              { q: "Can I cancel anytime?", a: "Yes, instantly from your dashboard." },
              { q: "Is there free trial?", a: "Yes, no commitment." },
            ].map((item) => (
              <div
                key={item.q}
                className="flex items-center gap-3.5 rounded-[10px] border border-[#e2e8f0] bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(15,35,55,0.06)]"
              >
                <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#2b6fdd] text-white shadow-sm">
                  <HelpCircle className="h-4 w-4 opacity-95" strokeWidth={2.25} aria-hidden />
                </span>
                <p className="min-w-0 text-[0.98rem] leading-snug">
                  <span className="font-bold text-[#142d52]">{item.q}</span>
                  <span className="font-normal text-[#4b5d73]"> {item.a}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[#edf2f7] bg-white">
        <div className="mx-auto max-w-[1240px] px-4 pb-5 pt-6 sm:px-6 lg:px-8">
          {footerItems.length > 0 && (
            <div className="mb-6 flex flex-wrap justify-center gap-x-6 gap-y-2 border-b border-slate-100 pb-6 text-sm font-medium text-[#163a67]">
              {footerItems.map((item) => (
                <Link key={item.id} href={item.href} target={item.openNew ? "_blank" : undefined} rel={item.openNew ? "noopener noreferrer" : undefined} className="hover:underline">
                  {item.label}
                </Link>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-[1.02rem] font-semibold text-[#163a67] sm:grid-cols-4">
            <nav className="flex flex-col gap-2.5">
              <Link href="#features" className="hover:underline">
                Features
              </Link>
              <Link href="#pricing" className="hover:underline">
                Pricing
              </Link>
              <Link href="#trust-faq" className="hover:underline">
                Contact
              </Link>
            </nav>
            <nav className="flex flex-col gap-2.5">
              <a href="#" className="hover:underline">
                &bull; Terms of Service
              </a>
              <a href="#" className="hover:underline">
                &bull; Contact
              </a>
            </nav>
            <nav className="flex flex-col gap-2.5">
              <a href="#" className="hover:underline">
                &bull; Privacy Policy
              </a>
              <a href="#" className="hover:underline">
                &bull; Acceptable Use
              </a>
            </nav>
            <nav className="flex flex-col gap-2.5">
              <a href="#" className="hover:underline">
                &bull; Cookie Policy
              </a>
              <a href="#" className="hover:underline">
                &bull; Refund Policy
              </a>
            </nav>
          </div>
          <p className="mt-3 text-right text-sm text-slate-500">
            © {new Date().getFullYear()} {branding.siteName} — All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
