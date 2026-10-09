"use client";

import { Component, useCallback, useEffect, useId, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
  IconFlask,
  IconPlayerPause,
  IconPlayerPlay,
  IconQrcode,
  IconShieldCheck,
} from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";
import { CORE_PRODUCTS } from "@/lib/mwp-content";
import { productPalette } from "@/lib/product-palette";
import "./mwp-orbit-hero.css";

// WebGL stage is client-only and streams in after hydration; the DOM bottle covers first paint.
const MwpOrbitScene = dynamic(() => import("./MwpOrbitScene"), { ssr: false });

const AUTOPLAY_MS = 6500;
const EASE = [0.22, 1, 0.36, 1];

// Tag lines match the header product menu; glow is sampled from each bottle's cap/label.
// Formulas without a signature in mwp-content show their focus areas instead of ingredients.
const FORMULAS = [
  { key: "ultra-pro", name: "Ultra Pro", category: "Men's vitality", tag: "The Quiet Miracle", purpose: "Everyday support for vitality, stamina and confidence.", glow: "#c9962e" },
  { key: "power-max", name: "Power Max", category: "Strength & stamina", tag: "Unlock Your Miracle", purpose: "Herbal support for strength, stamina and performance.", glow: "#3d63c4" },
  { key: "rapid-boost", name: "Rapid Boost", category: "Energy & focus", tag: "Fast Action. Real Results.", purpose: "Support for energy, focus and everyday performance.", glow: "#d23b36" },
  { key: "her-power", name: "Her Power", category: "Women's wellness", tag: "Her Inner Miracle", purpose: "Daily wellness support for balance and vitality.", glow: "#dc4f7f" },
  { key: "her-energy", name: "Her Energy", category: "Women's energy", tag: "Keeps Up With Her", purpose: "Energy and focus support for your everyday routine.", glow: "#8d4fb8" },
  { key: "daily-vitality", name: "Daily Vitality", category: "Everyday wellness", tag: "Age Is A Number", purpose: "Everyday support for overall health and wellbeing.", glow: "#5f9a3f" },
  { key: "alpha-prime", name: "Alpha Prime", category: "Men's performance", tag: "Strength. Focus. Performance.", purpose: "Support for strength, vitality and performance.", glow: "#c0652f", focus: ["Strength", "Vitality", "Performance"] },
  { key: "titan-force", name: "Titan Force", category: "Power & endurance", tag: "Power For Your Everyday.", purpose: "Performance support for strength and endurance.", glow: "#d8692a", focus: ["Strength", "Endurance", "Performance"] },
].map(formula => {
  const signature = CORE_PRODUCTS.find(product => product.key === formula.key)?.signature;
  const palette = productPalette(formula.key);
  return {
    ...formula,
    tint: palette.background,
    ink: palette.accent,
    notes: signature ? signature.split(" · ") : formula.focus,
    notesLabel: signature ? "Signature ingredient" : "Formula focus",
  };
});

const TRUST = [
  { label: "GMP Certified", icon: IconShieldCheck },
  { label: "Lab Tested", icon: IconFlask },
  { label: "QR Verified", icon: IconQrcode },
];

