"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "framer-motion";
import { INGREDIENT_LIBRARY } from "@/lib/ingredient-library";

// Tilted band under the hero: proof points and real ingredient origins drift sideways and
// speed up / reverse / skew with scroll velocity.
const PROOF = ["Clinically dosed", "GMP certified", "Lab tested", "QR verified", "Eight formulas", "Men · Women · Power"];
const INGREDIENTS = INGREDIENT_LIBRARY.slice(0, 16).map(item => `${item.name} — ${item.origin}`);

const wrap = (min, max, value) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

function Capsule() {
  return (
    <span
      aria-hidden="true"
      className="mx-[0.45em] inline-block h-[0.42em] w-[0.95em] shrink-0 -rotate-[24deg] rounded-full bg-[linear-gradient(90deg,#c9a227_0_50%,#f7f1e6_50%_100%)] shadow-[inset_0_-0.05em_0.08em_rgba(0,0,0,0.3),0_0_0.6em_rgba(201,162,39,0.35)] align-middle"
    />
  );
}

function VelocityRow({ items, baseVelocity, velocityFactor, active, paused, className, separator }) {
  const baseX = useMotionValue(0);
  const x = useTransform(baseX, value => `${wrap(-50, 0, value)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (!active || paused.current) return;
    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;
    const step = direction.current * baseVelocity * (delta / 1000);
    baseX.set(baseX.get() + step + step * Math.abs(factor));
  });

  // Two identical halves so the -50% wrap is seamless; each half repeats the list to outrun wide screens.
  const half = [...items, ...items];
  return (
    <motion.div className={`flex w-max whitespace-nowrap ${className}`} style={{ x }}>
      {[0, 1].map(copy => (
        <span key={copy} className="flex items-center">
          {half.map((item, index) => (
            <span key={`${copy}-${index}`} className="flex items-center">
              {item}
              {separator}
            </span>
          ))}
        </span>
      ))}
    </motion.div>
  );
}

export default function MwpScrollMarquee() {
  const ref = useRef(null);
  const paused = useRef(false);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { margin: "120px 0px" });

  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const velocityFactor = useTransform(velocity, [-1500, 0, 1500], [-4, 0, 4], { clamp: false });
  const skew = useTransform(velocity, [-2500, 0, 2500], [6, 0, -6]);

  const animate = inView && !reduceMotion;

  return (
    <section ref={ref} aria-label="MWP quality standards and ingredients" className="relative z-10 -mt-9 overflow-hidden py-8 sm:-mt-10 sm:py-10">
      <ul className="sr-only">
        {PROOF.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div
        aria-hidden="true"
        className="-ml-[4vw] w-[108vw] -rotate-[1.6deg] bg-neutral-950 py-4 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.55)] sm:py-5"
        onPointerEnter={event => {
          if (event.pointerType === "mouse") paused.current = true;
        }}
        onPointerLeave={() => {
          paused.current = false;
        }}
      >
        <motion.div style={reduceMotion ? undefined : { skewX: skew }}>
          <VelocityRow
            items={PROOF}
            baseVelocity={-2.2}
            velocityFactor={velocityFactor}
            active={animate}
            paused={paused}
            separator={<Capsule />}
            className="text-[26px] leading-tight tracking-[-0.02em] sm:text-[40px]"
          />
          <div className="mx-auto my-3 h-px w-full bg-white/10 sm:my-4" />
          <VelocityRow
            items={INGREDIENTS}
            baseVelocity={1.4}
            velocityFactor={velocityFactor}
            active={animate}
            paused={paused}
            separator={<span className="mx-5 inline-block h-1 w-1 rounded-full bg-[#c9a227]" />}
            className="text-[11px] uppercase tracking-[0.24em] text-white/55 sm:text-xs"
          />
        </motion.div>
      </div>
    </section>
  );
}
