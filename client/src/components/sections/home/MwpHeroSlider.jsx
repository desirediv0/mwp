"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";
import { IconArrowRight, IconChevronLeft, IconChevronRight, IconLock, IconMapPin, IconPackage, IconRotate360, IconTruck } from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";
import { INGREDIENT_LIBRARY } from "@/lib/ingredient-library";
import "./mwp-hero-slider.css";

// Home hero slider built from the client's three hero references (homepage hero, 3D banner, slider).
// Bottles are the new 8-angle renders in /public/hero/bottles (Power Max, Rapid Boost, Her Power).

// Bundled locally so the build never depends on reaching Google Fonts.
const display = localFont({
  src: [
    { path: "../../../app/fonts/playfair/PlayfairDisplay-latin.woff2", style: "normal", weight: "700 900" },
    { path: "../../../app/fonts/playfair/PlayfairDisplay-latin-italic.woff2", style: "italic", weight: "700 900" },
  ],
  variable: "--mhs-display",
  display: "swap",
});

const SLIDE_MS = 6500;
const WIPE_MS = 950;
const ANGLES = 8;
const frameSrc = (slug, n) => `/hero/bottles/${slug}/${String(n + 1).padStart(2, "0")}.webp`;

// Copy and benefits are taken from the bottle labels; the asterisks pair with the FDA note on each slide.
const BOTTLES = {
  "power-max": {
    name: "Power Max",
    tagline: "Unleash your power",
    line: "Men's performance formula · 90 capsules",
    benefits: ["Maximum Performance Support*", "Powerful Blood Flow Support*", "Peak Stamina & Endurance*", "Intense Energy Output*"],
  },
  "rapid-boost": {
    name: "Rapid Boost",
    tagline: "Step up. Stand out.",
    line: "Men's performance formula · 90 capsules",
    benefits: ["Supports Energy & Stamina*", "Supports Healthy Blood Flow*", "Supports Physical Performance*", "Supports Mental Focus*"],
  },
  "her-power": {
    name: "Her Power",
    tagline: "Her wellness. Her way.",
    line: "Women's wellness formula · 90 capsules",
    benefits: ["Supports Women's Daily Wellness*", "Supports Normal Energy Metabolism*", "Supports a Healthy Stress Response*", "Supports Bone & Muscle Health*"],
  },
};

const FDA_NOTE =
  "*These statements have not been evaluated by the Food and Drug Administration. These products are not intended to diagnose, treat, cure, or prevent any disease.";

// Same titles and icons as the trust strip below the hero.
const TRUST = [
  { icon: "fda", title: "FDA-Registered Facility" },
  { icon: "cgmp", title: "cGMP-Compliant Facility" },
  { icon: "lab", title: "Third-Party Lab Tested" },
  { icon: "usa", title: "Made in the USA" },
  { icon: "vegan", title: "100% Vegan" },
  { icon: "nongmo", title: "Non-GMO Ingredients" },
];

// Six final-formula ingredients from six countries. Photos and origins come from the ingredient library
// (/public/ingredients/<id>.jpg), and any ingredient dropped from the library drops out here too.
const INGREDIENTS = [
  { id: "1-1", label: "Ashwagandha", pos: { left: "14%", top: "4%" }, delay: 0.3 },
  { id: "1-3", label: "Tongkat Ali", pos: { left: "2%", top: "38%" }, delay: 0.38 },
  { id: "2-2", label: "Saffron", pos: { left: "13%", top: "70%" }, delay: 0.46 },
  { id: "1-8", label: "Vitamin K2", pos: { right: "13%", top: "4%" }, delay: 0.34 },
  { id: "2-4", label: "Panax Ginseng", pos: { right: "2%", top: "38%" }, delay: 0.42 },
  { id: "3-3", label: "Pine Bark", pos: { right: "13%", top: "70%" }, delay: 0.5 },
]
  .map(item => ({ ...item, origin: INGREDIENT_LIBRARY.find(entry => entry.id === item.id)?.origin }))
  .filter(item => item.origin);

