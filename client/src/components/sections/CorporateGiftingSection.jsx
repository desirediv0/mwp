"use client";

import Image from "next/image";
import Link from "next/link";
import { IconSparkles, IconArrowRight } from "@tabler/icons-react";
import Reveal from "@/components/ui/Reveal";

export default function CorporateGiftingSection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-[#F8F4FF] via-[#F2ECFF] to-[#ECE3FA] border-y border-[#E2D2FA]">
      {/* Background Glows */}
      <div 
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-50 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(214, 188, 250, 0.4) 0%, transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Side Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#B8976A]/40 bg-white/80 backdrop-blur-sm text-[#7048A0] text-xs font-semibold uppercase tracking-[0.25em] shadow-sm">
                <IconSparkles className="w-3.5 h-3.5 text-[#B8976A]" />
                Corporate Gifting
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-[#241738] tracking-tight leading-[1.08] font-normal">
                Corporate <em className="text-[#5B308C] italic">Gifting</em>
              </h2>
            </Reveal>

            {/* Thin Gold Divider Line */}
            <Reveal delay={0.15}>
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <span className="h-px w-12 bg-[#B8976A]" />
                <h3 className="text-xs sm:text-sm uppercase tracking-[0.3em] font-semibold text-[#825BB5]">
                  THROUGH THE LANGUAGE OF FRAGRANCE
                </h3>
                <span className="h-px w-12 bg-[#B8976A] hidden sm:block" />
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="text-base sm:text-lg text-[#4A3C60] font-light leading-relaxed max-w-xl mx-auto lg:mx-0">
                Personalized fragrances, signature brand scents, and memorable gifting experiences for employees, clients, and corporate milestones.
              </p>
            </Reveal>

            {/* Feature Chips */}
            <Reveal delay={0.25}>
              <div className="flex flex-wrap gap-2.5 justify-center lg:justify-start pt-2">
                {[
                  "Employee Appreciation",
                  "Client Gifting",
                  "Festival Hampers",
                  "Signature Company Fragrances"
                ].map((chip) => (
                  <span 
                    key={chip}
                    className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#D8C7F5] text-[#4A267A] text-xs font-medium rounded-full shadow-sm hover:border-[#B8976A] transition-all duration-300"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* CTA Button */}
            <Reveal delay={0.3}>
              <div className="pt-4">
                <Link
                  href="/corporate-gifting"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-[#4A2478] hover:bg-[#38195E] text-white text-xs uppercase tracking-[0.2em] font-medium rounded-full shadow-lg shadow-[#4A2478]/25 hover:shadow-xl transition-all duration-300 group"
                >
                  Explore Corporate Gifting
                  <IconArrowRight className="w-4 h-4 text-[#EAD5AB] group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Right Side Visual: Floating Perfume Bottle & Lavender Effects */}
          <div className="lg:col-span-5 relative flex justify-center">
            <Reveal delay={0.2}>
              <div className="relative w-full max-w-[380px] aspect-[4/5] rounded-3xl overflow-hidden p-6 bg-gradient-to-b from-white/90 via-white/50 to-[#FAF5FF]/80 border border-white shadow-2xl backdrop-blur-md">
                
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner group">
                  <Image
                    src="/mwpsupplements_gifting_box.png"
                    alt="MWP Supplements Luxury Corporate Perfume Gift Box"
                    fill
                    className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3C1A60]/60 via-transparent to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-white/85 backdrop-blur-md border border-white/60 shadow-lg text-center">
                    <span className="text-[10px] uppercase tracking-[0.25em] text-[#B8976A] font-bold block mb-1">
                      Bespoke Atelier Packaging
                    </span>
                    <p className="font-display text-xs text-[#2A1842] font-medium">
                      Custom Co-Branded Bottles & Gift Boxes
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

        </div>
      </div>
    </section>
  );
}
