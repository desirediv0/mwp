"use client";

import Link from "next/link";
import Image from "next/image";
import { IconArrowRight, IconFlask, IconLeaf, IconClock, IconPackage, IconGlass, IconStar } from "@tabler/icons-react";
import Reveal from "@/components/ui/Reveal";

const REASONS = [
  {
    icon: IconFlask,
    title: "Crafted by Master Perfumers",
    description: "Each fragrance is composed by skilled noses who understand the art of balancing rare notes into harmonious creations.",
  },
  {
    icon: IconLeaf,
    title: "Premium Natural Ingredients",
    description: "We source the finest ingredients — from French lavender fields to Indian oud — ensuring authenticity in every drop.",
  },
  {
    icon: IconClock,
    title: "Long Lasting Performance",
    description: "Our fragrances are engineered to evolve gracefully throughout the day, leaving a lasting yet refined impression.",
  },
  {
    icon: IconPackage,
    title: "Luxury Packaging",
    description: "Every bottle arrives in handcrafted packaging worthy of the fragrance inside — an unboxing experience designed to delight.",
  },
  {
    icon: IconGlass,
    title: "Made for Memorable Evenings",
    description: "From candlelit dinners to rooftop celebrations, our scents are designed to elevate life's most intimate moments.",
  },
  {
    icon: IconStar,
    title: "A Signature Statement",
    description: "More than fragrance — an expression of identity. Our creations help you leave a lasting impression without saying a word.",
  },
];

export const WhyBuySection = () => {
  return (
    <section className="overflow-hidden">
      {/* Hero Banner */}
      <div className="relative h-[50vh] md:h-[60vh] lg:h-[70vh]">
        <Image
          src="/why-mwpsupplements.jpg"
          alt="Why MWP SUPPLEMENTS"
          fill
          className="object-cover"
          priority
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to right, rgba(17,17,17,0.92) 0%, rgba(17,17,17,0.6) 50%, rgba(17,17,17,0.2) 100%)" }}
        />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 w-full">
            <Reveal>
              <div className="max-w-xl">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-5">
                  The MWP SUPPLEMENTS Promise
                </span>
                <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] text-white leading-[1.08] mb-6 tracking-tight">
                  Why choose <br className="hidden md:block" />
                  <em className="italic text-gold-dark">the maison</em>
                </h2>
                <p className="text-[14px] md:text-[15px] text-white/50 leading-relaxed mb-10 max-w-md font-light">
                  We don&apos;t just create fragrances — we craft intimate experiences. Every note, every blend, every bottle reflects our devotion to the art of perfumery.
                </p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2.5 bg-white text-noir px-8 py-4 text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-gold hover:text-white transition-colors duration-500"
                  style={{ borderRadius: "8px" }}
                >
                  Shop the Collection
                  <IconArrowRight className="h-4 w-4" stroke={1.5} />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Reasons Grid */}
      <div className="py-14 md:py-16  bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
          <Reveal>
            <div className="text-center mb-14 md:mb-18">
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-4">Why MWP SUPPLEMENTS</span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] text-noir tracking-tight leading-tight">
                The Art of <em className="italic text-gold-dark">Exceptional</em> Fragrance
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {REASONS.map((reason, idx) => (
              <Reveal key={reason.title} delay={idx * 0.06}>
                <div
                  className="p-8 md:p-10 border border-line group hover:border-gold/40 transition-all duration-500 h-full"
                  style={{ borderRadius: "8px" }}
                >
                  <reason.icon
                    className="h-7 w-7 text-gold mb-6 transition-transform duration-500 group-hover:-translate-y-0.5"
                    stroke={1.2}
                  />
                  <h3 className="font-display text-[17px] text-noir mb-3 tracking-tight">
                    {reason.title}
                  </h3>
                  <p className="text-[13px] text-stone leading-relaxed font-light tracking-wide">
                    {reason.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyBuySection;
