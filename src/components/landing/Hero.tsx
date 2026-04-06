import Link from "next/link";
import Image from "next/image";
import { Lock, CreditCard, Play } from "lucide-react";

interface LandingHeroProps {
  branding: {
    siteName: string;
  };
}

export function LandingHero({ branding }: LandingHeroProps) {
  return (
    <div className="relative z-10 mx-auto grid max-w-full gap-12 px-4 pb-28 pt-10 sm:px-6 sm:pb-32 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-12 lg:px-24 lg:pb-20 lg:pt-12 xl:gap-0">
      <div>
        <h1 className="text-4xl font-medium leading-tight tracking-tight lg:text-5xl lg:leading-[1.2]">
          Diagnose. Recover. Optimize —<br />
          Instantly with AI.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/95 sm:text-lg lg:text-lg">
          {branding.siteName} identifies hidden issues, explains root causes,{" "}
          <br /> and gives you a clear recovery plan in seconds.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 sm:gap-5">
          <Link
            href="/register"
            className="rounded-md bg-blue-500 px-8 py-4 text-base font-semibold text-white shadow-md transition hover:bg-blue-600"
          >
            Start Free Diagnosis
          </Link>
          <Link
            href="#how-it-works"
            className="inline-flex items-center gap-2 rounded-md bg-[#1c57a3] px-8 py-4 text-base font-semibold text-white border border-white shadow-md transition hover:bg-[#174a8c]"
          >
            <Play className="h-5 w-5" />
            See How It Works
          </Link>
        </div>
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-5 text-sm sm:text-base text-white/90">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span>Secure &amp; encrypted</span>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 shrink-0" strokeWidth={2} />
            <span>Payments via Stripe</span>
          </div>
          <div className="w-full flex items-center gap-3">
            <span className="h-4 w-4 shrink-0 rounded-full bg-red-500" aria-hidden />
            <span>Cancel anytime</span>
          </div>
        </div>
      </div>

      <div className="relative hidden lg:flex items-center justify-end">
        <div className="relative w-full">
          <Image
            src="/landing-hero-dashboard.png"
            alt={`${branding.siteName} dashboard`}
            width={600}
            height={500}
            className="w-full h-auto drop-shadow-2xl"
            priority
          />
        </div>
      </div>
    </div>
  );
}
