"use client";

import { Component, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { IconArrowRight, IconLock, IconPackage, IconTruck } from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";
import { TRUST_CLAIMS } from "@/lib/trustClaims";
import "./mwp-capsule-plus.css";

// Interactive take on MwpCapsuleHero: same layout and copy, plus headline lines that light up their
// capsule half, drag-to-spin, tap or scroll to open, and one shared lock beat.

// WebGL stage is client-only and streams in after hydration.
const MwpCapsulePlusScene = dynamic(() => import("./MwpCapsulePlusScene"), { ssr: false });

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

export default function MwpCapsuleHeroPlus() {
  const { t } = useLanguage();
  const sectionRef = useRef(null);
  const stageRef = useRef(null);
  const dustRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const playStartRef = useRef(null);
  const floorRef = useRef(null);
  // Mutable state the scene reads every frame (avoids re-rendering the canvas on each pointer move).
  const interactionRef = useRef({ focus: null, manualOpen: false, drag: { active: false, dx: 0, dy: 0 }, invalidate: null });
  const pressRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [webgl, setWebgl] = useState(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState(null);
  const [beat, setBeat] = useState(0);
  const [dragging, setDragging] = useState(false);

  const motionOn = !reduceMotion;
  const startPlaying = useCallback(() => {
    if (playStartRef.current === null) playStartRef.current = performance.now();
    setPlaying(true);
  }, []);
  const handleBeat = useCallback(() => setBeat(value => value + 1), []);
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

  const poke = () => interactionRef.current.invalidate?.();

  // Hovering a headline line focuses its capsule half (mouse only; touch has no hover).
  const focusLine = line => ({
    onPointerEnter: event => {
      if (event.pointerType !== "mouse" || reduceMotion) return;
      interactionRef.current.focus = line;
      setFocus(line);
      poke();
    },
    onPointerLeave: () => {
      interactionRef.current.focus = null;
      setFocus(null);
      poke();
    },
  });

  // Tapping the capsule opens it (and tapping again closes it); the scene reads this every frame.
  const toggleOpen = () => {
    interactionRef.current.manualOpen = !interactionRef.current.manualOpen;
    poke();
  };

  // Press on the capsule: a horizontal drag spins it, a tap opens / closes it.
  const stageHandlers = {
    onPointerDown: event => {
      if (event.button !== 0) return;
      pressRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false };
    },
    onPointerMove: event => {
      const press = pressRef.current;
      if (!press || press.id !== event.pointerId) return;
      if (!press.moved && Math.hypot(event.clientX - press.x, event.clientY - press.y) > 6) {
        press.moved = true;
        event.currentTarget.setPointerCapture?.(event.pointerId);
        interactionRef.current.drag.active = true;
        setDragging(true);
      }
      if (press.moved) {
        interactionRef.current.drag.dx += event.clientX - press.lastX;
        interactionRef.current.drag.dy += event.clientY - press.lastY;
        poke();
      }
      press.lastX = event.clientX;
      press.lastY = event.clientY;
    },
    onPointerUp: event => {
      const press = pressRef.current;
      if (!press || press.id !== event.pointerId) return;
      pressRef.current = null;
      interactionRef.current.drag.active = false;
      setDragging(false);
      if (!press.moved) toggleOpen();
      poke();
    },
    onPointerCancel: () => {
      pressRef.current = null;
      interactionRef.current.drag.active = false;
      setDragging(false);
    },
  };

  const beatKey = beat === 0 ? undefined : beat % 2 ? "a" : "b";

  return (
    <section
      ref={sectionRef}
      aria-labelledby="mwp-cplus-title"
      data-play={playing}
      data-focus={focus ?? undefined}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="mwp-cplus"
    >
      <canvas ref={dustRef} className="mwp-cplus__dust" aria-hidden="true" />

      <div className="mwp-cplus__grid">
        <div>
          <p className="mwp-cplus__kicker">Daily supplements</p>
          <h1 id="mwp-cplus-title" className="mwp-cplus__title">
            <span className="mwp-cplus__line mwp-cplus__line--men" {...focusLine("men")}>
              <span>Strength for him</span>
            </span>{" "}
            <span className="mwp-cplus__line mwp-cplus__line--women" {...focusLine("women")}>
              <span>Energy for her</span>
            </span>{" "}
            <span className="mwp-cplus__line mwp-cplus__line--power" {...focusLine("both")}>
              <span data-beat={beatKey}>Power for both</span>
            </span>
          </h1>
          <p className="mwp-cplus__lede">
            Daily formulas for men and women, manufactured in the USA in a cGMP-compliant facility with globally sourced ingredients.
          </p>
          <div className="mwp-cplus__ctas">
            <Link href="/products" className="mwp-cplus__btn mwp-cplus__btn--primary">
              {t("shopNow")}
              <IconArrowRight stroke={2.2} aria-hidden="true" />
            </Link>
            <Link href="/quiz" className="mwp-cplus__btn mwp-cplus__btn--outline">
              {t("findYourFormula")}
            </Link>
          </div>
          <ul className="mwp-cplus__assure">
            {ASSURANCES.map(({ label, icon: Icon }) => (
              <li key={label}>
                <Icon stroke={2} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="mwp-cplus__stage-wrap" data-open={open}>
          <div ref={stageRef} className="mwp-cplus__stage" data-open={open} data-dragging={dragging} aria-hidden="true" {...stageHandlers}>
            <div className="mwp-cplus__orbit" />
            <div className="mwp-cplus__halo" />
            {/* Ripples replay on every lock beat */}
            {beat > 0 && (
              <div key={beat} className="mwp-cplus__ripples">
                <div className="mwp-cplus__ripple" />
                <div className="mwp-cplus__ripple mwp-cplus__ripple--2" />
                <div className="mwp-cplus__ripple mwp-cplus__ripple--3" />
              </div>
            )}
            <div ref={floorRef} className="mwp-cplus__floor" />

            {webgl && (
              <div className="mwp-cplus__gl">
                <SceneBoundary onError={handleSceneError}>
                  <MwpCapsulePlusScene
                    words={CAPSULE_WORDS}
                    pointerRef={pointerRef}
                    scrollRef={scrollRef}
                    interactionRef={interactionRef}
                    floorRef={floorRef}
                    playStartRef={playStartRef}
                    onPlay={startPlaying}
                    onOpenChange={setOpen}
                    onBeat={handleBeat}
                    motionOn={motionOn}
                    reduceMotion={reduceMotion}
                    inView={inView && pageVisible}
                  />
                </SceneBoundary>
              </div>
            )}

            {webgl === false && (
              <>
                <div className="mwp-cplus__css">
                  <div className="mwp-cplus__css-float">
                    <div className="mwp-cplus__css-body">
                      <i className="mwp-cplus__half mwp-cplus__half--l" />
                      <i className="mwp-cplus__half mwp-cplus__half--r" />
                      <i className="mwp-cplus__seam" />
                      <b className="mwp-cplus__mark">MWP</b>
                    </div>
                  </div>
                </div>
                <div className="mwp-cplus__flash" />
              </>
            )}

            <span className="mwp-cplus__label mwp-cplus__label--men">Men</span>
            <span className="mwp-cplus__label mwp-cplus__label--women">Women</span>
            <span className="mwp-cplus__label mwp-cplus__label--power" data-beat={beatKey}>
              Power
            </span>
          </div>

          <p className="sr-only" aria-live="polite">
            {open ? `Inside every MWP formula: ${CAPSULE_WORDS.join(", ")}.` : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
