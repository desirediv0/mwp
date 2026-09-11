"use client";

import React from "react";
import Reveal from "@/components/ui/Reveal";
import { IconAward, IconLeaf, IconPackage, IconShield, IconTruck, IconHeadset } from "@tabler/icons-react";

const BADGES = [
  {
    icon: IconShield,
    title: "100% Authentic",
    description: "Every fragrance is sourced directly from our atelier, guaranteed genuine",
  },
  {
    icon: IconLeaf,
    title: "Premium Ingredients",
    description: "Finest natural ingredients sourced from the world's most renowned regions",
  },
  {
    icon: IconPackage,
    title: "Luxury Packaging",
    description: "Handcrafted presentation worthy of the fragrance inside",
  },
  {
    icon: IconTruck,
    title: "Fast Delivery",
    description: "Discreet, secure shipping with premium protective packaging",
  },
  {
    icon: IconHeadset,
    title: "Concierge Support",
    description: "Personal fragrance consultations with our expert team",
  },
  {
    icon: IconAward,
    title: "Artisan Craftsmanship",
    description: "Composed by master perfumers with decades of expertise",
  },
];

export default function TrustBadgesSection() {
  return (
    <section className="py-14 md:py-16  bg-white border-t border-line">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
        <Reveal>
          <div className="text-center mb-14 md:mb-18">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-4">Trust & Experience</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] text-noir tracking-tight leading-tight">
              The MWP Supplements <em className="italic text-gold-dark">Promise</em>
            </h2>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {BADGES.map(({ icon: Icon, title, description }, idx) => (
            <Reveal key={title} delay={idx * 0.06}>
              <div
                className="flex items-start gap-5 p-8 md:p-9 border border-line group hover:border-gold/40 transition-all duration-500 h-full"
                style={{ borderRadius: "8px" }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center flex-shrink-0 border border-gold/30 group-hover:border-gold/60 transition-colors duration-500"
                  style={{ borderRadius: "50%" }}
                >
                  <Icon className="h-5 w-5 text-gold" stroke={1.2} />
                </div>
                <div>
                  <h3 className="font-display text-[15px] text-noir mb-1.5 tracking-tight">{title}</h3>
                  <p className="text-[12px] text-stone leading-relaxed tracking-wide font-light">{description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
