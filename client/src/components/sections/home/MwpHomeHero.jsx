"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconArrowUpRight, IconArrowRight, IconChevronLeft, IconChevronRight, IconCheck, IconLeaf, IconPlayerPause, IconPlayerPlay } from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";

// Composition reference: 21st.dev's Product Spotlight Hero Section.
// Adapted for MWP with existing assets and a controllable product carousel.
const FORMULAS = [
  { key: "ultra-pro", name: "Ultra Pro", category: "Men's vitality", purpose: "Everyday support for vitality, stamina and confidence.", color: "#886b40" },
  { key: "power-max", name: "Power Max", category: "Strength & stamina", purpose: "Herbal support for strength, stamina and performance.", color: "#395577" },
  { key: "rapid-boost", name: "Rapid Boost", category: "Energy & focus", purpose: "Support for energy, focus and everyday performance.", color: "#a33a37" },
  { key: "her-power", name: "Her Power", category: "Women's wellness", purpose: "Daily wellness support for balance and vitality.", color: "#a94b70" },
  { key: "her-energy", name: "Her Energy", category: "Women's energy", purpose: "Energy and focus support for your everyday routine.", color: "#76558e" },
  { key: "daily-vitality", name: "Daily Vitality", category: "Everyday wellness", purpose: "Everyday support for overall health and wellbeing.", color: "#607339" },
  { key: "alpha-prime", name: "Alpha Prime", category: "Men's performance", purpose: "Support for strength, vitality and performance.", color: "#996333" },
  { key: "titan-force", name: "Titan Force", category: "Power & endurance", purpose: "Performance support for strength and endurance.", color: "#a65a32" },
];

function ProductBottle({ formula, featured = false }) {
  return (
    <Image
      src={`/products/cutouts/${formula.key}.webp`}
      alt={`MWP ${formula.name} supplement bottle`}
      width={formula.key === "her-energy" ? 708 : 417}
      height={1000}
      sizes={featured ? "(min-width: 1024px) 310px, 230px" : "(min-width: 1024px) 210px, 140px"}
      priority={featured}
      draggable={false}
      className="h-full w-auto max-w-none object-contain drop-shadow-[0_18px_16px_rgba(0,0,0,0.08)]"
    />
  );
}

