import Image from "next/image";
import { Check, AlertTriangle } from "lucide-react";

interface FeaturesProps {
  branding: {
    siteName: string;
  };
}

export function Features({ branding }: FeaturesProps) {
  return (
    <section id="features" className="bg-[#f8fafc] py-12 sm:py-24">
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
            <div className="relative z-10 flex flex-col justify-start lg:pt-12">
              <ul className="space-y-5">
                {[
                  "AI-powered diagnostics",
                  "Root cause analysis",
                  "Actionable recovery steps",
                  "Continuous optimization insights",
                ].map((item) => (
                  <li key={item} className="flex item gap-3.5">
                    <Check
                      className="mt-0.5 h-6 w-6 shrink-0 text-[#2f80ed]"
                      strokeWidth={2.75}
                      aria-hidden
                    />
                    <span className="text-xl font-medium leading-relaxed text-[#1c3d6e]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="relative z-20 mx-auto mt-8 w-full max-w-2xl rounded-xl border border-slate-200/90 bg-[#f4f6f8] p-4 shadow-md sm:p-5 lg:absolute lg:bottom-0 lg:left-[34%] lg:mt-0 lg:w-[min(66%,36rem)] lg:translate-y-[42%] lg:mx-0">
            <div className="flex gap-3">
              <AlertTriangle
                className="mt-0.5 h-5 w-5 shrink-0 text-amber-500"
                strokeWidth={2}
              />
              <p className="text-sm leading-relaxed text-slate-600">
                AI-generated insights may vary and are for informational purposes
                only. Not professional advice.
              </p>
            </div>
          </div>
        </div>
        <div className="h-6 sm:h-8 lg:h-10" aria-hidden />
      </div>
    </section>
  );
}
