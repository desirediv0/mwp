"use client";

import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";

export default function MwpFaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  const faqs = [
    {
      q: "What makes MWP ULTRA PRO different from typical testosterone boosters?",
      a: "MWP ULTRA PRO uses standardized, trademarked extracts with published clinical trials: KSM-66® Ashwagandha, PrimaVie® purified Himalayan Shilajit, and Testofen® Fenugreek. Unlike mass-market formulas using underdosed raw powder blends, ULTRA PRO delivers the exact therapeutic potencies shown to support natural free testosterone and male stamina.",
    },
    {
      q: "When is the best time to take POWER MAX pre-workout?",
      a: "Mix 1 scoop of POWER MAX in 250-300ml of cold water and consume 20-30 minutes before your workout or training session. For first-time users, we recommend starting with half a scoop to assess tolerance to the high-potency nitric oxide and focus matrix.",
    },
    {
      q: "How fast does RAPID BOOST work?",
      a: "RAPID BOOST is engineered with micro-encapsulated L-Arginine, bioavailable Citrulline, and BioPerine® absorption enhancers. Most athletes report enhanced blood flow, vascularity, and physical drive within 30 to 45 minutes of consumption.",
    },
    {
      q: "Can HER POWER and HER ENERGY be taken together as a stack?",
      a: "Yes! HER POWER focuses on hormonal balance, ovarian vitality, and female libido, while HER ENERGY provides clean, non-jittery adaptogens for all-day focus and alertness. They complement each other synergistically as a daily women's performance stack.",
    },
    {
      q: "Who should take DAILY BOOST?",
      a: "DAILY BOOST is designed for both men and women living an active lifestyle. With 32 bioavailable vitamins, chelated minerals, digestive enzymes, and antioxidant superfoods, it provides the essential nutritional foundation required for hard-training individuals.",
    },
    {
      q: "Are MWP Supplements lab tested and free from banned substances?",
      a: "Every batch of MWP Supplements undergoes rigorous third-party laboratory verification for potency, purity, microbiological safety, and heavy metals. Formulations are manufactured in GMP-certified and FSSAI-audited facilities with zero banned or adulterated ingredients.",
    },
  ];

  return (
    <section className="py-20 bg-[#09090b] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-widest font-bold text-neutral-900">
            Got Questions?
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight mt-2">
            FREQUENTLY ASKED QUESTIONS
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Everything you need to know about MWP dosage, safety, ingredient science, and stacks.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className=" border border-white/10 bg-white/[0.02] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base hover:text-neutral-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <IconChevronDown
                    className={`h-5 w-5 text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-neutral-900" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/[0.05]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
