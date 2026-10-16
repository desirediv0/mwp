"use client";

import RevealText from "@/components/ui/reveal-text";
import { TRUST_CLAIMS } from "@/lib/trustClaims";

export default function MwpTrustReveal() {
  return (
    <section className="w-full bg-white px-6 py-10 sm:py-14">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.35em] text-neutral-500">
          The MWP Standard
        </p>

        <RevealText
          type="chars"
          gsapVars={{ x: -150 }}
          className="text-5xl font-bold leading-[1.05] tracking-tight text-neutral-900 sm:text-7xl md:text-8xl"
        >
          Proof before promises.
        </RevealText>

        <ul className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-2 text-left sm:grid-cols-3">
          {TRUST_CLAIMS.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 rounded-xl border border-green-700/15 bg-green-50/50 px-3 py-2 text-[12px] font-medium leading-tight text-neutral-800"
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-green-700 text-white">
                <svg viewBox="0 0 20 20" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10.5l4 4 8-9" />
                </svg>
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
