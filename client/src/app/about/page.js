"use client";

import Link from "next/link";
import Image from "next/image";
import { IconFlame, IconShieldCheck, IconBolt, IconAward, IconCheck, IconArrowRight } from "@tabler/icons-react";

export default function AboutPage() {
  return (
    <main className="bg-[#09090b] text-white min-h-screen pt-28 pb-20 px-5 sm:px-8 lg:px-16 font-sans">
      <div className="max-w-6xl mx-auto space-y-24 md:space-y-32">
        {/* ── SECTION 1: MWP Origin & Mission ── */}
        <section className="pt-8">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold block">
              1. The MWP Genesis
            </span>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold uppercase leading-tight text-white">
              CRAFTED FOR <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">PEAK OUTPUT</span>, DRIVEN BY <span className="bg-gradient-to-r from-red-500 to-red-600 bg-clip-text text-transparent">INTEGRITY</span>
            </h1>

            <div className="w-20 h-1 bg-red-600 mx-auto my-6 rounded-full" />

            <p className="text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed font-normal text-justify sm:text-center">
              <strong>MWP SUPPLEMENTS</strong> was born from frustration with a sports nutrition market saturated with underdosed formulas, proprietary blends that hide active quantities, and generic claims. We believe high-performing individuals deserve clean, clinically validated nutrition engineered without compromise.
            </p>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-3xl mx-auto">
              Our name embodies our core triad: <strong>MEN</strong> (optimizing natural masculine vitality and testosterone support), <strong>WOMEN</strong> (empowering female hormonal balance and clean all-day vitality), and <strong>POWER</strong> (delivering explosive physical output, endurance, and everyday immunity).
            </p>
          </div>
        </section>

        {/* ── SECTION 2: The Triad ── */}
        <section className="border-t border-white/10 pt-20">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs uppercase tracking-[0.3em] text-red-500 font-bold block">
              2. OUR FOUNDATIONAL PILLARS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tight">
              MEN &bull; WOMEN &bull; POWER
            </h2>
            <p className="text-sm text-slate-400">
              Three specialized dimensions of human performance under one unified standard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-red-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-6">
                <IconFlame className="h-6 w-6" stroke={2} />
              </div>
              <h3 className="text-2xl font-black uppercase text-white mb-3">MEN</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Targeted formulations like <strong>ULTRA PRO</strong> and <strong>RAPID BOOST</strong> that stimulate natural testosterone production, male stamina, vascularity, and lean muscular recovery using clinically studied botanicals like Tongkat Ali and PrimaVie® Shilajit.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-rose-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-rose-600/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
                <IconShieldCheck className="h-6 w-6" stroke={2} />
              </div>
              <h3 className="text-2xl font-black uppercase text-white mb-3">WOMEN</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Empowering female wellness with <strong>HER POWER</strong> and <strong>HER ENERGY</strong>. Thoughtfully calibrated adaptogens and herbal cofactors (Organic Shatavari, Maca, Myo-Inositol, Vitex) supporting hormone harmony, intimate vitality, and non-crash daily focus.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-amber-500/40 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6">
                <IconBolt className="h-6 w-6" stroke={2} />
              </div>
              <h3 className="text-2xl font-black uppercase text-white mb-3">POWER</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Uncompromising high-output training and defense with <strong>POWER MAX</strong> pre-workout pumps and <strong>DAILY BOOST</strong> 32-in-1 multivitamins. Built to fuel your toughest workouts and fortify immune resilience 365 days a year.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Quality & Transparency Guarantee ── */}
        <section className="border-t border-white/10 pt-20">
          <div className="rounded-3xl bg-gradient-to-r from-[#141418] via-[#101014] to-[#141418] border border-white/10 p-8 sm:p-14">
            <div className="max-w-3xl">
              <span className="text-xs uppercase tracking-widest font-bold text-red-500 block mb-2">
                Uncompromised Manufacturing Standards
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-tight">
                THE MWP PURITY &amp; POTENCY PLEDGE
              </h2>
              <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
                Every batch produced for MWP SUPPLEMENTS is manufactured in certified GMP and FSSAI-compliant facilities under strict quality oversight. We conduct independent third-party laboratory assays to ensure heavy metal safety, absence of banned stimulants, and 100% active dose verification.
              </p>

              <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <IconCheck className="h-5 w-5 text-red-500 shrink-0" />
                  <span>No Proprietary Blends</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <IconCheck className="h-5 w-5 text-red-500 shrink-0" />
                  <span>Standardized Extracts</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <IconCheck className="h-5 w-5 text-red-500 shrink-0" />
                  <span>Third-Party Lab Tested</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <IconCheck className="h-5 w-5 text-red-500 shrink-0" />
                  <span>GMP Certified</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <IconCheck className="h-5 w-5 text-red-500 shrink-0" />
                  <span>FSSAI Compliant</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <IconCheck className="h-5 w-5 text-red-500 shrink-0" />
                  <span>Zero Banned Substances</span>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30"
                >
                  <span>Explore The 6 Formulations</span>
                  <IconArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
