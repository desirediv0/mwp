"use client";

import Link from "next/link";
import { fetchApi } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  CORE_PRODUCTS,
  QUIZ_GOALS,
  matchCoreProduct,
} from "@/lib/mwp-content";
import {
  IconBolt,
  IconTarget,
  IconHeart,
  IconShieldCheck,
  IconArrowRight,
  IconRefresh,
} from "@tabler/icons-react";

const GOAL_ICONS = {
  bolt: IconBolt,
  zap: IconTarget,
  heart: IconHeart,
  shield: IconShieldCheck,
};

export default function FindYourFormulaPage() {
  const { t } = useLanguage();
  const [phase, setPhase] = useState("hero");
  const [goalId, setGoalId] = useState(null);
  const [products, setProducts] = useState([]);
  const [recommended, setRecommended] = useState(null);

  useEffect(() => {
    fetchApi("/public/products?limit=50")
      .then((res) => setProducts(res?.data?.products || []))
      .catch(() => setProducts([]));
  }, []);

  const start = () => {
    setPhase("quiz");
    setGoalId(null);
    setRecommended(null);
  };

  const answer = (id) => {
    setGoalId(id);
    const goal = QUIZ_GOALS.find((g) => g.id === id);
    const primary = goal?.productKeys?.[0] || "daily-vitality";
    const core = CORE_PRODUCTS.find((c) => c.key === primary) || CORE_PRODUCTS[5];
    const api = products.find((p) => {
      const hay = `${p.name} ${p.slug}`.toLowerCase().replace(/[™®]/g, "");
      return core.match.some((m) => hay.includes(m));
    });
    setRecommended({ core, api });
    setPhase("result");
  };

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#121216] via-[#0A0A0A] to-[#0A0508]" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[640px] h-[280px] bg-red-600/15 blur-[140px] rounded-full" />
        <div className="relative max-w-3xl mx-auto px-5 md:px-8 py-16 md:py-24 text-center">
          <nav className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/40 mb-6">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>/</span>
            <span className="text-white/80">Find Your Formula</span>
          </nav>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-5">
            <IconTarget className="h-3.5 w-3.5" /> Find Your MWP Formula
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            One Question. <span className="text-red-500">Right Formula.</span>
          </h1>
          <p className="text-white/60 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
            A short quiz that recommends the correct MWP product based on your goal — built for
            fast, confident buying decisions.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-5 md:px-8 py-14 md:py-20">
        {phase === "hero" && (
          <div className="text-center space-y-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-600/15 border border-red-500/30 flex items-center justify-center text-red-500">
              <IconTarget className="h-8 w-8" />
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              {t("findYourFormula")}
            </h2>
            <p className="text-white/55 max-w-md mx-auto text-sm">
              Tell us your primary goal. We&apos;ll match you with the MWP formula designed for it.
            </p>
            <button
              type="button"
              onClick={start}
              className="inline-flex items-center gap-2 h-12 px-8 bg-red-600 hover:bg-red-500 text-white text-[12px] font-black uppercase tracking-[0.18em] transition-colors"
            >
              {t("startQuiz")} <IconArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {phase === "quiz" && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-red-500 font-bold text-center mb-4">
              Question 1 / 1
            </p>
            <h2 className="text-2xl md:text-4xl font-extrabold text-center mb-10">
              {t("goalQuestion")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {QUIZ_GOALS.map((g) => {
                const Icon = GOAL_ICONS[g.icon] || IconShieldCheck;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => answer(g.id)}
                    className="group text-left p-6 rounded-xl bg-white/[0.03] border border-white/12 hover:border-red-500/50 hover:bg-white/[0.06] transition-all hover:-translate-y-1"
                  >
                    <div className="w-11 h-11 rounded-lg bg-red-600/10 border border-red-500/25 flex items-center justify-center text-red-500 mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="h-5.5 w-5.5" stroke={2} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-extrabold uppercase tracking-wide text-sm">
                        {t(g.labelKey)}
                      </span>
                      <IconArrowRight className="h-4 w-4 text-white/30 group-hover:text-red-400 transition-colors" />
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <button
                type="button"
                onClick={() => setPhase("hero")}
                className="text-[11px] uppercase tracking-widest text-white/40 hover:text-white font-bold inline-flex items-center gap-1.5"
              >
                <IconRefresh className="h-3.5 w-3.5" /> Back
              </button>
            </div>
          </div>
        )}

        {phase === "result" && recommended && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-red-500 font-bold text-center mb-3">
              {t("recommendedForYou")}
            </p>
            <div className="rounded-2xl border border-white/12 bg-white/[0.03] overflow-hidden">
              <div className="p-7 md:p-10 text-center">
                <p
                  className="text-[11px] font-black uppercase tracking-[0.25em] mb-3"
                  style={{ color: recommended.core.accent }}
                >
                  {recommended.core.headline}
                </p>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
                  {recommended.core.name}
                </h2>
                <p className="text-white/60 max-w-xl mx-auto text-sm leading-relaxed mb-6">
                  {recommended.core.focus}
                </p>
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {recommended.core.benefits.map((b) => (
                    <span
                      key={b}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.04] text-white/75"
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <p className="text-[12px] text-white/45 mb-8">
                  Signature ingredients: {recommended.core.signature}
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link
                    href={
                      recommended.api?.slug
                        ? `/products/${recommended.api.slug}`
                        : "/products"
                    }
                    className="inline-flex items-center gap-2 h-12 px-7 bg-red-600 hover:bg-red-500 text-white text-[12px] font-black uppercase tracking-[0.16em] transition-colors"
                  >
                    {t("shopNow")} <IconArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/products"
                    className="inline-flex items-center gap-2 h-12 px-7 border border-white/30 text-[12px] font-black uppercase tracking-[0.16em] hover:bg-white hover:text-black transition-colors"
                  >
                    {t("viewAll")}
                  </Link>
                  <button
                    type="button"
                    onClick={start}
                    className="inline-flex items-center gap-2 h-12 px-7 text-[12px] font-black uppercase tracking-[0.16em] text-white/60 hover:text-white transition-colors"
                  >
                    <IconRefresh className="h-4 w-4" /> {t("retake")}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/40 font-bold mb-4 text-center">
                Also consider
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {(QUIZ_GOALS.find((g) => g.id === goalId)?.productKeys || [])
                  .slice(1)
                  .map((key) => {
                    const core = CORE_PRODUCTS.find((c) => c.key === key);
                    if (!core) return null;
                    const api = products.find((p) => {
                      const hay = `${p.name} ${p.slug}`.toLowerCase();
                      return core.match.some((m) => hay.includes(m));
                    });
                    return (
                      <Link
                        key={key}
                        href={api?.slug ? `/products/${api.slug}` : "/products"}
                        className="p-4 rounded-lg bg-white/[0.03] border border-white/10 hover:border-red-500/40 transition-colors text-center"
                      >
                        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: core.accent }}>
                          {core.headline}
                        </p>
                        <p className="font-bold text-sm">{core.name}</p>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
