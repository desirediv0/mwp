"use client";

import Link from "next/link";
import Image from "next/image";
import { Reveal } from "@/components/ui/Reveal";
import {
  IconArrowRight,
  IconShieldCheck,
  IconFlask2,
  IconHeartHandshake,
} from "@tabler/icons-react";

const PILLARS = [
  {
    icon: IconShieldCheck,
    title: "Why MWP Started",
    body: "MWP began from one simple frustration: the market was full of underdosed blends, hidden actives and loud promises. We wanted formulas a customer could read, trust and feel — nothing hidden behind a proprietary blend.",
  },
  {
    icon: IconFlask2,
    title: "The Brand Mission",
    body: "Men • Women • Power. Three audiences, one uncompromising standard. Deliver clinically meaningful doses, transparent labels and premium experiences — so every person can choose the right formula with confidence.",
  },
  {
    icon: IconHeartHandshake,
    title: "The Quality Promise",
    body: "Every batch is built for proof, not slogans: GMP manufacturing, third-party lab testing, COA documentation, heavy-metal and microbial screening, and ingredient source verification you can actually open and read.",
  },
];

export default function FounderLetterPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#121216] via-[#0A0A0A] to-[#0A0508]" />
        <div className="absolute -top-20 right-0 w-[420px] h-[420px] bg-red-600/15 blur-[140px] rounded-full" />
        <div className="relative max-w-4xl mx-auto px-5 md:px-8 py-16 md:py-24 text-center">
          <nav className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/40 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white/80">Founder Letter</span>
          </nav>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500 mb-4">
            A Personal Note
          </p>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6">
            A Letter From <span className="text-red-500">Our Founder</span>
          </h1>
          <div className="w-16 h-0.5 bg-red-600 mx-auto" />
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <Reveal>
          <div className="space-y-6 text-[15px] sm:text-base leading-relaxed text-white/75">
            <p className="text-lg sm:text-xl text-white font-medium leading-relaxed">
              When we named this brand <strong className="text-red-400">MEN • WOMEN • POWER</strong>,
              we were not chasing a slogan. We were drawing a line.
            </p>
            <p>
              Too many supplements ask you to trust the packaging and skip the facts. Proprietary
              blends hide the dose. Stock photos replace real ingredients. Certificates never leave
              the warehouse. That is not how trust is built — and trust is the only thing that
              lasts in wellness.
            </p>
            <p>
              MWP SUPPLEMENTS exists for people who want performance without compromise: natural
              vitality for men, hormonal balance and daily energy for women, and daily wellness
              formulas that respect age, science and real life. Every formula starts with a clear
              purpose, honest ingredient choices, and doses that belong on the label — not in a
              footnote.
            </p>
            <p>
              We manufacture under GMP standards, test through independent laboratories, and open
              our quality story through the MWP Certificate Wall. Scan a bottle. Read the COA.
              Verify the batch. If we ask for your confidence, we will show you the proof first.
            </p>
            <p>
              This is a brand built for results you can feel and standards you can check. If that
              is the standard you hold yourself to — you are exactly who we built MWP for.
            </p>
            <p className="pt-4 text-white font-semibold">
              With respect and resolve,
              <br />
              <span className="text-red-400">Founder, MWP SUPPLEMENTS</span>
              <br />
              <span className="text-[12px] font-normal text-white/45 uppercase tracking-[0.2em]">
                Men • Women • Power
              </span>
            </p>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-white/10 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-red-500 mb-3">
              What We Stand On
            </p>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Mission &amp; Quality Promise
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PILLARS.map(({ icon: Icon, title, body }) => (
              <Reveal key={title}>
                <div className="h-full p-7 rounded-xl bg-[#0C0C0E] border border-white/10 hover:border-red-500/35 transition-colors">
                  <div className="w-11 h-11 rounded-lg bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-5">
                    <Icon className="h-5.5 w-5.5" stroke={2} />
                  </div>
                  <h3 className="font-extrabold uppercase tracking-wide text-sm mb-3">{title}</h3>
                  <p className="text-[13.5px] text-white/60 leading-relaxed">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-12">
            <Link
              href="/certificates"
              className="inline-flex items-center gap-2 h-12 px-6 bg-white text-black text-[11px] font-black uppercase tracking-[0.18em] hover:bg-neutral-200 transition-colors"
            >
              Certificate Wall <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 h-12 px-6 border border-white/30 text-[11px] font-black uppercase tracking-[0.18em] hover:bg-white hover:text-black transition-colors"
            >
              Explore Formulas
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
