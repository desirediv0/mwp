"use client";

import Link from "next/link";
import Image from "next/image";
import {
  IconArrowRight,
  IconFlask,
  IconSparkles,
  IconGift,
  IconShieldCheck,
  IconLock,
  IconAward,
} from "@tabler/icons-react";
import Reveal from "@/components/ui/Reveal";

const steps = [
  { icon: IconFlask, title: "1. Choose", sub: "Your notes" },
  { icon: IconSparkles, title: "2. We Craft", sub: "Your blend" },
  { icon: IconGift, title: "3. You Receive", sub: "Your signature scent" },
];

const features = [
  { icon: IconAward, label: "Personalized for you" },
  { icon: IconShieldCheck, label: "Premium ingredients" },
  { icon: IconLock, label: "Your formula, always yours" },
  { icon: IconGift, label: "Luxury packaging" },
];

export default function CustomPerfumeSection() {
  return (
    <section className="relative overflow-hidden bg-[#F4EFE7] border-y border-line">
      {/* Leaf watermark — bottom left */}
      <div className="pointer-events-none absolute -bottom-10 -left-12 w-64 h-64 md:w-80 md:h-80 opacity-[0.06]">
        <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
          <path
            d="M100 10c-30 40-70 60-70 110 0 40 30 70 70 70s70-30 70-70c0-50-40-70-70-110z"
            fill="#8a6d3b"
          />
          <path d="M100 40v150M100 80l-34-20M100 110l-34-20M100 80l34-20M100 110l34-20" stroke="#F4EFE7" strokeWidth="3" />
        </svg>
      </div>

      {/* ── Hero ── */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pt-16 md:pt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <Reveal>
              <div>
                <span className="text-[11px] uppercase tracking-[0.32em] text-gold-dark font-medium block mb-6">
                  Bespoke Atelier
                </span>

                <h2 className="font-display text-[2.75rem] sm:text-6xl md:text-[4.25rem] text-noir tracking-tight leading-[1.02] mb-7">
                  Your Scent.
                  <br />
                  <em className="italic text-gold-dark">Your Story.</em>
                </h2>

                <div className="flex items-center gap-3 mb-7">
                  <span className="h-px w-20 bg-gold/40" />
                  <span className="w-1.5 h-1.5 rotate-45 bg-gold/60" />
                  <span className="h-px w-20 bg-gold/40" />
                </div>

                <p className="text-stone text-base md:text-lg leading-relaxed mb-9 font-light">
                  Handcrafted for you,
                  <br className="hidden sm:block" /> in every detail.
                </p>

                <Link
                  href="/custom-perfume"
                  className="inline-flex items-center gap-3 px-9 py-4 border border-gold text-noir text-[11px] font-medium tracking-[0.22em] uppercase rounded-full hover:bg-gold hover:text-noir transition-all duration-300"
                >
                  Create Your Perfume
                  <IconArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="relative max-w-md mx-auto lg:max-w-none">
                <div className="relative aspect-[4/5]">
                  <Image
                    src="/card1.jpeg"
                    alt="Custom bespoke perfume in a satin-lined presentation box"
                    fill
                    className="object-contain drop-shadow-[0_30px_45px_rgba(60,45,25,0.18)]"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Ivory arc under the hero */}
        <div
          className="absolute inset-x-0 bottom-0 h-24 md:h-32 bg-[#EFE7DA]"
          style={{ borderRadius: "100% 100% 0 0 / 100% 100% 0 0" }}
        />
      </div>

      {/* ── Lower band ── */}
      <div className="relative bg-[#EFE7DA]">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pb-20 md:pb-28 pt-4">
          {/* How it works */}
          <Reveal delay={0.1}>
            <div>
              <div className="flex items-center justify-center gap-3 mb-12">
                <span className="h-px w-12 bg-gold/40" />
                <span className="w-1.5 h-1.5 rotate-45 bg-gold/60" />
                <h3 className="font-display text-2xl md:text-[1.9rem] text-noir">How it works</h3>
                <span className="w-1.5 h-1.5 rotate-45 bg-gold/60" />
                <span className="h-px w-12 bg-gold/40" />
              </div>

              <div className="grid grid-cols-3 max-w-3xl mx-auto">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.title}
                      className={`flex flex-col items-center text-center px-2 md:px-4 ${
                        i > 0 ? "border-l border-gold/20" : ""
                      }`}
                    >
                      <Icon className="w-9 h-9 md:w-10 md:h-10 text-gold-dark mb-4" stroke={1.15} />
                      <p className="font-display text-[15px] md:text-lg text-noir">{step.title}</p>
                      <p className="text-[11px] md:text-sm text-stone mt-1.5">{step.sub}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Feature strip */}
          <Reveal delay={0.15}>
            <div className="mt-14 md:mt-16 border border-gold/25 rounded-[20px] bg-[#F4EFE7]/60 px-5 py-9 md:px-12 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-y-9 gap-x-6">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex flex-col items-center text-center">
                      <span className="w-14 h-14 rounded-full border border-gold/35 flex items-center justify-center mb-3.5">
                        <Icon className="w-5 h-5 text-gold-dark" stroke={1.3} />
                      </span>
                      <p className="text-[12px] md:text-[13px] text-noir/75 leading-snug max-w-[9rem]">
                        {f.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>

          {/* Bottom CTA */}
          <Reveal delay={0.2}>
            <div className="mt-16 md:mt-20 text-center">
              <p className="font-display text-[1.6rem] md:text-3xl text-noir mb-7">
                Ready to create yours?
              </p>
              <Link
                href="/custom-perfume"
                className="inline-flex items-center gap-3 px-11 py-4 bg-noir text-white text-[11px] font-medium tracking-[0.22em] uppercase rounded-full hover:bg-gold hover:text-noir transition-all duration-300"
              >
                Build Your Perfume
                <IconArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
