"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { IconArrowRight, IconArrowNarrowDown } from "@tabler/icons-react";

/* 3D scene is browser-only — never render it on the server */
const Hero3DScene = dynamic(() => import("./Hero3DScene"), { ssr: false });

function normalizeSlide(slide) {
  return {
    title: slide.title || slide.headline || "",
    subtitle: slide.subtitle || slide.subheadline || "",
    ctaLink: slide.ctaLink || slide.link || "/products",
  };
}

function bannerToSlide(banner) {
  return normalizeSlide({
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    ctaLink: banner.link || "/products",
  });
}

const FALLBACK_SLIDES = [
  {
    title: "The Future of Fashion",
    subtitle:
      "Premium imported pieces, reimagined — clothing, handbags, footwear and accessories for those who move ahead of the curve.",
    ctaLink: "/products",
  },
  {
    title: "Carry Tomorrow",
    subtitle:
      "A curated maison where craft meets the avant-garde. Discover pieces designed to be remembered.",
    ctaLink: "/products",
  },
];

function splitTitle(title = "") {
  const words = title.trim().split(/\s+/);
  if (words.length < 3) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

const lineReveal = {
  hidden: { y: "115%", rotate: 2 },
  visible: (i) => ({
    y: "0%",
    rotate: 0,
    transition: { duration: 1, delay: 0.35 + i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HeroSection3D() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [current, setCurrent] = useState(0);
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState("high");

  const sectionRef = useRef(null);
  const scrollRef = useRef(0); // 0→1 progress fed into the 3D scene (no re-render)
  const pointerRef = useRef({ x: 0, y: 0 });

  /* Scroll progress across the hero → drives DOM parallax + 3D */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-45%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const copyBlur = useTransform(scrollYProgress, [0, 0.6], [0, 8]);
  const filter = useTransform(copyBlur, (b) => `blur(${b}px)`);

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      scrollRef.current = v;
    });
    return () => unsub();
  }, [scrollYProgress]);

  /* Perf tier — lighter scene on small / low-core devices */
  useEffect(() => {
    const small = window.innerWidth < 768;
    const lowCore = (navigator.hardwareConcurrency || 8) <= 4;
    setQuality(small || lowCore ? "low" : "high");
  }, []);

  /* Pointer parallax (desktop) */
  useEffect(() => {
    if (reduceMotion) return;
    const onMove = (e) => {
      pointerRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [reduceMotion]);

  /* Banner copy (same source as the classic hero) */
  useEffect(() => {
    let alive = true;
    fetchApi("/public/banners")
      .then((res) => {
        const arr = res?.data?.banners;
        if (alive && Array.isArray(arr) && arr.length > 0) {
          setSlides(arr.map(bannerToSlide));
        }
      })
      .catch(() => { });
    return () => {
      alive = false;
    };
  }, []);

  /* Rotate the headline copy */
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 6500);
    return () => clearInterval(t);
  }, [slides.length]);

  const active = slides[current] || slides[0];

  return (
    <section
      ref={sectionRef}
      className="relative w-full h-[100svh] md:h-screen overflow-hidden bg-noir text-ivory"
    >
      {/* Branded aurora gradient — always present behind the canvas so the
          hero is never a blank void before/if WebGL paints */}
      <div className="absolute inset-0 z-0 bg-hero-dark" aria-hidden="true" />

      {/* ── 3D canvas layer ── */}
      <div className="absolute inset-0 z-0">
        {!reduceMotion && (
          <Hero3DScene
            scrollRef={scrollRef}
            pointerRef={pointerRef}
            quality={quality}
          />
        )}
      </div>

      {/* Grain + hairline frame */}
      <div className="absolute inset-0 z-[1] pointer-events-none luxe-grain" aria-hidden="true" />
      <div
        className="absolute inset-3 md:inset-5 border border-white/15 pointer-events-none z-[2] hidden sm:block"
        aria-hidden="true"
      />

      {/* Loading shimmer until Canvas mounts */}
      <AnimatePresence>
        {!ready && (
          <motion.div
            className="absolute inset-0 z-[2] flex items-center justify-center bg-noir pointer-events-none"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            onAnimationComplete={() => setReady(true)}
            aria-hidden="true"
          >
            <span className="font-display italic text-2xl text-white/40">MWP Supplements</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vertical side label */}
      <div
        className="absolute right-6 top-1/2 -translate-y-1/2 z-20 hidden xl:block pointer-events-none"
        aria-hidden="true"
      >
        <span className="block text-[9px] uppercase tracking-[0.6em] text-white/35 [writing-mode:vertical-rl]">
          Bags · Clothing · Accessories — Est. MMXXV
        </span>
      </div>

      {/* ── Editorial overlay ── */}
      <motion.div
        style={reduceMotion ? undefined : { y: copyY, opacity: copyOpacity, filter }}
        className="relative z-10 h-full flex items-center pointer-events-none"
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="max-w-2xl pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="flex items-center gap-4 mb-6"
              >
                <span className="block h-px w-10 bg-gradient-to-r from-gold to-azure" />
                <span className="luxe-eyebrow-dark">MWP Supplements — Future Atelier</span>
              </motion.div>

              <h1 className="font-display font-medium text-[2.6rem] leading-[1.04] sm:text-6xl md:text-7xl lg:text-[5.4rem] tracking-tight mb-6 text-ivory drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)]">
                {splitTitle(active.title).map((line, i) => (
                  <span key={i} className="block overflow-hidden pb-1 -mb-1">
                    <motion.span custom={i} variants={lineReveal} className="block">
                      {i === 1 ? (
                        <em className="luxe-italic text-gradient-light">{line}</em>
                      ) : (
                        line
                      )}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.75 }}
                className="text-sm sm:text-[15px] text-white/70 font-light leading-relaxed tracking-wide mb-10 max-w-md"
              >
                {active.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="flex flex-wrap gap-4"
              >
                <button
                  onClick={() => router.push(active.ctaLink || "/products")}
                  className="btn-luxe-gold active:scale-95"
                >
                  Enter the Collection <IconArrowRight className="h-4 w-4" stroke={1.5} />
                </button>
                <Link href="/categories" className="btn-luxe-white active:scale-95">
                  Explore Collections
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bottom bar: counter + scroll cue */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 pb-7 md:pb-9 flex items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <span className="font-display text-lg text-ivory tabular-nums">
              {String(current + 1).padStart(2, "0")}
            </span>
            <span className="relative block h-px w-24 sm:w-40 bg-white/20 overflow-hidden">
              <motion.span
                key={current}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold to-azure"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6.5, ease: "linear" }}
              />
            </span>
            <span className="font-display text-sm text-white/45 tabular-nums">
              {String(slides.length).padStart(2, "0")}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-3 text-white/50">
            <span className="text-[9px] uppercase tracking-[0.4em]">Scroll to explore</span>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <IconArrowNarrowDown className="h-4 w-4" stroke={1.5} />
            </motion.span>
          </div>
        </div>
      </div>

      {/* Fade into the page below */}
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[5] bg-gradient-to-t from-noir to-transparent pointer-events-none" />
    </section>
  );
}
