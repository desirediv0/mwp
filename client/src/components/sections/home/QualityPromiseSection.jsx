"use client";

import {
  IconShieldCheck,
  IconFlask,
  IconAward,
  IconChecklist,
  IconTruckDelivery,
  IconCertificate,
} from "@tabler/icons-react";
import Reveal from "@/components/ui/Reveal";

const PILLARS = [
  {
    icon: IconFlask,
    title: "Standardized Active Extracts",
    desc: "Trademarked, standardized botanicals (KSM-66®, PrimaVie®, Testofen®, BioPerine®) with guaranteed active-marker concentrations.",
  },
  {
    icon: IconChecklist,
    title: "100% Label Transparency",
    desc: "No proprietary blends, hidden fillers, or mystery complexes. Every ingredient's exact milligram dose is printed on the label.",
  },
  {
    icon: IconCertificate,
    title: "GMP & FSSAI Certified",
    desc: "Produced in facilities compliant with Good Manufacturing Practices and audited under stringent food-safety norms.",
  },
  {
    icon: IconShieldCheck,
    title: "Third-Party Tested",
    desc: "Every batch is independently verified for potency, purity, microbiological safety, and heavy-metal limits before release.",
  },
  {
    icon: IconAward,
    title: "Zero Banned Substances",
    desc: "Formulated for athletes, gym-goers, and fitness enthusiasts who adhere to clean-sport standards.",
  },
  {
    icon: IconTruckDelivery,
    title: "Fast Express Shipping",
    desc: "Dispatched within 24–48 hours with tamper-proof security seals and careful storage.",
  },
];

export default function QualityPromiseSection() {
  return (
    <section className="py-16 md:py-20 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-neutral-500/40" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-neutral-900 font-bold">
                The MWP Standard
              </span>
              <span className="h-px w-8 bg-neutral-500/40" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[44px] text-noir tracking-tight leading-tight font-extrabold">
              The MWP <em className="italic text-neutral-900">Promise</em>
            </h2>
            <p className="text-[15px] md:text-base text-stone mt-4 font-light leading-relaxed">
              Clinical-grade formulation standards behind every tub, bottle, and sachet we ship.
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.title} delay={0.05 * i}>
                <div className="h-full border border-gray-100 bg-[#fafafa] hover:bg-white hover:border-neutral-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 p-6 md:p-7">
                  <div className="w-12 h-12 bg-neutral-50 flex items-center justify-center mb-5">
                    <Icon className="h-6 w-6 text-neutral-900" stroke={1.75} />
                  </div>
                  <h3 className="text-base md:text-lg font-bold text-noir mb-2 tracking-tight">
                    {p.title}
                  </h3>
                  <p className="text-[13.5px] text-stone leading-relaxed font-light">
                    {p.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
