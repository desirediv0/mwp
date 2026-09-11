"use client";

import Link from "next/link";
import { IconArrowRight } from "@tabler/icons-react";
import Reveal from "@/components/ui/Reveal";

export default function FragranceFinderSection() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden text-white">
      {/* Emerald gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 15% 10%, #1f5e50 0%, transparent 55%), radial-gradient(circle at 85% 90%, #14483d 0%, transparent 55%), linear-gradient(160deg, #0c3a31 0%, #082923 55%, #061d19 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% 40%, rgba(184, 151, 106, 0.28) 0%, transparent 65%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 relative z-10">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center px-6 py-2 border border-white/30 rounded-full text-white text-xs uppercase tracking-[0.25em] mb-8">
              Scent Discovery
            </div>

            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight leading-[1.05] mb-6">
              Find Your
              <br />
              <em className="italic text-gold">Signature Scent</em>
            </h2>
            <span className="block w-24 h-px bg-gold/60 mx-auto mb-8" />

            <p className="text-white/75 text-base md:text-lg font-light leading-relaxed mb-10 max-w-xl mx-auto">
              Choose what fits your identity with a quick quiz to match you with
              your <span className="text-gold font-medium">perfect fragrance</span>.
            </p>

            {/* Stat row */}
            <div className="flex items-stretch justify-center gap-0 mb-10 max-w-md mx-auto">
              {[
                { top: "2 mins", bottom: "Only" },
                { top: "Made for", bottom: "You" },
                { top: "Love your", bottom: "Scent" },
              ].map((stat, i) => (
                <div
                  key={stat.top}
                  className={`flex-1 px-4 ${i > 0 ? "border-l border-white/15" : ""}`}
                >
                  <p className="font-display italic text-lg md:text-xl text-white leading-tight">
                    {stat.top}
                  </p>
                  <p className="text-[11px] md:text-xs text-white/60 tracking-wide mt-1">
                    {stat.bottom}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col items-center gap-5">
              <Link
                href="/fragrance-finder"
                className="inline-flex items-center justify-center gap-3 px-10 py-4 border border-gold text-white text-xs font-medium tracking-[0.25em] uppercase rounded-full hover:bg-gold hover:text-noir transition-all duration-300 w-full sm:w-auto"
              >
                Take Quiz
                <IconArrowRight className="w-4 h-4" />
              </Link>

              <p className="font-display italic text-white/70 text-sm">
                Let&apos;s find your scent
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
