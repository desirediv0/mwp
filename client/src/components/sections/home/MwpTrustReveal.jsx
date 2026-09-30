"use client";

import RevealText from "@/components/ui/reveal-text";

export default function MwpTrustReveal() {
  return (
    <section className="w-full bg-[#f5f4f3] px-6 py-24 sm:py-32">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="mb-6 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
          The MWP Standard
        </p>

        <RevealText
          type="chars"
          gsapVars={{ x: -150 }}
          className="text-5xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-7xl md:text-8xl"
        >
          Proof before promises.
        </RevealText>

        <RevealText
          type="lines"
          gsapVars={{ delay: 0.5 }}
          className="mt-8 max-w-2xl overflow-hidden text-base leading-relaxed text-neutral-600 sm:text-lg"
        >
          Every MWP formula is clinically dosed, made in a GMP-certified facility and lab tested
          for purity. Scan the QR on any pack to verify it is genuine.
        </RevealText>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-neutral-700">
          {["GMP Certified", "Lab Tested", "QR Verified"].map((item) => (
            <span key={item} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#C9A227]" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
