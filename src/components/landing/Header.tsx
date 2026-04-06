import Link from "next/link";
import Image from "next/image";

interface LandingHeaderProps {
  branding: {
    logoUrl: string;
    siteName: string;
  };
}

export function LandingHeader({ branding }: LandingHeaderProps) {
  return (
    <nav className="relative z-30 border-b border-white/50">
      <div className="mx-auto flex max-w-full items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-24">
        <Link href="/" className="flex items-center gap-2">
          {branding.logoUrl?.startsWith("http") ? (
            <img
              src={branding.logoUrl}
              alt={branding.siteName}
              width={220}
              height={72}
              className="h-14 w-auto max-w-[220px] object-contain"
            />
          ) : (
            <Image
              src={branding.logoUrl || "/logo1.png"}
              alt={branding.siteName}
              width={220}
              height={72}
              className="h-14 w-auto object-contain"
              priority
            />
          )}
          <span className="text-2xl font-medium tracking-wide text-white">
            {branding.siteName}
          </span>
        </Link>
        <div className="flex items-center gap-16">
          <details className="relative md:hidden">
            <summary className="cursor-pointer list-none rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
              Menu
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 min-w-[13rem] rounded-lg border border-slate-100 bg-white py-2 shadow-xl">
              <a
                href="#features"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                How it Works
              </a>
              <a
                href="#pricing"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Pricing
              </a>
              <a
                href="#trust-faq"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                FAQ
              </a>
              <Link
                href="/blog"
                className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Blog
              </Link>
            </div>
          </details>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-base font-normal text-white/90 transition-colors hover:text-white"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-base font-normal text-white/90 transition-colors hover:text-white"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-base font-normal text-white/90 transition-colors hover:text-white"
            >
              Pricing
            </a>
            <a
              href="#trust-faq"
              className="text-base font-normal text-white/90 transition-colors hover:text-white"
            >
              FAQ
            </a>
            <Link
              href="/blog"
              className="text-base font-normal text-white/90 transition-colors hover:text-white"
            >
              Blog
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-white/90 transition-colors hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-sm bg-[#1c57a3] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#174a8c]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
