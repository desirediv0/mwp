"use client";

import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";
import Reveal from "@/components/ui/Reveal";

const FAQS = [
  {
    q: "What makes MWP Ultra Pro different from typical testosterone boosters?",
    a: "Ultra Pro uses standardized, trademarked extracts with published clinical trials: KSM-66® Ashwagandha, PrimaVie® purified Himalayan Shilajit, and Testofen® Fenugreek. Unlike mass-market formulas built on underdosed raw-powder blends, Ultra Pro delivers the exact therapeutic potencies shown to support natural free testosterone and male stamina.",
  },
  {
    q: "When is the best time to take Power Max pre-workout?",
    a: "Mix 1 scoop of Power Max in 250–300 ml of cold water and consume 20–30 minutes before your workout. First-time users should start with half a scoop to assess tolerance to the high-potency nitric-oxide and focus matrix.",
  },
  {
    q: "How fast does Rapid Boost work?",
    a: "Rapid Boost is built with micro-encapsulated L-Arginine, bioavailable Citrulline, and BioPerine® absorption enhancers. Most athletes report enhanced blood flow, vascularity, and physical drive within 30 to 45 minutes.",
  },
  {
    q: "Can Her Power and Her Energy be taken together as a stack?",
    a: "Yes. Her Power focuses on hormonal balance, ovarian vitality, and female libido, while Her Energy provides clean, non-jittery adaptogens for all-day focus. They complement each other as a daily women's performance stack.",
  },
  {
    q: "Who should take Daily Boost?",
    a: "Daily Boost is designed for active men and women. With 32 bioavailable vitamins, chelated minerals, digestive enzymes, and antioxidant superfoods, it provides the nutritional foundation hard-training individuals need.",
  },
  {
    q: "Are MWP Supplements lab tested and free from banned substances?",
    a: "Every batch undergoes third-party laboratory verification for potency, purity, microbiological safety, and heavy metals. Formulations are manufactured in GMP-certified and FSSAI-audited facilities with zero banned or adulterated ingredients.",
  },
];

export default function HomeFaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="py-16 md:py-20 bg-white border-t border-gray-100">
      <div className="max-w-4xl mx-auto px-5 md:px-8 lg:px-10">
        <Reveal>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-red-500/40" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold">
                Got Questions?
              </span>
              <span className="h-px w-8 bg-red-500/40" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[44px] text-noir tracking-tight leading-tight font-extrabold">
              Frequently Asked <em className="italic text-red-500">Questions</em>
            </h2>
            <p className="text-[15px] text-stone mt-4 font-light">
              Everything you need to know about MWP dosage, safety, ingredient science, and stacks.
            </p>
          </div>
        </Reveal>

        <div className="space-y-3.5">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <Reveal key={idx} delay={0.04 * idx}>
                <div className="rounded-xl border border-gray-100 bg-[#fafafa] overflow-hidden">
                  <button
                    onClick={() => setOpenIdx(isOpen ? -1 : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-noir hover:text-red-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <IconChevronDown
                      className={`h-5 w-5 text-stone shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-red-500" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-[13.5px] sm:text-sm text-stone leading-relaxed border-t border-gray-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
