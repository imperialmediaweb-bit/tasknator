import { Fragment } from "react";
import { ChevronRight } from "lucide-react";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-b border-slate-200/50 bg-[#fcfcfe] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-stretch gap-12 md:flex-row md:items-center md:justify-between md:gap-4 lg:gap-6">
          {[
            { n: "1", title: "Diagnose", desc: "Scan your systems" },
            { n: "2", title: "Analyze", desc: "Identify root causes" },
            { n: "3", title: "Recover", desc: "Get a recovery plan" },
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
