"use client";

import Link from "next/link";
import { IconFlame, IconBolt, IconHeartHandshake, IconSparkles, IconShield, IconArrowRight, IconShoppingCart } from "@tabler/icons-react";

export const MWP_PLAYBOOK_PRODUCTS = [
  {
    id: "ultra-pro",
    name: "ULTRA PRO",
    category: "Men's Performance",
    badge: "Best Seller",
    badgeColor: "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
    tagline: "Natural Testosterone, Stamina & Male Vitality Booster",
    actives: ["Tongkat Ali (Standardized)", "PrimaVie® Shilajit", "KSM-66® Ashwagandha", "Testofen® Fenugreek", "Boron + Zinc"],
    servings: "60 Veg Capsules",
    price: 2499,
    mrp: 3499,
    slug: "ultra-pro-mens-performance",
    icon: IconFlame,
    accentBorder: "hover:border-neutral-500/50",
    glow: "group-hover:shadow-[0_0_30px_rgba(23,23,23,0.25)]",
  },
  {
    id: "power-max",
    name: "POWER MAX",
    category: "Workout & Gym Performance",
    badge: "High Stimulant",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    tagline: "Explosive Pre-Workout & Nitric Oxide Muscle Pump",
    actives: ["L-Citrulline Malate 2:1", "Beta-Alanine", "L-Arginine AAKG", "Clean Caffeine & Theanine", "Electrolyte Matrix"],
    servings: "30 Servings (300g)",
    price: 1999,
    mrp: 2999,
    slug: "power-max-workout-gym-performance",
    icon: IconBolt,
    accentBorder: "hover:border-amber-500/50",
    glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.25)]",
  },
  {
    id: "rapid-boost",
    name: "RAPID BOOST",
    category: "Fast Performance",
    badge: "Fast Acting",
    badgeColor: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    tagline: "Rapid Circulation Surge, Nitric Expansion & Drive",
    actives: ["Micro-L-Arginine", "Standardized Beetroot Nitrate", "Korean Red Ginseng", "BioPerine® Piperine", "Fast Absorption System"],
    servings: "30 Fast-Acting Capsules",
    price: 2199,
    mrp: 3199,
    slug: "rapid-boost-fast-performance",
    icon: IconBolt,
    accentBorder: "hover:border-cyan-500/50",
    glow: "group-hover:shadow-[0_0_30px_rgba(6,182,212,0.25)]",
  },
  {
    id: "her-power",
    name: "HER POWER",
    category: "Women's Wellness",
    badge: "Hormone Harmony",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    tagline: "Female Libido, Hormone Balance & Vitality",
    actives: ["Organic Shatavari", "Yellow Maca Root", "Myo & D-Chiro Inositol (40:1)", "Vitex Chasteberry", "Sensoril® Ashwagandha"],
    servings: "60 Veg Capsules",
    price: 2299,
    mrp: 3299,
    slug: "her-power-womens-wellness",
    icon: IconHeartHandshake,
    accentBorder: "hover:border-rose-500/50",
    glow: "group-hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]",
  },
  {
    id: "her-energy",
    name: "HER ENERGY",
    category: "Energy + Focus",
    badge: "Clean Focus",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    tagline: "All-Day Mental Clarity, Adaptogens & Non-Crash Stamina",
    actives: ["Rhodiola Rosea", "Cordyceps Mushroom", "Holy Basil (Tulsi)", "Bacopa Monnieri", "Methylated B-Complex"],
    servings: "60 Veg Capsules",
    price: 1899,
    mrp: 2799,
    slug: "her-energy-energy-focus",
    icon: IconSparkles,
    accentBorder: "hover:border-emerald-500/50",
    glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]",
  },
  {
    id: "daily-boost",
    name: "DAILY BOOST",
    category: "Daily Wellness",
    badge: "Daily Essential",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    tagline: "32-in-1 Daily Multivitamin, Immunity & Antioxidant Shield",
    actives: ["Complete Vitamins A to K2-MK7", "Chelated Zinc Bisglycinate", "Elderberry & Curcumin", "Antioxidant Superfoods", "Probiotic Enzymes"],
    servings: "60 Tablets",
    price: 1499,
    mrp: 2199,
    slug: "daily-boost-daily-wellness",
    icon: IconShield,
    accentBorder: "hover:border-blue-500/50",
    glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]",
  },
];

