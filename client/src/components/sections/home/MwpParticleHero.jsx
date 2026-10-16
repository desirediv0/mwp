"use client";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconChevronLeft,
  IconChevronRight,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";
import { productPalette } from "@/lib/product-palette";
import "./mwp-particle-hero.css";

// WebGL stage is client-only and streams in after hydration; headline text carries first paint.
const MwpParticleScene = dynamic(() => import("./MwpParticleScene"), { ssr: false });

const AUTOPLAY_MS = 7000;
const EASE = [0.22, 1, 0.36, 1];
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+";

// Tag lines match the header product menu. Glow is sampled from each bottle's cap/label; ink (from the
// product palette) is the darker shade used for small text on the light stage.
const FORMULAS = [
  { key: "ultra-pro", name: "Ultra Pro", category: "Men's vitality", tag: "The Quiet Miracle", purpose: "Everyday support for vitality, stamina and confidence.", glow: "#c9962e" },
  { key: "power-max", name: "Power Max", category: "Strength & stamina", tag: "Unlock Your Miracle", purpose: "Herbal support for strength, stamina and performance.", glow: "#3d63c4" },
  { key: "rapid-boost", name: "Rapid Boost", category: "Energy & focus", tag: "Fast Action. Real Results.", purpose: "Support for energy, focus and everyday performance.", glow: "#d23b36" },
  { key: "her-power", name: "Her Power", category: "Women's wellness", tag: "Her Inner Miracle", purpose: "Daily wellness support for balance and vitality.", glow: "#dc4f7f" },
  { key: "her-energy", name: "Her Energy", category: "Women's energy", tag: "Keeps Up With Her", purpose: "Energy and focus support for your everyday routine.", glow: "#8d4fb8" },
  { key: "daily-vitality", name: "Daily Vitality", category: "Everyday wellness", tag: "Age Is A Number", purpose: "Everyday support for overall health and wellbeing.", glow: "#5f9a3f" },
  { key: "alpha-prime", name: "Alpha Prime", category: "Men's performance", tag: "Strength. Focus. Performance.", purpose: "Support for strength, vitality and performance.", glow: "#c0652f" },
  { key: "titan-force", name: "Titan Force", category: "Power & endurance", tag: "Power For Your Everyday.", purpose: "Performance support for strength and endurance.", glow: "#d8692a" },
].map(formula => ({ ...formula, ink: productPalette(formula.key).accent }));

const TITLE_WORDS = [["Your", "everyday."], ["Your", "kind", "of", "power."]];

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

