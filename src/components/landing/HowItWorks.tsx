import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-b border-slate-200/50 bg-[#fcfcfe] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold sm:text-4xl">Diagnose. Optimize. Recover. Instantly with AI</h2>
          <p className="text-lg font-medium text-[#777c83]">Recovra helps businesses understand why they are underperforming and provides a structured recovery plan powered by AI. In seconds.</p>
        </div>
        <div className="flex flex-col items-stretch gap-12 md:flex-row md:items-center md:justify-between md:gap-4 lg:gap-6">
          {[
            { n: "1", title: "Diagnose", desc: "You provide your business details and website URL, and our AI analyzes everything to generate a scorecard across 6 categories." },
            { n: "2", title: "Analyze", desc: "Recovra scans your system in real time to identify hidden issues and inefficiencies and pinpoints the root cause." },
            { n: "3", title: "Recover", desc: "Get a prioritized 30/60/90-day repair plan with ready-to-use marketing assets (copy, ad scripts, email sequences, and more)." },
          ].map((step, i) => (
            <Fragment key={step.title}>
              <div className="flex flex-1 items-center gap-4 md:min-w-0">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-transparent text-3xl font-bold text-[#254078]"
                  aria-hidden shadow-lg
                >
                  {step.n}
                </div>
                <div className="min-w-0 text-left">
                  <div className="text-2xl font-semibold text-black">
                    {step.title}
                  </div>
                  <div className="mt-0.5 text-base font-medium text-[#777c83]">
                    {step.desc}
                  </div>
                </div>
              </div>
              {i < 2 && (
                <ChevronRight
                  className="hidden h-8 w-8 shrink-0 text-slate-400 md:block lg:h-9 lg:w-9"
                  strokeWidth={1.5}
                  aria-hidden
                />
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