const TITLE_LINES = ["Your everyday.", "Your kind of", "power."];

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError?.();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function Magnetic({ children, disabled }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });
  return (
    <motion.div
      className="inline-flex"
      style={disabled ? undefined : { x: springX, y: springY }}
      onPointerMove={event => {
        if (disabled || event.pointerType !== "mouse") return;
        const box = event.currentTarget.getBoundingClientRect();
        x.set((event.clientX - box.left - box.width / 2) * 0.22);
        y.set((event.clientY - box.top - box.height / 2) * 0.3);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

function OrbitSeal({ rotate }) {
  const pathId = `mwp-seal-${useId().replace(/:/g, "")}`;
  return (
    <motion.div aria-hidden="true" className="mwp-orbit__seal" style={rotate ? { rotate } : undefined}>
      <svg viewBox="0 0 120 120" className="mwp-orbit__seal-ring">
        <defs>
          <path id={pathId} d="M60,60 m-47,0 a47,47 0 1,1 94,0 a47,47 0 1,1 -94,0" />
        </defs>
        <text>
          <textPath href={`#${pathId}`} textLength="292" lengthAdjust="spacing">
            Lab tested • QR verified • GMP certified •
          </textPath>
        </text>
      </svg>
      <span className="mwp-orbit__seal-core">
        <IconShieldCheck className="h-6 w-6" stroke={1.4} />
      </span>
    </motion.div>
  );
}

function DockItem({ formula, index, selected, onSelect, mouseX, progressKey, autoPlaying }) {
  const ref = useRef(null);
  const distance = useTransform(mouseX, value => {
    const box = ref.current?.getBoundingClientRect();
    return box && Number.isFinite(value) ? value - (box.left + box.width / 2) : 400;
  });
  const width = useSpring(useTransform(distance, [-170, 0, 170], [52, 78, 52]), { stiffness: 320, damping: 26, mass: 0.35 });
  const height = useTransform(width, value => value * 1.32);
  const active = index === selected;

  return (
    <motion.button
      ref={ref}
      type="button"
      onClick={() => onSelect(index)}
      aria-pressed={active}
      aria-label={`Show MWP ${formula.name}`}
      style={{ width, height }}
      className={`group relative shrink-0 rounded-2xl border transition-colors duration-300 focus-visible:outline-offset-4 ${active ? "border-white bg-white shadow-[0_14px_30px_-16px_rgba(30,20,10,0.45)]" : "border-white/60 bg-white/35 hover:bg-white/80"}`}
    >
      <span className="relative block h-full w-full">
        <Image src={`/products/cutouts/${formula.key}.webp`} alt="" fill sizes="80px" draggable={false} className="object-contain p-1.5" />
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-full bg-neutral-950 px-2.5 py-1 text-[10px] text-white opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
        {formula.name}
      </span>
      {active && (
        <span aria-hidden="true" className="absolute -bottom-2.5 left-2 right-2 h-[2px] overflow-hidden rounded-full bg-neutral-900/10">
          <span
            key={progressKey}
            className={`block h-full w-full rounded-full ${autoPlaying ? "mwp-orbit__progress" : ""}`}
            style={{ background: "var(--orbit-glow)" }}
          />
        </span>
      )}
    </motion.button>
  );
}

function RoundButton({ label, onClick, children, pressed, disabled, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900/15 bg-white/60 text-neutral-800 backdrop-blur transition-colors hover:border-neutral-900 hover:bg-neutral-950 hover:text-white disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export default function MwpOrbitHero() {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  // Match the server render (motion on) until hydration, then follow the OS preference;
  // MotionConfig below already strips transform animations for reduced-motion users.
  const reduceMotion = hydrated && !!prefersReducedMotion;
  const sectionRef = useRef(null);
  const anchorRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, px: 0, py: 0, inside: false });
  const dragged = useRef(false);

  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const [webgl, setWebgl] = useState(false);
  const [lite, setLite] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [stage, setStage] = useState(null);
  const [isDesktop, setIsDesktop] = useState(false);

  const active = FORMULAS[selected];
  const motionOn = !paused && !reduceMotion;
  const autoPlaying = motionOn && pageVisible && inView && !holding;
  const move = useCallback(step => setSelected(index => (index + step + FORMULAS.length) % FORMULAS.length), []);
  const handleSceneReady = useCallback(() => setSceneReady(true), []);
  const handleSceneError = useCallback(() => {
    setWebgl(false);
    setSceneReady(false);
  }, []);

  /* Pointer: tilt, parallax and capsule repel */
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const softX = useSpring(pointerX, { stiffness: 60, damping: 18, mass: 0.6 });
  const softY = useSpring(pointerY, { stiffness: 60, damping: 18, mass: 0.6 });
  const auraX = useTransform(softX, value => value * -28);
  const auraY = useTransform(softY, value => value * -20);
  const noteMotion = [
    { x: useTransform(softX, value => value * -12), y: useTransform(softY, value => value * -8) },
    { x: useTransform(softX, value => value * 16), y: useTransform(softY, value => value * 10) },
    { x: useTransform(softX, value => value * -20), y: useTransform(softY, value => value * 14) },
  ];
  const dockX = useMotionValue(Infinity);

  /* Scroll: copy lifts away, kinetic type slides, seal turns; the 3D scene reads the same progress */
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const stageOpacity = useTransform(scrollYProgress, [0.15, 0.7], [1, 0]);
  const giantX = useTransform(scrollYProgress, [0, 1], ["0%", "-24%"]);
  const sealRotate = useTransform(scrollYProgress, [0, 1], [0, 220]);

  useEffect(() => setHydrated(true), []);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "80px 0px" });
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    try {
      setWebgl(!!document.createElement("canvas").getContext("webgl2"));
    } catch {
      setWebgl(false);
    }
    setLite(window.matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency || 8) <= 4);
  }, []);

  // On mobile the hero runs ~1.6 screens tall, so scroll-linked fades would hide copy mid-read.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Stage centre drives the aura, dot grid and giant type; keep it in sync with layout.
  useEffect(() => {
    const section = sectionRef.current;
    const anchor = anchorRef.current;
    if (!section || !anchor) return;
    const measure = () => {
      const outer = section.getBoundingClientRect();
      const box = anchor.getBoundingClientRect();
      const next = { x: Math.round(box.left + box.width / 2 - outer.left), y: Math.round(box.top + box.height / 2 - outer.top) };
      setStage(current => (current && current.x === next.x && current.y === next.y ? current : next));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(anchor);
    document.fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!autoPlaying) return;
    const timer = window.setTimeout(() => move(1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoPlaying, selected, move]);

  const handlePointerMove = event => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    const py = event.clientY - box.top;
    const x = (px / box.width) * 2 - 1;
    const y = (py / box.height) * 2 - 1;
    pointerRef.current = { x, y, px, py, inside: true };
    if (event.pointerType === "mouse" && !reduceMotion) {
      pointerX.set(x);
      pointerY.set(y);
    }
  };

  const handlePointerLeave = () => {
    pointerRef.current = { ...pointerRef.current, x: 0, y: 0, inside: false };
    pointerX.set(0);
    pointerY.set(0);
  };

  const holdProps = {
    onPointerEnter: event => event.pointerType === "mouse" && setHolding(true),
    onPointerLeave: () => setHolding(false),
    onFocus: () => setHolding(true),
    onBlur: event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setHolding(false);
    },
  };

  const sectionStyle = {
    "--orbit-tint": active.tint,
    "--orbit-glow": active.glow,
    "--orbit-ink": active.ink,
    "--orbit-interval": `${AUTOPLAY_MS}ms`,
    ...(stage ? { "--stage-x": `${stage.x}px`, "--stage-y": `${stage.y}px` } : {}),
  };
  const counter = String(selected + 1).padStart(2, "0");
  const motionStyle = style => (reduceMotion ? undefined : style);
  const scrollStyle = style => (reduceMotion || !isDesktop ? undefined : style);

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={sectionRef}
        aria-labelledby="mwp-orbit-title"
        data-motion={motionOn ? "on" : "off"}
        style={sectionStyle}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={event => event.pointerType !== "mouse" && handlePointerLeave()}
        className="mwp-orbit relative isolate flex flex-col overflow-hidden text-neutral-900 lg:min-h-[calc(100svh-112px)]"
      >
        {/* Backdrop: formula-tinted aura, lab dot grid, film grain */}
        <div aria-hidden="true" className="mwp-orbit__backdrop">
          <div className="mwp-orbit__aura mwp-orbit__aura--soft" />
          <motion.div className="mwp-orbit__aura" style={motionStyle({ x: auraX, y: auraY })} />
          <div className="mwp-orbit__grid" />
          <div className="mwp-orbit__grain" />
        </div>

        {/* Giant kinetic product name behind the stage */}
        <div aria-hidden="true" className="mwp-orbit__giant">
          <motion.div className="absolute inset-0" style={motionStyle({ x: giantX })}>
            <AnimatePresence initial={false}>
              <motion.div
                key={active.key}
                className="mwp-orbit__giant-layer"
                initial={reduceMotion ? false : { opacity: 0, y: "22%" }}
                animate={{ opacity: 1, y: "0%" }}
                exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: "-22%" }}
                transition={{ duration: 0.9, ease: EASE }}
              >
                <div className="mwp-orbit__giant-track">
                  {[0, 1].map(copy => (
                    <span key={copy} className="flex">
                      {[0, 1, 2].map(item => (
                        <span key={item} className="mwp-orbit__giant-word">
                          {active.name}
                          <i className="mwp-orbit__giant-star">✦</i>
                        </span>
                      ))}
                    </span>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>

        {/* 3D stage */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
          {webgl && (
            <SceneBoundary onError={handleSceneError}>
              <MwpOrbitScene
                formulas={FORMULAS}
                activeIndex={selected}
                anchorRef={anchorRef}
                pointerRef={pointerRef}
                scrollProgress={scrollYProgress}
                motionOn={motionOn}
                reduceMotion={!!reduceMotion}
                inView={inView && pageVisible}
                lite={lite}
                onReady={handleSceneReady}
              />
            </SceneBoundary>
          )}
        </div>

        <div className="relative mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 px-5 sm:px-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:grid-rows-[1fr_auto] lg:gap-x-8">
          {/* Headline */}
          <motion.div className="relative z-[2] pt-8 sm:pt-12 lg:col-start-1 lg:row-start-1 lg:self-end lg:pb-6 lg:pt-10" style={scrollStyle({ y: copyY, opacity: copyOpacity })}>
            <motion.p
              className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/55 py-1.5 pl-3 pr-4 text-[10px] uppercase tracking-[0.22em] text-neutral-700 backdrop-blur sm:text-[11px]"
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <span className="mwp-orbit__pulse" aria-hidden="true" />
              <span className="hidden sm:inline">MWP Supplements ·&nbsp;</span>Men / Women / Power
            </motion.p>
            <h1 id="mwp-orbit-title" className="mwp-orbit__title">
              {TITLE_LINES.map((line, index) => (
                <span key={line} className="mwp-orbit__line">
                  <motion.span
                    className={`block ${index === 1 ? "text-[color:var(--orbit-ink)]" : ""}`}
                    initial={reduceMotion ? false : { y: "108%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 1.05, delay: 0.12 + index * 0.1, ease: EASE }}
                  >
                    {index === 2 ? (
                      <>
                        <span className="mwp-orbit__pill" aria-hidden="true" />
                        <span className="mwp-orbit__shimmer">{line}</span>
                      </>
                    ) : (
                      line
                    )}
                  </motion.span>
                </span>
              ))}
            </h1>
          </motion.div>

          {/* Product stage */}
          <div className="relative flex flex-col items-center justify-center pb-2 pt-6 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pb-0 lg:pt-0">
            <OrbitSeal rotate={reduceMotion ? undefined : sealRotate} />

            <div className="relative flex w-full items-center justify-center">
              <motion.div
                ref={anchorRef}
                className="mwp-orbit__anchor z-[2]"
                onPointerDownCapture={() => {
                  dragged.current = false;
                }}
                onPanStart={() => {
                  dragged.current = true;
                }}
                onPanEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 40 || Math.abs(info.velocity.x) > 400) move(info.offset.x < 0 ? 1 : -1);
                }}
                style={{ touchAction: "pan-y" }}
              >
                <Link
                  href={`/products/${active.key}`}
                  aria-label={`Explore MWP ${active.name}`}
                  draggable={false}
                  onClick={event => {
                    if (dragged.current) event.preventDefault();
                  }}
                  className="absolute inset-0 rounded-[32px] focus-visible:outline-offset-4"
                >
                  <Image
                    src={`/products/cutouts/${active.key}.webp`}
                    alt={`MWP ${active.name} supplement bottle`}
                    fill
                    priority
                    sizes="(min-width: 1024px) 280px, 200px"
                    draggable={false}
                    data-static={!webgl && !reduceMotion}
                    className="mwp-orbit__fallback object-contain object-bottom drop-shadow-[0_24px_24px_rgba(0,0,0,0.12)]"
                    style={{ opacity: sceneReady ? 0 : 1 }}
                  />
                </Link>

                <motion.div aria-hidden="true" style={scrollStyle({ opacity: stageOpacity })}>
                  <AnimatePresence initial={false}>
                    {active.notes.slice(0, 3).map((note, index) => (
                      <motion.div
                        key={`${active.key}-${note}`}
                        className={`mwp-orbit__note mwp-orbit__note--${index}`}
                        initial={reduceMotion ? false : { opacity: 0, x: index === 1 ? -14 : 14 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.6, delay: 0.45 + index * 0.12, ease: EASE } }}
                        exit={{ opacity: 0, transition: { duration: 0.2 } }}
                      >
                        <motion.div className="mwp-orbit__note-chip" style={motionStyle(noteMotion[index])}>
                          <span className="mwp-orbit__note-body">
                            <span className="mwp-orbit__note-label">{active.notesLabel}</span>
                            <span className="mwp-orbit__note-name">{note}</span>
                          </span>
                          <span className="mwp-orbit__note-leader" />
                        </motion.div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              </motion.div>

              <RoundButton label="Previous formula" onClick={() => move(-1)} className="absolute left-0 top-1/2 z-[3] -translate-y-1/2 lg:hidden">
                <IconChevronLeft className="h-4 w-4" stroke={1.5} />
              </RoundButton>
              <RoundButton label="Next formula" onClick={() => move(1)} className="absolute right-0 top-1/2 z-[3] -translate-y-1/2 lg:hidden">
                <IconChevronRight className="h-4 w-4" stroke={1.5} />
              </RoundButton>
            </div>

            {/* Active formula card */}
            <motion.div className="mwp-orbit__card" style={scrollStyle({ opacity: stageOpacity })} {...holdProps}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.key}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--orbit-ink)]">{active.category}</p>
                  <h2 className="mt-1.5 text-[22px] leading-tight tracking-[-0.02em] sm:text-2xl">MWP {active.name}</h2>
                  <p className="mt-1 text-[13px] text-neutral-700">{active.tag}</p>
                  <p className="mt-2 text-xs leading-5 text-neutral-500">{active.purpose}</p>
                  <p className="mt-2 text-[11px] leading-5 text-neutral-600 sm:sr-only">
                    {active.notesLabel === "Formula focus" ? "Focus" : "Key ingredients"}: {active.notes.join(" · ")}
                  </p>
                </motion.div>
              </AnimatePresence>
              <Link
                href={`/products/${active.key}`}
                className="group mt-3 inline-flex items-center gap-2 text-[13px] text-neutral-900 underline-offset-4 hover:underline lg:mt-4"
              >
                Explore formula
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-white transition-transform duration-300 group-hover:rotate-45">
                  <IconArrowUpRight className="h-3.5 w-3.5" stroke={1.6} />
                </span>
              </Link>
            </motion.div>
          </div>

          {/* Supporting copy + CTAs */}
          <motion.div className="relative z-[2] pb-8 pt-6 lg:col-start-1 lg:row-start-2 lg:self-start lg:pb-10 lg:pt-0" style={scrollStyle({ y: copyY, opacity: copyOpacity })}>
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45, ease: EASE }}>
              <p className="max-w-[420px] text-[15px] leading-7 text-neutral-600 sm:text-base">
                Supplements for men, women and everyday wellness. Explore eight formulas for energy, vitality and performance—and find the one that fits your routine.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Magnetic disabled={!!reduceMotion}>
                  <Link
                    href="/products"
                    className="group inline-flex min-h-[52px] items-center gap-4 rounded-full bg-neutral-950 py-1.5 pl-6 pr-1.5 text-sm text-white shadow-[0_18px_40px_-18px_rgba(0,0,0,0.6)] transition-colors hover:bg-neutral-800 focus-visible:outline-offset-4"
                  >
                    {t("shopNow")}
                    <span className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-950 transition-transform duration-500 group-hover:rotate-45" style={{ background: "var(--orbit-glow)" }}>
                      <IconArrowUpRight className="h-4 w-4 text-white" stroke={1.8} />
                    </span>
                  </Link>
                </Magnetic>
                <Link
                  href="/quiz"
                  className="group inline-flex min-h-[52px] items-center gap-3 rounded-full border border-neutral-900/15 bg-white/50 px-6 text-sm backdrop-blur transition-colors hover:border-neutral-900 hover:bg-white focus-visible:outline-offset-4"
                >
                  {t("findYourFormula")}
                  <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" stroke={1.5} />
                </Link>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-green-800">
                {TRUST.map(({ label, icon: Icon }) => (
                  <li key={label} className="inline-flex items-center gap-1.5">
                    <Icon className="h-4 w-4" stroke={1.5} /> {label}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>

        {/* Formula dock */}
        <div className="relative z-[3] mx-auto w-full max-w-[1440px] px-5 pb-14 sm:px-10 lg:pb-16">
          <div className="flex items-end justify-between gap-6 border-t border-neutral-900/10 pt-5">
            <div className="hidden items-end gap-3 lg:flex">
              <span className="relative block h-[44px] w-[62px] overflow-hidden text-[44px] leading-none tracking-[-0.04em] tabular-nums">
                <AnimatePresence initial={false}>
                  <motion.span
                    key={counter}
                    className="absolute inset-0"
                    initial={reduceMotion ? false : { y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { y: "-100%" }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    {counter}
                  </motion.span>
                </AnimatePresence>
              </span>
              <span className="pb-1 text-[10px] uppercase leading-4 tracking-[0.2em] text-neutral-500">
                / {String(FORMULAS.length).padStart(2, "0")}
                <br />
                Formulas
              </span>
            </div>

            <div
              role="group"
              aria-label="Choose a formula to preview"
              className="-mx-5 flex h-[86px] min-w-0 flex-1 items-end gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] sm:mx-0 sm:justify-center sm:px-0 lg:flex-none lg:overflow-visible [&::-webkit-scrollbar]:hidden"
              {...holdProps}
              onPointerMove={event => event.pointerType === "mouse" && dockX.set(event.clientX)}
              onPointerLeave={() => {
                dockX.set(Infinity);
                setHolding(false);
              }}
            >
              {FORMULAS.map((formula, index) => (
                <DockItem
                  key={formula.key}
                  formula={formula}
                  index={index}
                  selected={selected}
                  onSelect={setSelected}
                  mouseX={dockX}
                  progressKey={`${selected}-${autoPlaying}`}
                  autoPlaying={autoPlaying}
                />
              ))}
            </div>

            <div className="hidden items-center gap-2 pb-3 lg:flex">
              <RoundButton label="Previous formula" onClick={() => move(-1)}>
                <IconChevronLeft className="h-4 w-4" stroke={1.5} />
              </RoundButton>
              <RoundButton label="Pause animation" pressed={paused || !!reduceMotion} disabled={!!reduceMotion} onClick={() => setPaused(value => !value)}>
                {paused || reduceMotion ? <IconPlayerPlay className="h-4 w-4" /> : <IconPlayerPause className="h-4 w-4" />}
              </RoundButton>
              <RoundButton label="Next formula" onClick={() => move(1)}>
                <IconChevronRight className="h-4 w-4" stroke={1.5} />
              </RoundButton>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-neutral-500 lg:hidden">
            <span>
              {counter} / {String(FORMULAS.length).padStart(2, "0")} · {active.name}
            </span>
            <RoundButton label="Pause animation" pressed={paused || !!reduceMotion} disabled={!!reduceMotion} onClick={() => setPaused(value => !value)} className="h-9 w-9">
              {paused || reduceMotion ? <IconPlayerPlay className="h-3.5 w-3.5" /> : <IconPlayerPause className="h-3.5 w-3.5" />}
            </RoundButton>
          </div>
        </div>

        <p className="sr-only" aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">
          Showing MWP {active.name}, {active.category}.
        </p>
      </section>
    </MotionConfig>
  );
}