// Scrambles through random glyphs before settling on the real text.
function DecodeText({ text, disabled, className }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (disabled) {
      setDisplay(text);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min(1, (now - start) / 750);
      const settled = Math.floor(progress * text.length);
      setDisplay(
        text
          .split("")
          .map((char, index) => (index < settled || char === " " ? char : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
          .join("")
      );
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [text, disabled]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </span>
  );
}

function ControlButton({ label, onClick, children, pressed, disabled, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      className={`flex h-10 w-10 items-center justify-center rounded-full border border-neutral-900/15 bg-white/60 text-neutral-800 backdrop-blur transition-colors hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:pointer-events-none disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export default function MwpParticleHero() {
  const { t } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  // Match the server render (motion on) until hydration, then follow the OS preference;
  // MotionConfig below already strips transform animations for reduced-motion users.
  const reduceMotion = hydrated && !!prefersReducedMotion;
  const sectionRef = useRef(null);
  const anchorRef = useRef(null);
  const railRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0, px: 0, py: 0, inside: false });
  const dragged = useRef(false);

  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [inView, setInView] = useState(true);
  const [webgl, setWebgl] = useState(null);
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

  /* Scroll: desktop columns part like doors while the bottle blows away upward */
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  // On mobile the hero is taller than the screen, so the bottle only breaks up as it slides under the header.
  const { scrollYProgress: anchorProgress } = useScroll({ target: anchorRef, offset: ["start 104px", "end 104px"] });
  const leftX = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const rightX = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const sideOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  const barOpacity = useTransform(scrollYProgress, [0, 0.35], [1, 0]);

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
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Stage geometry drives the spotlight, light beams and horizon line.
  useEffect(() => {
    const section = sectionRef.current;
    const anchor = anchorRef.current;
    if (!section || !anchor) return;
    const measure = () => {
      const outer = section.getBoundingClientRect();
      const box = anchor.getBoundingClientRect();
      const next = {
        x: Math.round(box.left + box.width / 2 - outer.left),
        y: Math.round(box.top + box.height / 2 - outer.top),
        base: Math.round(box.bottom - outer.top - box.height * 0.03),
      };
      setStage(current => (current && current.x === next.x && current.y === next.y && current.base === next.base ? current : next));
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

  // Keep the active name visible in the scrollable mobile rail without moving the page.
  useEffect(() => {
    const rail = railRef.current;
    const item = rail?.querySelector(`[data-index="${selected}"]`);
    if (!rail || !item || rail.scrollWidth <= rail.clientWidth) return;
    rail.scrollTo({ left: item.offsetLeft - (rail.clientWidth - item.offsetWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
  }, [selected, reduceMotion]);

  const handlePointerMove = event => {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left;
    const py = event.clientY - box.top;
    pointerRef.current = { x: (px / box.width) * 2 - 1, y: (py / box.height) * 2 - 1, px, py, inside: true };
  };
  const handlePointerLeave = () => {
    pointerRef.current = { ...pointerRef.current, x: 0, y: 0, inside: false };
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
    "--particle-glow": active.glow,
    "--particle-ink": active.ink,
    "--particle-interval": `${AUTOPLAY_MS}ms`,
    ...(stage ? { "--stage-x": `${stage.x}px`, "--stage-y": `${stage.y}px`, "--stage-base": `${stage.base}px` } : {}),
  };
  const sceneState = webgl === false ? "none" : sceneReady ? "ready" : "pending";
  const counter = String(selected + 1).padStart(2, "0");
  const total = String(FORMULAS.length).padStart(2, "0");
  const scrollStyle = style => (reduceMotion || !isDesktop ? undefined : style);

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={sectionRef}
        aria-labelledby="mwp-particle-title"
        data-motion={motionOn ? "on" : "off"}
        data-scene={sceneState}
        style={sectionStyle}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerUp={event => event.pointerType !== "mouse" && handlePointerLeave()}
        className="mwp-particle relative isolate flex flex-col overflow-hidden text-neutral-900 lg:min-h-[calc(100svh-112px)]"
      >
        {/* Backdrop: formula spotlight, sweeping light beams, horizon, grain, vignette */}
        <div aria-hidden="true" className="mwp-particle__backdrop">
          <div className="mwp-particle__spot" />
          <div className="mwp-particle__beams">
            <span />
            <span />
            <span />
          </div>
          <div className="mwp-particle__floor" />
          <div className="mwp-particle__horizon" />
          <div className="mwp-particle__grain" />
          <div className="mwp-particle__vignette" />
        </div>

        {/* Particle stage */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
          {webgl && (
            <SceneBoundary onError={handleSceneError}>
              <MwpParticleScene
                formulas={FORMULAS}
                activeIndex={selected}
                anchorRef={anchorRef}
                pointerRef={pointerRef}
                scrollProgress={isDesktop ? scrollYProgress : anchorProgress}
                motionOn={motionOn}
                reduceMotion={reduceMotion}
                inView={inView && pageVisible}
                lite={lite}
                onReady={handleSceneReady}
              />
            </SceneBoundary>
          )}
        </div>

        <div className="relative mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 px-5 sm:px-10 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:grid-rows-[1fr_1fr] lg:gap-x-8">
          {/* Left: headline */}
          <motion.div
            className="relative z-[2] pt-10 text-center sm:pt-14 lg:col-start-1 lg:row-start-1 lg:self-end lg:pb-6 lg:pt-10 lg:text-left"
            style={scrollStyle({ x: leftX, opacity: sideOpacity })}
          >
            <motion.p
              className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/80 bg-white/60 py-1.5 pl-2 pr-4 text-[10px] uppercase tracking-[0.24em] text-neutral-600 backdrop-blur sm:text-[11px]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <span className="mwp-particle__badge">{total}</span>
              Men / Women / Power
            </motion.p>
            <h1 id="mwp-particle-title" className="mwp-particle__title">
              {TITLE_WORDS.map((words, line) => (
                <span key={line} className="block">
                  {words.map((word, index) => (
                    <motion.span
                      key={word + index}
                      className={`inline-block ${word === "power." ? "mwp-particle__shine" : ""} ${index < words.length - 1 ? "mr-[0.22em]" : ""}`}
                      initial={{ opacity: 0, y: "0.35em", filter: "blur(14px)" }}
                      animate={{ opacity: 1, y: "0em", filter: "blur(0px)" }}
                      transition={{ duration: 1, delay: 0.15 + (line * 2 + index) * 0.08, ease: EASE }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </span>
              ))}
            </h1>
          </motion.div>

          {/* Centre: particle bottle */}
          <div className="relative flex flex-col items-center justify-center py-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:py-6">
            <div className="relative flex w-full items-center justify-center">
              <motion.div
                ref={anchorRef}
                className="mwp-particle__anchor z-[2]"
                onPointerDownCapture={() => {
                  dragged.current = false;
                }}
                onPanStart={() => {
                  dragged.current = true;
                }}
                onPanEnd={(_, info) => {
                  if (Math.abs(info.offset.x) > 50 || Math.abs(info.velocity.x) > 450) move(info.offset.x < 0 ? 1 : -1);
                }}
                style={{ touchAction: "pan-y" }}
                {...holdProps}
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
                    sizes="(min-width: 1024px) 300px, 200px"
                    draggable={false}
                    className="mwp-particle__fallback object-contain object-bottom"
                  />
                </Link>
              </motion.div>

              <ControlButton label="Previous formula" onClick={() => move(-1)} className="absolute left-0 top-1/2 z-[3] -translate-y-1/2 lg:hidden">
                <IconChevronLeft className="h-4 w-4" stroke={1.5} />
              </ControlButton>
              <ControlButton label="Next formula" onClick={() => move(1)} className="absolute right-0 top-1/2 z-[3] -translate-y-1/2 lg:hidden">
                <IconChevronRight className="h-4 w-4" stroke={1.5} />
              </ControlButton>
            </div>
          </div>

          {/* Right: formula details */}
          <motion.div
            className="relative z-[2] pb-4 text-center lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:self-center lg:justify-self-end lg:pb-0 lg:text-left"
            style={scrollStyle({ x: rightX, opacity: sideOpacity })}
            {...holdProps}
          >
            <div className="mx-auto w-full max-w-[340px] lg:mx-0">
              <p className="flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.22em] text-neutral-500 lg:justify-start">
                <span className="tabular-nums text-neutral-900">{counter}</span>
                <span className="h-px w-10 bg-neutral-900/15" aria-hidden="true">
                  <span className="mwp-particle__meter block h-full" style={{ width: `${((selected + 1) / FORMULAS.length) * 100}%` }} />
                </span>
                <span className="tabular-nums">{total}</span>
              </p>
              <h2 className="mt-4 text-[34px] uppercase leading-none tracking-[0.02em] sm:text-[40px]">
                <DecodeText text={active.name} disabled={reduceMotion} />
              </h2>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[color:var(--particle-ink)]">{active.category}</p>
                  <p className="mt-1.5 text-[15px] text-neutral-800">{active.tag}</p>
                  <p className="mt-3 text-sm leading-6 text-neutral-600">{active.purpose}</p>
                </motion.div>
              </AnimatePresence>
              <Link href={`/products/${active.key}`} className="group mt-6 inline-flex items-center gap-3 text-sm text-neutral-900">
                Explore MWP {active.name}
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-900/20 transition-colors duration-300 group-hover:border-neutral-950 group-hover:bg-neutral-950 group-hover:text-white">
                  <IconArrowUpRight className="h-4 w-4" stroke={1.6} />
                </span>
              </Link>
            </div>
          </motion.div>

          {/* Left, lower: CTAs */}
          <motion.div
            className="relative z-[2] pb-10 pt-8 text-center lg:col-start-1 lg:row-start-2 lg:self-start lg:pb-8 lg:pt-0 lg:text-left"
            style={scrollStyle({ x: leftX, opacity: sideOpacity })}
          >
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.5, ease: EASE }}>
              <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link
                  href="/products"
                  className="mwp-particle__cta group relative inline-flex min-h-[52px] items-center gap-3 overflow-hidden rounded-full bg-neutral-950 px-7 text-sm text-white shadow-[0_18px_40px_-20px_rgba(0,0,0,0.55)] focus-visible:outline-offset-4"
                >
                  {t("shopNow")}
                  <IconArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" stroke={1.8} />
                </Link>
                <Link
                  href="/quiz"
                  className="group inline-flex min-h-[52px] items-center gap-3 rounded-full border border-neutral-900/15 bg-white/60 px-7 text-sm text-neutral-900 backdrop-blur transition-colors hover:border-neutral-900 focus-visible:outline-offset-4"
                >
                  {t("findYourFormula")}
                  <IconArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" stroke={1.5} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Formula rail */}
        <motion.div className="relative z-[3] mx-auto w-full max-w-[1440px] px-5 pb-6 sm:px-10 lg:pb-8" style={scrollStyle({ opacity: barOpacity })}>
          {/* Controls sit left of the rail — the site-wide advisor button floats over the bottom-right corner. */}
          <div className="flex items-center gap-4 border-t border-neutral-900/10 pt-4">
            <div className="order-first flex shrink-0 items-center gap-2">
              <ControlButton label="Previous formula" onClick={() => move(-1)} className="hidden lg:flex">
                <IconChevronLeft className="h-4 w-4" stroke={1.5} />
              </ControlButton>
              <ControlButton label="Pause animation" pressed={paused || reduceMotion} disabled={reduceMotion} onClick={() => setPaused(value => !value)}>
                {paused || reduceMotion ? <IconPlayerPlay className="h-4 w-4" /> : <IconPlayerPause className="h-4 w-4" />}
              </ControlButton>
              <ControlButton label="Next formula" onClick={() => move(1)} className="hidden lg:flex">
                <IconChevronRight className="h-4 w-4" stroke={1.5} />
              </ControlButton>
            </div>
            <div
              ref={railRef}
              role="group"
              aria-label="Choose a formula"
              className="mwp-particle__rail flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1 lg:justify-center"
              {...holdProps}
            >
              {FORMULAS.map((formula, index) => {
                const isActive = index === selected;
                return (
                  <button
                    key={formula.key}
                    type="button"
                    data-index={index}
                    onClick={() => setSelected(index)}
                    aria-pressed={isActive}
                    className={`group relative shrink-0 rounded-full px-3 py-2 text-[12px] tracking-[0.04em] transition-colors sm:text-[13px] ${isActive ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-900"}`}
                  >
                    <span className="mr-1.5 text-[9px] tabular-nums text-neutral-400">{String(index + 1).padStart(2, "0")}</span>
                    {formula.name}
                    <span aria-hidden="true" className="mwp-particle__preview">
                      <Image src={`/products/cutouts/${formula.key}.webp`} alt="" fill sizes="56px" className="object-contain" />
                    </span>
                    {isActive && (
                      <span aria-hidden="true" className="absolute inset-x-3 bottom-0.5 h-px overflow-hidden bg-neutral-900/10">
                        <span
                          key={`${selected}-${autoPlaying}`}
                          className={`block h-full w-full ${autoPlaying ? "mwp-particle__progress" : ""}`}
                          style={{ background: "var(--particle-glow)" }}
                        />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {/* Balances the controls so the rail stays centred on desktop. */}
            <div aria-hidden="true" className="hidden w-[136px] shrink-0 lg:block" />
          </div>
        </motion.div>

        <p className="sr-only" aria-live={autoPlaying ? "off" : "polite"} aria-atomic="true">
          Showing MWP {active.name}, {active.category}.
        </p>
      </section>
    </MotionConfig>
  );
}