const SLIDES = [
  { key: "daily", label: "Daily", aria: "Daily supplements" },
  { key: "him", label: "For Him", aria: "For him", dark: true },
  { key: "ingredients", label: "Ingredients", aria: "Ingredients" },
  { key: "proof", label: "Proof", aria: "Proof" },
];

function Check() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" />
      <path d="M7 12.5l3.2 3.2L17 9" />
    </svg>
  );
}

function Arrow() {
  return (
    <svg viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M0 6h24M19 1l5 5-5 5" />
    </svg>
  );
}

// `desktopOnly` pills are dropped on small screens, where four pills would crowd the bottles.
function Pill({ children, style, delay, desktopOnly = false }) {
  return (
    <span className={`mhs-pill mhs-pop${desktopOnly ? " mhs-pill--desk" : ""}`} style={{ ...style, "--d": `${delay}s` }}>
      <Check />
      {children}
    </span>
  );
}

// A still bottle (one angle) positioned inside the visual column.
function Bottle({ slug, angle = 0, style, className = "", priority = false, delay = 0.25, sizes = "(min-width: 980px) 420px, 60vw" }) {
  return (
    <div className={`mhs-bottle mhs-rise ${className}`} style={{ ...style, "--d": `${delay}s` }}>
      <Image src={frameSrc(slug, angle)} alt="" width={816} height={1100} sizes={sizes} priority={priority} draggable={false} />
    </div>
  );
}

// 360° turntable built from the eight renders: neighbouring angles cross-fade, so dragging feels continuous.
// Each time its slide becomes active it spins one full turn and lands on the front label.
function Turntable({ slug, active, warm, reduceMotion, style, delay = 0.3, onDragChange }) {
  const imgs = useRef([]);
  const state = useRef({ angle: 0, target: 0, raf: 0, drag: null, idle: 0 });
  const [dragging, setDragging] = useState(false);

  const paint = useCallback(angle => {
    const a = ((angle % ANGLES) + ANGLES) % ANGLES;
    const base = Math.floor(a);
    const next = (base + 1) % ANGLES;
    const mix = a - base;
    imgs.current.forEach((img, i) => {
      if (!img) return;
      img.style.opacity = i === base ? String(1 - mix) : i === next ? String(mix) : "0";
    });
  }, []);

  const animateTo = useCallback(
    (target, ms) => {
      const s = state.current;
      cancelAnimationFrame(s.raf);
      if (reduceMotion || ms === 0) {
        s.angle = target;
        paint(target);
        return;
      }
      const from = s.angle;
      const start = performance.now();
      const step = now => {
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        s.angle = from + (target - from) * eased;
        paint(s.angle);
        if (t < 1) s.raf = requestAnimationFrame(step);
      };
      s.raf = requestAnimationFrame(step);
    },
    [paint, reduceMotion]
  );

  // Spin in on activation, once all eight angles are available.
  useEffect(() => {
    const s = state.current;
    if (!active || !warm) return;
    s.angle = -ANGLES;
    paint(s.angle);
    const timer = window.setTimeout(() => animateTo(0, 1400), (delay + 0.35) * 1000);
    return () => window.clearTimeout(timer);
  }, [active, warm, delay, animateTo, paint]);

  useEffect(() => {
    const s = state.current;
    return () => {
      cancelAnimationFrame(s.raf);
      window.clearTimeout(s.idle);
    };
  }, []);

  const onPointerDown = event => {
    if (!warm || event.button !== 0) return;
    const s = state.current;
    cancelAnimationFrame(s.raf);
    window.clearTimeout(s.idle);
    s.drag = { x: event.clientX, angle: s.angle, id: event.pointerId, moved: false };
  };
  const onPointerMove = event => {
    const s = state.current;
    if (!s.drag || s.drag.id !== event.pointerId) return;
    const dx = event.clientX - s.drag.x;
    if (!s.drag.moved && Math.abs(dx) > 4) {
      s.drag.moved = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragging(true);
      onDragChange?.(true);
    }
    if (s.drag.moved) {
      // About 70px of drag per 45° step.
      s.angle = s.drag.angle - dx / 70;
      paint(s.angle);
    }
  };
  const release = () => {
    const s = state.current;
    if (!s.drag) return;
    const moved = s.drag.moved;
    s.drag = null;
    if (!moved) return;
    setDragging(false);
    onDragChange?.(false);
    animateTo(Math.round(s.angle), 350);
    // After a pause, turn back to the front label.
    s.idle = window.setTimeout(() => {
      const nearestFront = Math.round(state.current.angle / ANGLES) * ANGLES;
      animateTo(nearestFront, 900);
    }, 2600);
  };

  return (
    <div
      className="mhs-bottle mhs-turn mhs-rise"
      style={{ ...style, "--d": `${delay}s` }}
      data-dragging={dragging}
      data-no-swipe=""
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={release}
      onPointerCancel={release}
    >
      {Array.from({ length: warm ? ANGLES : 1 }, (_, i) => (
        <Image
          key={i}
          ref={el => {
            imgs.current[i] = el;
          }}
          src={frameSrc(slug, i)}
          alt=""
          width={816}
          height={1100}
          sizes="(min-width: 980px) 460px, 70vw"
          draggable={false}
        />
      ))}
      <span className="mhs-chip" aria-hidden="true">
        <IconRotate360 stroke={1.8} /> Drag to rotate
      </span>
    </div>
  );
}