export default function MwpPlaybookSection() {
  return (
    <section className="py-20 bg-[#09090b] text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-neutral-600/10 border border-neutral-500/30 text-xs font-bold uppercase tracking-wider text-neutral-400 mb-4">
            CLINICAL PERFORMANCE LINE-UP
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight">
            THE MWP <span className="bg-gradient-to-r from-neutral-600 via-neutral-400 to-neutral-600 bg-clip-text text-transparent">FLAGSHIP FORMULATIONS</span>
          </h2>
          <p className="mt-4 text-base text-slate-300">
            Formulated with clinically validated doses, pure standardized botanicals, and zero banned substances. Built for athletes who demand real physiological power.
          </p>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {MWP_PLAYBOOK_PRODUCTS.map((prod) => {
            const Icon = prod.icon;
            return (
              <div
                key={prod.id}
                className={`group relative bg-gradient-to-b from-[#141418] to-[#0c0c0e] border border-white/10 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 ${prod.accentBorder} ${prod.glow}`}
              >
                {/* Top Row: Category + Badge */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                      {prod.category}
                    </span>
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 border ${prod.badgeColor}`}>
                      {prod.badge}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-3 mb-2">
                    <div className="p-2.5 bg-white/[0.06] border border-white/10 text-white shrink-0 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-6 w-6 text-neutral-900" stroke={2} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black tracking-tight text-white uppercase group-hover:text-neutral-400 transition-colors">
                        {prod.name}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {prod.servings}
                      </p>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="text-sm font-medium text-slate-200 mt-3 line-clamp-2 leading-snug">
                    {prod.tagline}
                  </p>

                  {/* Actives List */}
                  <div className="mt-5 pt-4 border-t border-white/[0.08]">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mb-2">
                      Key Clinically Dosed Actives:
                    </div>
                    <ul className="space-y-1.5">
                      {prod.actives.map((act, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-neutral-900 shrink-0" />
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Row: Pricing & Action CTA */}
                <div className="mt-8 pt-5 border-t border-white/10">
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-2xl font-extrabold text-white">₹{prod.price.toLocaleString("en-IN")}</span>
                      <span className="text-xs text-slate-500 line-through ml-2">₹{prod.mrp.toLocaleString("en-IN")}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                      Save ₹{(prod.mrp - prod.price).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/products`}
                      className="w-full py-2.5 px-3 bg-white/[0.08] hover:bg-white/15 text-white text-xs font-bold uppercase tracking-wider text-center transition-colors border border-white/10"
                    >
                      Learn More
                    </Link>
                    <Link
                      href={`/products`}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-neutral-900 to-neutral-800 hover:from-neutral-800 hover:to-neutral-700 text-white text-xs font-bold uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1.5 shadow-md shadow-neutral-900/30"
                    >
                      <IconShoppingCart className="h-3.5 w-3.5" />
                      Buy Now
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Playbook Golden Keywords Bottom Banner */}
        <div className="mt-16 bg-gradient-to-r from-neutral-950 via-[#141418] to-neutral-950 border border-white/10 p-8 text-center">
          <h4 className="text-lg font-bold uppercase tracking-wide text-white">
            TARGETED PHYSIOLOGICAL PERFORMANCE PROTOCOLS
          </h4>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mt-2">
            Targeting Natural Testosterone, Peak Male Vitality, Nitric Oxide Blood Flow, Explosive Muscle Pumps, Women&apos;s Hormone Balance, and Daily Immune Nutrition.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
            {["Testosterone Booster", "Male Vitality", "Pre Workout", "Nitric Oxide", "Blood Flow", "Muscle Pump", "Women's Libido", "Hormone Balance", "Adaptogens", "Immune Support"].map((kw, i) => (
              <span key={i} className="text-[11px] font-medium px-3 py-1 bg-white/[0.04] border border-white/10 text-slate-300">
                #{kw}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
