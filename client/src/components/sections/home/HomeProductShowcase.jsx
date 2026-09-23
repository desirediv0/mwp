"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { fetchApi, formatCurrency, cn } from "@/lib/utils";
import { pickSlideProducts, getProductImage } from "@/lib/mwp-content";
import { useLanguage } from "@/lib/language-context";
import {
  IconChevronLeft,
  IconChevronRight,
  IconArrowRight,
  IconSparkles,
} from "@tabler/icons-react";

const FALLBACK = pickSlideProducts([]);

export default function HomeProductShowcase() {
  const { t } = useLanguage();
  const [slides, setSlides] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchApi("/public/products?limit=50");
        if (!alive) return;
        const products = res?.data?.products || [];
        setSlides(pickSlideProducts(products));
      } catch {
        /* keep fallback */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const total = slides.length;

  const go = useCallback(
    (next, direction) => {
      setDir(direction);
      setIndex((next + total) % total);
    },
    [total]
  );

  useEffect(() => {
    if (paused || total <= 1) return;
    timer.current = setInterval(() => {
      setDir(1);
      setIndex((i) => (i + 1) % total);
    }, 6500);
    return () => clearInterval(timer.current);
  }, [paused, total, index]);

  const slide = slides[index] || slides[0];
  const product = slide?.product;
  const href = product?.slug ? `/products/${product.slug}` : "/products";
  const price = product?.basePrice ?? product?.regularPrice ?? null;

  const variants = {
    enter: (d) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  if (loading && !slide) {
    return (
      <section className="relative min-h-[78vh] sm:min-h-[86vh] bg-[#09090b] animate-pulse" />
    );
  }

  return (
    <section
      className="relative w-full overflow-hidden bg-[#09090b] text-white"
      style={{ minHeight: "min(88vh, 900px)" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="MWP product showcase"
    >
      <AnimatePresence initial={false} custom={dir} mode="wait">
        <motion.div
          key={slide.key}
          custom={dir}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            slide.bg || "from-[#0A0A0A] via-[#121216] to-[#0A0A0A]"
          )}
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.06),transparent_55%)]" />
          <div
            className="absolute -right-32 top-1/4 w-[480px] h-[480px] rounded-full blur-[160px] opacity-25 pointer-events-none"
            style={{ background: slide.accent }}
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 min-h-[inherit] flex items-center py-16 sm:py-20">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center w-full">
          {/* Copy */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`copy-${slide.key}`}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="order-2 lg:order-1"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/[0.05] text-[10px] font-bold uppercase tracking-[0.22em] mb-5">
                <IconSparkles className="h-3.5 w-3.5" style={{ color: slide.accent }} />
                <span style={{ color: slide.accent }}>{slide.headline}</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.05] mb-4">
                {slide.name}
              </h1>

              <p className="text-sm sm:text-base md:text-lg text-white/65 max-w-xl leading-relaxed mb-7">
                {slide.focus}
              </p>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-2.5 mb-8 max-w-xl">
                {slide.benefits.slice(0, 8).map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-[12.5px] sm:text-[13.5px] text-white/80"
                  >
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: slide.accent }}
                    />
                    {b}
                  </li>
                ))}
              </ul>

              {price != null && (
                <p className="text-sm text-white/70 mb-5">
                  From{" "}
                  <span className="text-white font-extrabold text-lg">
                    {formatCurrency(price)}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 h-12 px-7 bg-white text-black text-[11px] font-black uppercase tracking-[0.18em] hover:bg-neutral-200 transition-colors rounded-none"
                >
                  {t("discoverFormula")}
                  <IconArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={href}
                  className="inline-flex items-center gap-2 h-12 px-7 border border-white/35 text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-white hover:text-black transition-colors"
                >
                  {t("shopNow")}
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Visual */}
          <div className="order-1 lg:order-2 relative flex items-center justify-center min-h-[260px] sm:min-h-[360px] lg:min-h-[480px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={`img-${slide.key}-${product?.id || "fallback"}`}
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -12 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative w-full max-w-md lg:max-w-lg aspect-square"
              >
                <div
                  className="absolute inset-8 rounded-full blur-[80px] opacity-30"
                  style={{ background: slide.accent }}
                />
                <Image
                  src={getProductImage(product)}
                  alt={slide.name}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 1024px) 90vw, 560px"
                  className="relative object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)] p-4"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-6 sm:bottom-8 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {slides.map((s, i) => (
              <button
                key={s.key}
                type="button"
                aria-label={`Show ${s.name}`}
                onClick={() => go(i, i > index ? 1 : -1)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-400",
                  i === index ? "w-10 bg-white" : "w-4 bg-white/30 hover:bg-white/60"
                )}
              />
            ))}
            <span className="ml-3 text-[11px] font-bold tabular-nums text-white/50 tracking-wider">
              {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous product"
              onClick={() => go(index - 1, -1)}
              className="w-10 h-10 border border-white/25 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
            >
              <IconChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Next product"
              onClick={() => go(index + 1, 1)}
              className="w-10 h-10 border border-white/25 flex items-center justify-center text-white hover:bg-white hover:text-black transition-colors"
            >
              <IconChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
