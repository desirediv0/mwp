"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { IconArrowUp } from "@tabler/icons-react";

/* ── Smooth scrolling (Lenis) ─────────────────────────── */
function SmoothScroll() {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reduceMotion]);

  return null;
}

/* ── Gold scroll progress bar ─────────────────────────── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  return <motion.div className="luxe-progress" style={{ scaleX }} aria-hidden="true" />;
}

/* ── Back to top ──────────────────────────────────────── */
function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setShow(window.scrollY > 700);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 left-6 z-[55] hidden md:flex h-11 w-11 items-center justify-center border border-gold/60 bg-noir/85 text-gold-light backdrop-blur-sm transition-colors duration-300 hover:bg-gold hover:text-white"
          aria-label="Back to top"
        >
          <IconArrowUp className="h-4 w-4" stroke={1.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/* ── Preloader curtain (once per session) ─────────────── */
const LETTERS = "MWP".split("");

function Preloader() {
  const [phase, setPhase] = useState("idle"); // idle → play → done
  const skipRef = useRef(false);

  useLayoutEffect(() => {
    try {
      if (sessionStorage.getItem("sv-intro-seen")) {
        skipRef.current = true;
        setPhase("done");
        return;
      }
    } catch {
      /* storage unavailable — play anyway */
    }
    setPhase("play");
    const t = setTimeout(() => {
      setPhase("done");
      try {
        sessionStorage.setItem("sv-intro-seen", "1");
      } catch { }
    }, 2050);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === "play") {
      document.documentElement.style.overflow = "hidden";
      return () => {
        document.documentElement.style.overflow = "";
      };
    }
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="curtain"
          className="fixed inset-0 z-[200] flex items-center justify-center bg-noir luxe-grain luxe-aurora"
          exit={{ y: "-100%" }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          aria-hidden="true"
        >
          <div className="relative z-10 flex flex-col items-center">
            <motion.span
              className="luxe-eyebrow-dark mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "play" ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
            >
              Maison de Mode
            </motion.span>

            <div className="flex overflow-hidden">
              {LETTERS.map((ch, i) => (
                <motion.span
                  key={i}
                  className={`font-display text-4xl sm:text-6xl md:text-7xl tracking-[0.12em] ${i < 5 ? "text-gold-light" : "text-azure-light"
                    }`}
                  initial={{ y: "110%" }}
                  animate={{ y: phase === "play" ? "0%" : "110%" }}
                  transition={{
                    duration: 0.7,
                    delay: 0.22 + i * 0.045,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  {ch === " " ? " " : ch}
                </motion.span>
              ))}
            </div>

            <motion.span
              className="mt-8 block h-[1.5px] bg-gradient-to-r from-gold via-gold-light to-azure"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: phase === "play" ? 220 : 0, opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />

            <motion.span
              className="mt-5 text-[9px] uppercase tracking-[0.5em] text-white/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === "play" ? 1 : 0 }}
              transition={{ duration: 0.6, delay: 0.75 }}
            >
              Bags &amp; Clothing
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Page transition veil on route change ─────────────── */
function RouteVeil() {
  const pathname = usePathname();
  const [veil, setVeil] = useState(false);
  const first = useRef(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduceMotion) return;
    setVeil(true);
    const t = setTimeout(() => setVeil(false), 520);
    return () => clearTimeout(t);
  }, [pathname, reduceMotion]);

  return (
    <AnimatePresence>
      {veil && (
        <motion.div
          key={pathname}
          className="pointer-events-none fixed inset-0 z-[150] bg-noir"
          initial={{ opacity: 0.65 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          aria-hidden="true"
        />
      )}
    </AnimatePresence>
  );
}

export default function SiteFX() {
  return (
    <>
      <SmoothScroll />
      <ScrollProgress />
      <BackToTop />
      <RouteVeil />
      <Preloader />
    </>
  );
}
