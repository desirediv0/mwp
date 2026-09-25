"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

// Apple-style full-width dark hero banner at the top of the homepage,
// above the 6-product grid. Fills exactly one viewport below the sticky
// header (announcement bar 28px + main bar ~64-72px) — no scroll needed
// to see the whole hero. GSAP drives a cinematic entrance: background
// slow-zoom, staggered text reveal, CTA pop.
export default function MwpHomeHero() {
  const { t } = useLanguage();
  const rootRef = useRef(null);
  const bgRef = useRef(null);

  useEffect(() => {
    let ctx;
    let mounted = true;

    (async () => {
      const gsapModule = await import("gsap");
      if (!mounted) return;
      const gsap = gsapModule.default;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      ctx = gsap.context(() => {
        if (reduceMotion) {
          gsap.set("[data-hero-anim]", { opacity: 1, y: 0 });
          return;
        }

        // Slow background zoom-in — classic cinematic hero move.
        gsap.fromTo(
          bgRef.current,
          { scale: 1.12 },
          { scale: 1, duration: 2.4, ease: "power2.out" }
        );

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
        tl.fromTo(
          "[data-hero-eyebrow]",
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6 },
          0.15
        )
          .fromTo(
            "[data-hero-title]",
            { opacity: 0, y: 28, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: 0.85 },
            0.28
          )
          .fromTo(
            "[data-hero-sub]",
            { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: 0.6 },
            0.55
          )
          .fromTo(
            "[data-hero-cta]",
            { opacity: 0, y: 14, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.08 },
            0.7
          )
          .fromTo(
            "[data-hero-scroll]",
            { opacity: 0 },
            { opacity: 1, duration: 0.6 },
            1.1
          );
      }, rootRef);
    })();

    return () => {
      mounted = false;
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      className="relative w-full bg-black text-white overflow-hidden flex flex-col justify-between min-h-[calc(100svh-92px)] sm:min-h-[calc(100svh-100px)]"
    >
      <div ref={bgRef} className="absolute inset-0">
        <Image
          src="/mwp-hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover opacity-50"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.08),transparent_60%)]" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-white/[0.05] blur-[160px] rounded-full pointer-events-none" />

      <div className="relative z-10 flex-1 flex items-center justify-center max-w-6xl mx-auto px-6 py-8 w-full">
        <div className="text-center">
          <p
            data-hero-anim
            data-hero-eyebrow
            className="text-[11px] sm:text-xs uppercase tracking-[0.35em] text-white/50 font-semibold mb-3 opacity-0"
          >
            MWP Supplements
          </p>
          <h1
            data-hero-anim
            data-hero-title
            className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)] opacity-0"
          >
            Men &bull; Women &bull; Power.
          </h1>
          <p
            data-hero-anim
            data-hero-sub
            className="mt-3 text-sm sm:text-base md:text-lg text-white/60 max-w-xl mx-auto opacity-0"
          >
            Premium global wellness formulas, engineered for everyday performance.
          </p>

          <div className="mt-6 flex items-center justify-center gap-4 text-[15px]">
            <Link
              href="/products"
              data-hero-anim
              data-hero-cta
              className="bg-white text-black hover:bg-neutral-200 transition-colors rounded-full px-6 py-2.5 font-medium opacity-0"
            >
              {t("shopNow")}
            </Link>
            <Link
              href="/why-us"
              data-hero-anim
              data-hero-cta
              className="text-white hover:underline underline-offset-4 font-medium opacity-0"
            >
              Learn more
            </Link>
          </div>
        </div>
      </div>

      {/* scroll hint */}
      <div data-hero-anim data-hero-scroll className="relative z-10 flex justify-center pb-6 opacity-0">
        <div className="w-5 h-8 rounded-full border border-white/25 flex items-start justify-center p-1.5">
          <span className="w-1 h-1 rounded-full bg-white/70 animate-bounce" />
        </div>
      </div>
    </section>
  );
}
