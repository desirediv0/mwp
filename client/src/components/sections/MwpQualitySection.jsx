"use client";

import { IconShieldCheck, IconFlask, IconAward, IconChecklist, IconTruckDelivery, IconCertificate } from "@tabler/icons-react";

export default function MwpQualitySection() {
  const pillars = [
    {
      icon: IconFlask,
      title: "Standardized Active Extracts",
      desc: "We use trademarked and standardized botanicals (KSM-66®, PrimaVie®, Testofen®, BioPerine®) with guaranteed active marker concentrations.",
    },
    {
      icon: IconChecklist,
      title: "100% Label Transparency",
      desc: "No proprietary blends, hidden fillers, or mysterious complexes. You know the exact milligram dose of every single ingredient.",
    },
    {
      icon: IconCertificate,
      title: "GMP & FSSAI Certified",
      desc: "Manufactured in state-of-the-art facilities compliant with Good Manufacturing Practices and audited under stringent food safety norms.",
    },
    {
      icon: IconShieldCheck,
      title: "Third-Party Tested",
      desc: "Every batch is independently verified for potency, purity, microbiological safety, and heavy metal limits before release.",
    },
    {
      icon: IconAward,
      title: "Zero Banned Substances",
      desc: "Formulated specifically for athletes, gym-goers, and fitness enthusiasts adhering to clean sport standards.",
    },
    {
      icon: IconTruckDelivery,
      title: "Fast Express Shipping",
      desc: "Dispatched within 24-48 hours with tamper-proof security seals and temperature-controlled storage.",
    },
  ];

  return (
    <section className="py-20 bg-[#0c0c0e] text-white border-y border-white/[0.08] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs uppercase tracking-widest font-bold text-red-500">
            The MWP Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight uppercase mt-2">
            SCIENCE-BACKED FORMULATIONS &bull; UNCOMPROMISED QUALITY
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Sports nutrition and wellness built for athletes and fitness enthusiasts who refuse to settle for underdosed formulas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pillars.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-red-500/40 transition-colors duration-200"
              >
                <div className="w-12 h-12 rounded-lg bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-4">
                  <Icon className="h-6 w-6" stroke={2} />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-tight text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
