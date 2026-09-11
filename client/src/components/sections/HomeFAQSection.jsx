"use client";

import { useState } from "react";
import Link from "next/link";
import { IconChevronDown, IconHelpCircle, IconArrowRight } from "@tabler/icons-react";
import Reveal from "@/components/ui/Reveal";

const FAQ_ITEMS = [
  {
    question: "How do I select the best perfume for my personality?",
    answer: "You can use our interactive Fragrance Finder tool on the website or choose based on scent families (Floral, Woody, Oriental, Fresh). Our customer support is also available for personalized consultations."
  },
  {
    question: "Are MWP SUPPLEMENTS fragrances long-lasting?",
    answer: "Yes, all MWP SUPPLEMENTS perfumes are formulated as high-concentration Eau de Parfum (EDP) and Extrait de Parfum, ensuring exceptional longevity of 8 to 14+ hours on skin and fabrics."
  },
  {
    question: "How does the Custom Perfume service work?",
    answer: "Our Custom Perfume service allows you to craft your own unique scent signature. You select your preferred top, middle, and base notes, bottle customization, and bottle engraving, creating a one-of-a-kind perfume."
  },
  {
    question: "What is your shipping and delivery timeline?",
    answer: "We offer complimentary standard shipping across India on eligible orders. Orders are typically dispatched within 24-48 hours and delivered within 3-5 business days."
  },
  {
    question: "Do you offer Corporate Gifting and Bulk Orders?",
    answer: "Yes! We specialize in premium luxury corporate gifts, complete with customized co-branding, personalized greeting notes, and elegant gift boxes."
  }
];

export default function HomeFAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleItem = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section className="py-16 md:py-24 bg-white border-t border-line">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <Reveal>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-gold/40 bg-gold/5 rounded-full text-gold text-xs uppercase tracking-[0.2em] mb-4">
              <IconHelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="font-display text-3xl sm:text-4xl text-noir tracking-tight">
              FAQ
            </h2>
            <p className="text-stone text-sm mt-3 font-light">
              Everything you need to know about our products and services
            </p>
          </div>
        </Reveal>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <Reveal key={idx} delay={idx * 0.05}>
                <div 
                  className="border border-line rounded-lg overflow-hidden transition-colors"
                  style={{ borderColor: isOpen ? "#B8976A" : "#EAEAEA" }}
                >
                  <button
                    onClick={() => toggleItem(idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left gap-4 bg-white hover:bg-ivory/50 transition-colors"
                  >
                    <span className="font-display text-base text-noir font-medium">
                      {item.question}
                    </span>
                    <IconChevronDown
                      className={`w-5 h-5 text-gold shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-stone text-sm leading-relaxed font-light border-t border-line/40 pt-4">
                      {item.answer}
                    </div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/faqs"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.15em] font-medium text-noir hover:text-gold transition-colors"
          >
            View All FAQs
            <IconArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
