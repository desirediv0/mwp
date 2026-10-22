"use client";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { IconArrowRight, IconLock, IconPackage, IconPlayerPause, IconPlayerPlay, IconTruck } from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";
import { TRUST_CLAIMS } from "@/lib/trustClaims";
import "./mwp-capsule-hero.css";

// WebGL stage is client-only and streams in after hydration.
const MwpCapsuleScene = dynamic(() => import("./MwpCapsuleScene"), { ssr: false });

// If the scene is slow to arrive, start the headline anyway; the capsule then joins mid-timeline.
const PLAY_FALLBACK_MS = 1500;

// Short forms of the site's trust claims for the labels that float out of the capsule. Claims come
// from trustClaims.js so removing one there removes it here; long claims without a short form are skipped.
const SHORT_CLAIMS = [
  [/food and drug administration|\bfda\b/i, "FDA-Registered Facility"],
  [/cgmp/i, "cGMP-Compliant Facility"],
  [/globally sourced/i, "Globally Sourced Ingredients"],
];
const CAPSULE_WORDS = TRUST_CLAIMS.map(claim => SHORT_CLAIMS.find(([pattern]) => pattern.test(claim))?.[1] ?? (claim.length <= 26 ? claim : null)).filter(Boolean);

// Shopping reassurance that matches the return and shipping policies.
const ASSURANCES = [
  { label: "Free replacement if damaged", icon: IconPackage },
  { label: "Tracked shipping", icon: IconTruck },
  { label: "Secure checkout", icon: IconLock },
];

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

