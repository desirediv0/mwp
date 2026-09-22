"use client";

import Image from "next/image";
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
    id: "extracts",
    tag: "PURITY & POTENCY",
    title: "Standardized Active Extracts",
    desc: "Trademarked, standardized botanicals (KSM-66®, PrimaVie®, Testofen®, BioPerine®) with guaranteed active-marker concentrations.",
    image: "/pillars/extracts.jpg",
    icon: IconFlask,
  },
  {
    id: "transparency",
    tag: "ZERO PROPRIETARY BLENDS",
    title: "100% Label Transparency",
    desc: "No proprietary blends, hidden fillers, or mystery complexes. Every ingredient's exact milligram dose is printed on the label.",
    image: "/pillars/transparency.jpg",
    icon: IconChecklist,
  },
  {
    id: "gmp",
    tag: "CERTIFIED COMPLIANCE",
    title: "GMP & FSSAI Certified",
    desc: "Produced in sterile facilities compliant with Good Manufacturing Practices and audited under stringent food-safety norms.",
    image: "/pillars/gmp.jpg",
    icon: IconCertificate,
  },
  {
    id: "labtest",
    tag: "INDEPENDENT AUDIT",
    title: "Third-Party Tested",
    desc: "Every batch is independently verified for potency, purity, microbiological safety, and heavy-metal limits before release.",
    image: "/pillars/labtest.jpg",
    icon: IconShieldCheck,
  },
  {
    id: "clean-sport",
    tag: "ATHLETE SAFE",
    title: "Zero Banned Substances",
    desc: "Formulated for competitive athletes, gym-goers, and fitness enthusiasts who adhere to clean-sport standards.",
    image: "/pillars/clean-sport.jpg",
    icon: IconAward,
  },
  {
    id: "shipping",
    tag: "EXPRESS LOGISTICS",
    title: "Fast Express Shipping",
    desc: "Dispatched within 24–48 hours with tamper-proof security seals, protective packaging, and climate-conscious storage.",
    image: "/pillars/shipping.jpg",
    icon: IconTruckDelivery,
  },
];

export default function QualityPromiseSection() {
  return (
    <section className="py-14 sm:py-20 bg-neutral-50/60 border-y border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
            <div className="inline-flex items-center justify-center gap-2.5 mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
              <span className="text-[11px] uppercase tracking-[0.28em] text-neutral-600 font-bold">
                The MWP Standard
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-neutral-950">
              The MWP <span className="italic font-serif text-neutral-800">Promise</span>
            </h2>
            <p className="mt-3 text-xs sm:text-sm md:text-base text-neutral-600 font-normal max-w-xl mx-auto leading-relaxed">
              Clinical-grade formulation standards behind every tub, bottle, and sachet we ship.
            </p>
          </div>
        </Reveal>

        {/* Responsive Grid: 3 columns desktop, 2 columns tablet, 1 column mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <Reveal key={p.id} delay={0.05 * i}>
                <div className="group h-full flex flex-col bg-white border border-gray-200/90 rounded-md overflow-hidden shadow-sm hover:shadow-xl hover:border-neutral-900 transition-all duration-300">
                  {/* High Definition Image Container */}
                  <div className="relative w-full aspect-[16/10] overflow-hidden bg-neutral-950">
                    <Image
                      src={p.image}
                      alt={p.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />

                    {/* Gradient overlay for contrast */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Category / Pillar Tag */}
                    <div className="absolute bottom-3 left-3 sm:bottom-3.5 sm:left-3.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded bg-black/75 backdrop-blur-md border border-white/20 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-white uppercase">
                        {p.tag}
                      </span>
                    </div>

                    {/* Floating Glass Icon Badge */}
                    <div className="absolute top-3 right-3 sm:top-3.5 sm:right-3.5 w-10 h-10 rounded-md bg-black/70 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow-md group-hover:bg-neutral-950 group-hover:scale-110 transition-all duration-300">
                      <Icon className="w-5 h-5 text-white" stroke={1.75} />
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 sm:p-6 flex flex-col flex-1 bg-white justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-neutral-950 uppercase tracking-tight mb-2 group-hover:text-neutral-800 transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-xs sm:text-[13.5px] text-neutral-600 font-normal leading-relaxed">
                        {p.desc}
                      </p>
                    </div>

                    {/* Bottom subtle indicator */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                      <span>MWP Verified</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