export default function MwpHeroSlider() {
  const { t } = useLanguage();
  const rootRef = useRef(null);
  const frameRef = useRef(null);
  const slideRefs = useRef([]);
  const timer = useRef({ id: 0, started: 0, left: SLIDE_MS });
  const swipe = useRef(null);
  const currentRef = useRef(0);

  const [current, setCurrent] = useState(0);
  const [leaving, setLeaving] = useState(null);
  const [direction, setDirection] = useState(1);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [warm, setWarm] = useState(false);

  const paused = hovered || focused || dragging || !inView || !pageVisible || reduceMotion;

  const go = useCallback((target, dir) => {
    const prev = currentRef.current;
    const next = (target + SLIDES.length) % SLIDES.length;
    if (next === prev) return;
    currentRef.current = next;
    timer.current.left = SLIDE_MS;
    setDirection(dir ?? (next > prev ? 1 : -1));
    setLeaving(prev);
    setCurrent(next);
  }, []);

  // Clear the outgoing slide once the wipe has covered it.
  useEffect(() => {
    if (leaving === null) return;
    const id = window.setTimeout(() => setLeaving(null), reduceMotion ? 0 : WIPE_MS + 20);
    return () => window.clearTimeout(id);
  }, [leaving, reduceMotion]);

  // Autoplay that remembers how much of the current slide is left when it pauses.
  useEffect(() => {
    const t0 = timer.current;
    if (paused) return;
    const slide = current;
    t0.started = performance.now();
    t0.id = window.setTimeout(() => go(slide + 1, 1), t0.left);
    return () => {
      window.clearTimeout(t0.id);
      // Only a pause keeps the remaining time; a slide change has already reset it.
      if (currentRef.current === slide) t0.left = Math.max(400, t0.left - (performance.now() - t0.started));
    };
  }, [paused, current, go]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    let observer;
    if (rootRef.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
      observer.observe(rootRef.current);
    }
    // Load the other seven angles of each bottle once the page has settled.
    const warmUp = window.setTimeout(() => setWarm(true), 1800);
    return () => {
      query.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibility);
      observer?.disconnect();
      window.clearTimeout(warmUp);
    };
  }, []);

  // Hidden slides are inert so their links can't be tabbed to.
  useEffect(() => {
    slideRefs.current.forEach((el, i) => {
      if (el) el.inert = i !== current;
    });
  }, [current]);

  // Mouse-follow 3D tilt, written straight to CSS variables (no re-render).
  const onMouseMove = event => {
    const frame = frameRef.current;
    if (!frame || event.pointerType === "touch") return;
    const box = frame.getBoundingClientRect();
    frame.style.setProperty("--mx", (((event.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
    frame.style.setProperty("--my", (((event.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
  };
  const onMouseLeave = () => {
    frameRef.current?.style.setProperty("--mx", "0");
    frameRef.current?.style.setProperty("--my", "0");
    setHovered(false);
  };

  // Horizontal swipe on touch screens (not when the gesture starts on a turntable).
  const onTouchStart = event => {
    if (event.target.closest?.("[data-no-swipe]")) return;
    swipe.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  };
  const onTouchEnd = event => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) go(current + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  };

  const slideClass = i => {
    const classes = ["mhs-slide", `mhs-s${i + 1}`];
    if (i === current) classes.push("is-on");
    if (i === current && leaving !== null && !reduceMotion) classes.push("is-entering");
    if (i === leaving && !reduceMotion) classes.push("is-leaving");
    return classes.join(" ");
  };
  const slideProps = i => ({
    ref: el => {
      slideRefs.current[i] = el;
    },
    className: slideClass(i),
    role: "group",
    "aria-roledescription": "slide",
    "aria-label": `${i + 1} of ${SLIDES.length}: ${SLIDES[i].aria}`,
    "aria-hidden": i !== current,
    style: { "--ox": direction > 0 ? "100%" : "0%", "--lx": direction > 0 ? "-70px" : "70px" },
  });
  const tabState = i => (i < current ? "done" : i === current ? (reduceMotion ? "active-static" : "active") : "todo");

  return (
    <section
      ref={rootRef}
      className={`mhs ${display.variable}`}
      aria-roledescription="carousel"
      aria-label="MWP Supplements"
      data-theme={SLIDES[current].dark ? "dark" : "light"}
      data-paused={paused}
      style={{ "--dur": `${SLIDE_MS}ms` }}
    >
      <div
        ref={frameRef}
        className="mhs-frame"
        onPointerMove={onMouseMove}
        onPointerEnter={event => event.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={onMouseLeave}
        onFocus={() => setFocused(true)}
        onBlur={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="mhs-stack">
          {/* 1 — Daily (homepage hero reference) */}
          <article {...slideProps(0)}>
            <div className="mhs-inner">
              <div className="mhs-text">
                <p className="mhs-tag mhs-a">Daily supplements</p>
                <h1 className="mhs-h mhs-a" style={{ "--d": "0.06s" }}>
                  <span className="mhs-l1">You&apos;ve felt it.</span> <span className="mhs-l2">You&apos;re not alone.</span>{" "}
                  <span className="mhs-l3">This is for you.</span>
                </h1>
                <p className="mhs-sub mhs-a" style={{ "--d": "0.14s" }}>
                  Daily formulas for men and women, manufactured in the USA in a cGMP-compliant facility with globally sourced ingredients.
                </p>
                <div className="mhs-btns mhs-a" style={{ "--d": "0.22s" }}>
                  <Link href="/products" className="mhs-btn">
                    {t("shopNow")} <Arrow />
                  </Link>
                  <Link href="/quiz" className="mhs-btn mhs-btn--line">
                    {t("findYourFormula")}
                  </Link>
                </div>
                <ul className="mhs-assure mhs-a" style={{ "--d": "0.3s" }}>
                  <li>
                    <IconPackage stroke={1.8} aria-hidden="true" /> Free replacement if damaged
                  </li>
                  <li>
                    <IconTruck stroke={1.8} aria-hidden="true" /> Tracked shipping
                  </li>
                  <li>
                    <IconLock stroke={1.8} aria-hidden="true" /> Secure checkout
                  </li>
                </ul>
                <p className="mhs-fda mhs-a" style={{ "--d": "0.36s" }}>
                  {FDA_NOTE}
                </p>
              </div>
              <div className="mhs-vis" aria-hidden="true">
                <div className="mhs-tilt">
                  <div className="mhs-glow" />
                  <Bottle slug="rapid-boost" angle={1} priority className="mhs-bottle--back" delay={0.32} style={{ "--x": "27%", "--h": "70%", "--b": "9%" }} />
                  <Bottle slug="her-power" angle={7} priority className="mhs-bottle--back" delay={0.4} style={{ "--x": "73%", "--h": "70%", "--b": "9%" }} />
                  <Bottle slug="power-max" priority delay={0.24} style={{ "--x": "50%", "--h": "88%", "--b": "0%", "--z": "50px" }} />
                  <Pill delay={0.6} style={{ left: "0%", top: "6%" }}>
                    Peak Stamina &amp; Endurance*
                  </Pill>
                  <Pill delay={0.72} desktopOnly style={{ right: "-2%", top: "13%" }}>
                    Supports Women&apos;s Daily Wellness*
                  </Pill>
                  <Pill delay={0.84} desktopOnly style={{ left: "-4%", top: "84%" }}>
                    Supports Mental Focus*
                  </Pill>
                  <Pill delay={0.96} style={{ right: "-4%", top: "90%" }}>
                    Supports Bone &amp; Muscle Health*
                  </Pill>
                </div>
              </div>
            </div>
          </article>

          {/* 2 — For Him (slider reference, navy) */}
          <article {...slideProps(1)}>
            <div className="mhs-inner">
              <div className="mhs-text">
                <p className="mhs-tag mhs-a">For him</p>
                <h2 className="mhs-h mhs-a" style={{ "--d": "0.06s" }}>
                  Built for the man <em>who shows up.</em>
                </h2>
                <ul className="mhs-rows">
                  {["power-max", "rapid-boost"].map((slug, i) => (
                    <li key={slug} className="mhs-a" style={{ "--d": `${0.18 + i * 0.07}s` }}>
                      <Link href={`/products/${slug}`} className="mhs-row">
                        <span>
                          <b>{BOTTLES[slug].name}</b>
                          <small>
                            {BOTTLES[slug].tagline} · {BOTTLES[slug].line}
                          </small>
                        </span>
                        <span className="mhs-row-go" aria-hidden="true">
                          <IconArrowRight stroke={1.8} size={18} />
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="mhs-btns mhs-a" style={{ "--d": "0.34s" }}>
                  <Link href="/products" className="mhs-btn">
                    Shop Men&apos;s Formulas <Arrow />
                  </Link>
                </div>
                <p className="mhs-fda mhs-a" style={{ "--d": "0.42s" }}>
                  {FDA_NOTE}
                </p>
              </div>
              <div className="mhs-vis" aria-hidden="true">
                <div className="mhs-tilt">
                  <div className="mhs-glow" />
                  <Bottle slug="rapid-boost" angle={1} className="mhs-bottle--back" delay={0.22} style={{ "--x": "24%", "--h": "66%", "--b": "11%" }} />
                  <Turntable
                    slug="power-max"
                    active={current === 1}
                    warm={warm}
                    reduceMotion={reduceMotion}
                    onDragChange={setDragging}
                    delay={0.3}
                    style={{ "--x": "58%", "--h": "84%", "--b": "6%", "--z": "50px" }}
                  />
                  {BOTTLES["power-max"].benefits.map((benefit, i) => (
                    <Pill
                      key={benefit}
                      delay={0.7 + i * 0.12}
                      desktopOnly={i % 2 === 1}
                      style={[{ left: "-2%", top: "0%" }, { right: "2%", top: "1%" }, { left: "-4%", top: "80%" }, { left: "-4%", top: "90%" }][i]}
                    >
                      {benefit}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* 3 — Ingredients (3D banner + slider references) */}
          <article {...slideProps(2)}>
            <div className="mhs-inner">
              <div className="mhs-text">
                <p className="mhs-tag mhs-a">Traceable by design</p>
                <h2 className="mhs-h mhs-a" style={{ "--d": "0.06s" }}>
                  Ingredients from <em>around the world.</em>
                </h2>
                <p className="mhs-sub mhs-a" style={{ "--d": "0.12s" }}>
                  Ashwagandha from India, Tongkat Ali from Malaysia, Vitamin K2 from Japan. Every origin is listed.
                </p>
                <div className="mhs-btns mhs-a" style={{ "--d": "0.2s" }}>
                  <Link href="/ingredients" className="mhs-btn">
                    Explore All {INGREDIENT_LIBRARY.length} Ingredients <Arrow />
                  </Link>
                </div>
              </div>
              <div className="mhs-vis" aria-hidden="true">
                <div className="mhs-tilt">
                  <div className="mhs-glow" />
                  <Bottle slug="power-max" angle={0} delay={0.22} style={{ "--x": "50%", "--h": "82%", "--b": "4%" }} />
                  {INGREDIENTS.map(item => (
                    <div key={item.id} className="mhs-ing mhs-pop" style={{ ...item.pos, "--d": `${item.delay}s` }}>
                      <div className="mhs-float" style={{ animationDelay: `${item.delay * -6}s` }}>
                        <div className="mhs-ing-photo">
                          <Image src={`/ingredients/${item.id}.jpg`} alt="" width={560} height={560} sizes="124px" />
                        </div>
                        <div className="mhs-ing-label">
                          <b>{item.label}</b>
                          <small>
                            <IconMapPin stroke={2.2} /> {item.origin}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>

          {/* 4 — Proof (3D banner + slider references) */}
          <article {...slideProps(3)}>
            <div className="mhs-inner">
              <div className="mhs-text">
                <p className="mhs-tag mhs-a">Our promise</p>
                <h2 className="mhs-h mhs-a" style={{ "--d": "0.06s" }}>
                  Proof before <em>promises.</em>
                </h2>
                <p className="mhs-sub mhs-a" style={{ "--d": "0.12s" }}>
                  Scan the QR code on any MWP bottle to see its details and testing documents.
                </p>
                <ul className="mhs-badges">
                  {TRUST.map((item, i) => (
                    <li key={item.icon} className="mhs-badge mhs-a" style={{ "--d": `${0.18 + i * 0.05}s`, "--ic": `url(/trust/${item.icon}.svg)` }}>
                      <i aria-hidden="true" />
                      {item.title}
                    </li>
                  ))}
                </ul>
                <div className="mhs-btns mhs-a" style={{ "--d": "0.5s" }}>
                  <Link href="/certificates" className="mhs-btn">
                    See the Certificate Wall <Arrow />
                  </Link>
                </div>
              </div>
              <div className="mhs-vis" aria-hidden="true">
                <div className="mhs-tilt">
                  <div className="mhs-glow" />
                  {/* Angle 03 shows the QR panel on the label */}
                  <Bottle slug="her-power" angle={2} delay={0.24} style={{ "--x": "34%", "--h": "86%", "--b": "2%" }} />
                  <div className="mhs-phone mhs-pop" style={{ "--d": "0.4s" }}>
                    <div className="mhs-screen">
                      <Image src="/mwp-logo-3.png" alt="" width={779} height={266} sizes="90px" className="mhs-screen-logo" />
                      <div className="mhs-qr">
                        {/* eslint-disable-next-line @next/next/no-img-element -- SVG QR, no optimisation needed */}
                        <img src="/certificates-qr.svg" alt="" width={176} height={176} />
                        <span className="mhs-scan" />
                      </div>
                      <b>Scan for trust &amp; testing</b>
                      <small>Product details, ingredients and available testing documents.</small>
                      <span className="mhs-screen-btn">View documents</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div className="mhs-ui">
          <div className="mhs-tabs" role="group" aria-label="Choose a slide">
            {SLIDES.map((slide, i) => (
              <button
                key={slide.key}
                type="button"
                className="mhs-tab"
                data-state={tabState(i)}
                aria-current={i === current}
                aria-label={`Go to slide ${i + 1}: ${slide.label}`}
                onClick={() => go(i)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{slide.label}</b>
                <i key={i === current ? `on-${current}` : "off"} />
              </button>
            ))}
          </div>
          <div className="mhs-right">
            <span className="mhs-count" aria-live={paused ? "polite" : "off"}>
              {String(current + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
            </span>
            <div className="mhs-arrows">
              <button type="button" className="mhs-arrow" aria-label="Previous slide" onClick={() => go(current - 1, -1)}>
                <IconChevronLeft stroke={2.4} />
              </button>
              <button type="button" className="mhs-arrow" aria-label="Next slide" onClick={() => go(current + 1, 1)}>
                <IconChevronRight stroke={2.4} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