// Gold dust drifting up through the hero (2D canvas, like the reference).
function useGoldDust(canvasRef, active, reduceMotion) {
  const points = useRef([]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    let width = 0;
    let height = 0;
    let frame;
    const size = () => {
      const box = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = box.width;
      height = box.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.round(Math.min(70, width / 18));
      if (points.current.length !== count) {
        points.current = Array.from({ length: count }, () => ({
          x: Math.random() * width,
          y: Math.random() * height,
          r: 0.6 + Math.random() * 1.6,
          vx: (Math.random() - 0.5) * 0.15,
          vy: -0.08 - Math.random() * 0.22,
          p: Math.random() * 6,
          o: 0.25 + Math.random() * 0.45,
        }));
      }
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "#C9962E";
      for (const point of points.current) {
        if (active) point.p += 0.02;
        context.globalAlpha = point.o * (0.5 + 0.5 * Math.sin(point.p));
        context.beginPath();
        context.arc(point.x, point.y, point.r, 0, Math.PI * 2);
        context.fill();
        if (active && !reduceMotion) {
          point.x += point.vx;
          point.y += point.vy;
          if (point.y < -5) {
            point.y = height + 5;
            point.x = Math.random() * width;
          }
          if (point.x < -5) point.x = width + 5;
          if (point.x > width + 5) point.x = -5;
        }
      }
      if (active && !reduceMotion) frame = requestAnimationFrame(draw);
    };
    size();
    draw();
    const onResize = () => {
      size();
      if (!active || reduceMotion) draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, [canvasRef, active, reduceMotion]);
}

export default function MwpCapsuleHero() {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const dustRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const playStartRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [webgl, setWebgl] = useState(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [open, setOpen] = useState(false);

  const motionOn = !paused && !reduceMotion;
  const startPlaying = useCallback(() => {
    if (playStartRef.current === null) playStartRef.current = performance.now();
    setPlaying(true);
  }, []);
  const handleSceneError = useCallback(() => {
    setWebgl(false);
    startPlaying();
  }, [startPlaying]);

  useGoldDust(dustRef, motionOn && inView && pageVisible, reduceMotion);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(query.matches);
    update();
    query.addEventListener("change", update);
    let supported = false;
    try {
      supported = !!document.createElement("canvas").getContext("webgl2");
    } catch {
      supported = false;
    }
    setWebgl(supported);
    // Without WebGL (or with reduced motion) there is nothing to wait for.
    if (!supported || query.matches) startPlaying();
    const fallback = window.setTimeout(startPlaying, PLAY_FALLBACK_MS);
    return () => {
      query.removeEventListener("change", update);
      window.clearTimeout(fallback);
    };
  }, [startPlaying]);

  useEffect(() => {
    const onVisibilityChange = () => setPageVisible(!document.hidden);
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onScroll = () => {
      scrollRef.current = Math.min(window.scrollY / 600, 1.5);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const section = sectionRef.current;
    let observer;
    if (section && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "80px 0px" });
      observer.observe(section);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  // The capsule turns gently toward a mouse pointer (not on touch).
  const handlePointerMove = event => {
    if (event.pointerType !== "mouse" || !stageRef.current) return;
    const box = stageRef.current.getBoundingClientRect();
    pointerRef.current = {
      x: (event.clientX - (box.left + box.width / 2)) / box.width,
      y: (event.clientY - (box.top + box.height / 2)) / box.height,
    };
  };
  const handlePointerLeave = () => {
    pointerRef.current = { x: 0, y: 0 };
  };

  return (
    <section
      ref={sectionRef}
      aria-labelledby="mwp-capsule-title"
      data-play={playing}
      data-motion={motionOn ? "on" : "off"}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="mwp-capsule"
    >
      <canvas ref={dustRef} className="mwp-capsule__dust" aria-hidden="true" />

      <div className="mwp-capsule__grid">
        <div>
          <p className="mwp-capsule__kicker">Daily supplements</p>
          <h1 id="mwp-capsule-title" className="mwp-capsule__title">
            <span className="mwp-capsule__line mwp-capsule__line--men">
              <span>Strength for him.</span>
            </span>{" "}
            <span className="mwp-capsule__line mwp-capsule__line--women">
              <span>Energy for her.</span>
            </span>{" "}
            <span className="mwp-capsule__line mwp-capsule__line--power">
              <span>Power for both.</span>
            </span>
          </h1>
          <p className="mwp-capsule__lede">
            Daily formulas for men and women, manufactured in the USA in a cGMP-compliant facility with globally sourced ingredients.
          </p>
          <div className="mwp-capsule__ctas">
            <Link href="/products" className="mwp-capsule__btn mwp-capsule__btn--primary">
              {t("shopNow")}
              <IconArrowRight stroke={2.2} aria-hidden="true" />
            </Link>
            <Link href="/quiz" className="mwp-capsule__btn mwp-capsule__btn--outline">
              {t("findYourFormula")}
            </Link>
          </div>
          <ul className="mwp-capsule__assure">
            {ASSURANCES.map(({ label, icon: Icon }) => (
              <li key={label}>
                <Icon stroke={2} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mwp-capsule__stage-wrap">
          <div ref={stageRef} className="mwp-capsule__stage" data-open={open} aria-hidden="true">
            <div className="mwp-capsule__orbit" />
            <div className="mwp-capsule__halo" />
            <div className="mwp-capsule__ripple" />
            <div className="mwp-capsule__ripple mwp-capsule__ripple--2" />
            <div className="mwp-capsule__ripple mwp-capsule__ripple--3" />
            <div className="mwp-capsule__floor" />

            {webgl && (
              <div className="mwp-capsule__gl">
                <SceneBoundary onError={handleSceneError}>
                  <MwpCapsuleScene
                    words={CAPSULE_WORDS}
                    pointerRef={pointerRef}
                    scrollRef={scrollRef}
                    playStartRef={playStartRef}
                    onPlay={startPlaying}
                    onOpenChange={setOpen}
                    motionOn={motionOn}
                    reduceMotion={reduceMotion}
                    inView={inView && pageVisible}
                  />
                </SceneBoundary>
              </div>
            )}

            {webgl === false && (
              <>
                <div className="mwp-capsule__css">
                  <div className="mwp-capsule__css-float">
                    <div className="mwp-capsule__css-body">
                      <i className="mwp-capsule__half mwp-capsule__half--l" />
                      <i className="mwp-capsule__half mwp-capsule__half--r" />
                      <i className="mwp-capsule__seam" />
                      <b className="mwp-capsule__mark">MWP</b>
                    </div>
                  </div>
                </div>
                <div className="mwp-capsule__flash" />
              </>
            )}

            <span className="mwp-capsule__label mwp-capsule__label--men">Men</span>
            <span className="mwp-capsule__label mwp-capsule__label--women">Women</span>
            <span className="mwp-capsule__label mwp-capsule__label--power">Power</span>
          </div>

          <button
            type="button"
            className="mwp-capsule__pause"
            onClick={() => setPaused(value => !value)}
            aria-label="Pause animation"
            aria-pressed={paused || reduceMotion}
            disabled={reduceMotion}
          >
            {paused || reduceMotion ? <IconPlayerPlay className="h-4 w-4" /> : <IconPlayerPause className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </section>
  );
}
