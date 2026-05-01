import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserMenu } from "./UserMenu";
import { Menu as MenuIcon } from "lucide-react";

interface LandingHeaderProps {
  branding: {
    logoUrl: string;
    siteName: string;
  };
}

export async function LandingHeader({ branding }: LandingHeaderProps) {
  const session = await getServerSession(authOptions);
  return (
    <nav className="relative z-30 bg-white/90 border-bborder-gray-100">
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
              src={branding.logoUrl || "/recovra-logo.png"}
              alt={branding.siteName}
              width={220}
              height={72}
              className="h-14 w-auto object-contain"
              priority
            />
          )}
        </Link>
        <div className="flex items-center gap-16">
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#how-it-works"
              className="text-base font-normal text-slate-600 transition-colors hover:text-slate-900"
            >
              How it Works
            </a>
            <a
              href="#pricing"
              className="text-base font-normal text-slate-600 transition-colors hover:text-slate-900"
            >
              Pricing
            </a>
            <a
              href="#trust-faq"
              className="text-base font-normal text-slate-600 transition-colors hover:text-slate-900"
            >
              FAQ
            </a>
            <Link
              href="/blog"
              className="text-base font-normal text-slate-600 transition-colors hover:text-slate-900"
            >
              Blog
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <details className="relative md:hidden">
              <summary className="cursor-pointer list-none rounded-lg border border-slate-300 bg-slate-50 p-2 text-slate-700 hover:bg-slate-100 transition-colors [&::-webkit-details-marker]:hidden">
                <MenuIcon className="w-5 h-5" />
              </summary>
              <div className="absolute right-0 top-full z-50 mt-2 min-w-[13rem] rounded-lg border border-slate-100 bg-white py-2 shadow-xl">
                {session?.user && (
                  <>
                    <Link
                      href="/dashboard"
                      className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 font-semibold border-b"
                    >
                      Dashboard
                    </Link>
                  </>
                )}
                <a href="#how-it-works" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">How it Works</a>
                <a href="#pricing" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Pricing</a>
                <a href="#trust-faq" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">FAQ</a>
                <Link href="/blog" className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Blog</Link>
              </div>
            </details>
            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="hidden sm:block text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                >
                  Dashboard
                </Link>
                <UserMenu name={session.user.name} email={session.user.email} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-sm bg-[#1c57a3] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#174a8c]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
