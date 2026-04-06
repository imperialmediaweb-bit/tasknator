import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
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
import { LandingHeader } from "@/components/landing/Header";
import { LandingHero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";

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

        <LandingHeader branding={branding} />

        <LandingHero branding={branding} />

     
      </header>

      <TrustedBy />

      <HowItWorks />

      <Features branding={branding} />

      <Pricing />

      <FAQ />

      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
            <div className="flex flex-col items-center gap-1 md:flex-row md:items-center md:gap-2">
              {branding.logoUrl?.startsWith("http") ? (
                <Image src={branding.logoUrl} alt={branding.siteName} width={220} height={72} className="h-16 w-auto max-w-[220px] object-contain" unoptimized />
              ) : (
                <Image src={branding.logoUrl || "/logo1.png"} alt={branding.siteName} width={220} height={72} className="h-16 w-auto object-contain" />
              )}
              <span className="text-sm text-gray-400">{branding.siteName}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
              {footerItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  target={item.openNew ? "_blank" : undefined}
                  rel={item.openNew ? "noopener noreferrer" : undefined}
                  className="hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