export default function MwpHomeHero() {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(0);
  const reduceMotion = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const dragged = useRef(false);
  const autoPlaying = !paused && !reduceMotion && pageVisible;
  const active = FORMULAS[selected];
  const moveSlide = direction => setSelected(index => (index + direction + FORMULAS.length) % FORMULAS.length);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (!autoPlaying) return;
    const timer = window.setTimeout(() => {
      setSelected(index => (index + 1) % FORMULAS.length);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [autoPlaying, selected]);

  return (
    <section
      aria-labelledby="mwp-hero-title"
      className="overflow-hidden bg-white text-neutral-900"
    >
      <div className="mx-auto max-w-[1440px] px-6 pb-8 pt-10 sm:px-10 sm:pt-14 lg:pt-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-12">
          <div className="max-w-xl">
            <p className="mb-6 inline-flex items-center gap-2.5 text-[10px] uppercase tracking-[0.2em] text-green-700 sm:text-[11px]">
              <IconLeaf className="h-4 w-4" stroke={1.5} />
              MWP Supplements · Men / Women / Power
            </p>
            <h1 id="mwp-hero-title" className="text-[46px] leading-[1.04] tracking-[-0.045em] sm:text-[64px] xl:text-[78px]">
              Your everyday.
              <br />
              <span className="text-[#886b40]">Your kind of</span>
              <br />
              <span className="text-[#886b40]">power.</span>
            </h1>
            <p className="mt-6 max-w-[390px] text-[15px] leading-7 text-neutral-600 sm:text-base">
              Supplements for men, women and everyday wellness. Explore eight formulas for energy, vitality and performance—and find the one that fits your routine.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/products" className="inline-flex min-h-12 items-center justify-center gap-5 rounded-full bg-neutral-900 px-6 text-sm text-white transition-colors hover:bg-neutral-700 focus-visible:outline-offset-4">
                {t("shopNow")} <IconArrowUpRight className="h-4 w-4" stroke={1.5} />
              </Link>
              <Link href="/quiz" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full border border-neutral-300 px-6 text-sm transition-colors hover:border-neutral-900 focus-visible:outline-offset-4">
                {t("findYourFormula")} <IconArrowRight className="h-4 w-4" stroke={1.5} />
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-green-700">
              {["GMP Certified", "Lab Tested", "QR Verified"].map(label => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5" stroke={1.5} /> {label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative min-w-0">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4 text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              <span>The MWP collection</span>
              <div className="flex items-center gap-3">
                <span>0{selected + 1} / 08</span>
                <button
                  type="button"
                  data-autoplay-control
                  onClick={() => setPaused(value => !value)}
                  aria-label={paused ? "Play automatic product changes" : "Pause automatic product changes"}
                  aria-pressed={paused}
                  disabled={!!reduceMotion}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-700 transition-colors hover:border-neutral-900 disabled:opacity-40"
                >
                  {paused || reduceMotion ? <IconPlayerPlay className="h-3.5 w-3.5" /> : <IconPlayerPause className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div
              className="relative isolate overflow-hidden h-[310px] sm:h-[390px] lg:h-[400px] xl:h-[430px]"
              aria-label={`${active.name} product showcase`}
            >
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[250px] w-[250px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200/70 sm:h-[330px] sm:w-[330px]" />
              <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[190px] w-[190px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-100 sm:h-[260px] sm:w-[260px]" />
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                dragSnapToOrigin
                onPointerDownCapture={() => { dragged.current = false; }}
                onDragStart={() => { dragged.current = true; }}
                onDragEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 400) {
                    moveSlide(info.offset.x < 0 ? 1 : -1);
                  }
                }}
                style={{ touchAction: "pan-y" }}
                className="absolute inset-0 cursor-grab active:cursor-grabbing"
              >
                {FORMULAS.map((formula, index) => {
                  let slot = (index - selected + FORMULAS.length) % FORMULAS.length;
                  if (slot > FORMULAS.length / 2) slot -= FORMULAS.length;
                  const centered = slot === 0;
                  return (
                    <motion.div
                      key={formula.key}
                      data-bottle={formula.key}
                      initial={false}
                      animate={{ x: `${slot * 100}%`, scale: centered ? 1 : 0.71, opacity: Math.abs(slot) <= 1 ? (centered ? 1 : 0.8) : 0 }}
                      transition={{ duration: reduceMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1], opacity: { duration: reduceMotion ? 0 : 0.35 } }}
                      style={{ zIndex: centered ? 20 : 10, pointerEvents: centered ? "auto" : "none" }}
                      aria-hidden={!centered}
                      className="absolute bottom-3 left-1/3 flex h-[280px] w-1/3 origin-bottom items-end justify-center sm:bottom-4 sm:h-[355px] lg:h-[365px] xl:h-[395px]"
                    >
                      <Link
                        href={`/products/${formula.key}`}
                        aria-label={`Explore MWP ${formula.name}`}
                        tabIndex={centered ? 0 : -1}
                        draggable={false}
                        onClick={event => { if (dragged.current) event.preventDefault(); }}
                        className="flex h-full w-full items-end justify-center rounded-2xl focus-visible:outline-offset-4"
                      >
                        <ProductBottle formula={formula} featured={centered} />
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
              <button type="button" onClick={() => moveSlide(-1)} aria-label="Previous formula" className="absolute left-1 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-sm transition-colors hover:border-neutral-900 hover:text-neutral-900 sm:h-10 sm:w-10">
                <IconChevronLeft className="h-4 w-4" stroke={1.5} />
              </button>
              <button type="button" onClick={() => moveSlide(1)} aria-label="Next formula" className="absolute right-1 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-neutral-200 bg-white/95 text-neutral-700 shadow-sm transition-colors hover:border-neutral-900 hover:text-neutral-900 sm:h-10 sm:w-10">
                <IconChevronRight className="h-4 w-4" stroke={1.5} />
              </button>
            </div>
            <div className="flex min-h-[104px] items-center justify-between gap-4 border-t border-neutral-200 py-4" aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">
              <motion.div
                key={active.key}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.5 }}
              >
                <p className="mb-1 text-[10px] uppercase tracking-[0.15em]" style={{ color: active.color }}>{active.category}</p>
                <h2 className="text-xl tracking-tight sm:text-2xl">MWP {active.name}</h2>
                <p className="mt-1 max-w-sm text-xs leading-5 text-neutral-500">{active.purpose}</p>
              </motion.div>
              <Link href={`/products/${active.key}`} aria-label={`View ${active.name} details`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 transition-colors hover:border-neutral-900 hover:bg-neutral-900 hover:text-white">
                <IconArrowUpRight className="h-5 w-5" stroke={1.5} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-200 pt-6 lg:mt-9">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500">Eight formulas. Find your fit.</p>
            <p className="text-xs text-neutral-500">Select a formula to explore</p>
          </div>
          <div role="group" aria-label="Choose a formula to preview" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
            {FORMULAS.map((formula, index) => (
              <button key={formula.key} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} className={`flex min-h-[68px] items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-offset-2 ${selected === index ? "border-neutral-900" : "border-neutral-200 hover:border-neutral-400"}`}>
                <Image src={`/products/cutouts/${formula.key}.webp`} alt="" width={32} height={48} sizes="32px" className="h-12 w-8 shrink-0 object-contain" />
                <span className="min-w-0">
                  <span className="block text-[12px] leading-5">{formula.name}</span>
                  <span className="mt-0.5 block text-[9px] leading-4 text-neutral-500">{formula.category}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
