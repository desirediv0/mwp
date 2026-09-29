"use client";

// Adapted from the Hyperiux Vault "Timeline" component (https://vault.hyperiux.com),
// converted to JS for this project and re-skinned with MWP's own copy, image
// and brand color. Structure/animation logic kept as close to the original
// as possible — only content, palette and asset are project-specific.

import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";

const monthOrder = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

/* Inline stand-in for @gsap/react's useGSAP. Mirrors its default
   `revertOnUpdate: false`: one gsap.context lives for the component's
   lifetime, the callback is re-added when dependencies change, and the
   context is reverted only on unmount. */
function useGSAP(callback, options) {
  const deps = options?.dependencies ?? [];
  const scope = options?.scope;
  const ctxRef = useRef(null);
  const cleanupRef = useRef(undefined);

  useLayoutEffect(() => {
    const el =
      scope && typeof scope === "object" && "current" in scope
        ? scope.current
        : scope ?? null;
    ctxRef.current = gsap.context(() => {}, el ?? undefined);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!ctxRef.current) return;
    cleanupRef.current?.();
    const ret = ctxRef.current.add(callback);
    cleanupRef.current = typeof ret === "function" ? ret : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback) {
  if (typeof window === "undefined") return () => {};
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}
function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}
function getServerReducedMotionSnapshot() {
  return false;
}
function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot
  );
}

// MWP's own formula journey — sourcing through to delivery.
const topJourneyData = [
  {
    id: "sourced",
    year: "Step",
    month: "01",
    content: "Every active ingredient is sourced from named, traceable origins",
  },
  {
    id: "dosed",
    year: "Step",
    month: "02",
    content: "Formulas are built at clinically studied doses, never underfilled",
  },
  {
    id: "certified",
    year: "Step",
    month: "03",
    content: "COAs and heavy-metal screening published on our Certificate Wall",
  },
  {
    id: "delivered",
    year: "Step",
    month: "04",
    content: "Pan-India express shipping gets your formula to you quickly",
  },
];

const bottomJourneyData = [
  {
    id: "manufactured",
    year: "Step",
    month: "05",
    content: "GMP-certified manufacturing for every single batch we release",
  },
  {
    id: "tested",
    year: "Step",
    month: "06",
    content: "Independent third-party labs verify purity and potency",
  },
  {
    id: "trusted",
    year: "Step",
    month: "07",
    content: "Six formulas, one standard of proof — explore the full range",
  },
];

const allJourneyItems = [...topJourneyData, ...bottomJourneyData];

export default function MwpJourneyTimeline({
  title = "How An MWP Formula\nEarns Your Trust",
  periodLabel = "Source To Shelf",
  textColor = "#111111",
  mutedTextColor = "#6b6b6b",
  activeColor = "#C9A227",
  backgroundColor = "#ffffff",
  imageUrl = "/mwp-tile-ultra-pro.png",
  imageAlt = "MWP Supplements formulation",
  duration,
  scrollDuration = 1.2,
}) {
  const sectionRef = useRef(null);
  const wholeSliderRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const animationDuration = duration ?? scrollDuration;
  const normalizedDuration = Math.max(0.2, animationDuration);
  const sectionStyle = { color: textColor, backgroundColor };
  const activeStyle = { backgroundColor: activeColor };
  const mutedTextStyle = { color: mutedTextColor };

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      (async () => {
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        gsap.registerPlugin(ScrollTrigger);

        const isMobile = window.innerWidth < 600;
        const slidePercent = isMobile ? -57 : -65;
        const lineWidth = isMobile ? "65%" : "98%";
        const lineStart = isMobile ? "top 30%" : "top 25%";
        const slideEnd = isMobile ? "82% 50%" : "92% bottom";
        const lineEnd = isMobile ? "80% 50%" : "92% bottom";

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: slideEnd,
            scrub: true,
          },
          defaults: { ease: "none" },
        });

        tl.fromTo(
          wholeSliderRef.current,
          { xPercent: 0 },
          { xPercent: slidePercent }
        );

        if (reducedMotion) {
          gsap.set(".journey-line", { width: lineWidth });
          return;
        }

        gsap.to(".journey-line", {
          width: lineWidth,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: lineStart,
            end: lineEnd,
            scrub: true,
          },
        });
      })();
    },
    { dependencies: [reducedMotion], scope: sectionRef }
  );

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const items = allJourneyItems;

      if (reducedMotion) {
        items.forEach((item) => {
          gsap.set(`.jl-${item.id}`, { scaleY: 1 });
          gsap.set(`.jd-${item.id}`, { scale: 1 });
          gsap.set(`.title-${item.id}`, { opacity: 1, clearProps: "transform" });
          gsap.set(`.description-${item.id}`, { opacity: 1, clearProps: "transform" });
        });
        return;
      }

      items.forEach((item) => {
        gsap.set(`.jl-${item.id}`, { scaleY: 0, transformOrigin: "bottom bottom" });
        gsap.set(`.jd-${item.id}`, { scale: 0 });
        gsap.set(`.title-${item.id}`, { opacity: 1 });
        gsap.set(`.description-${item.id}`, { opacity: 1 });
      });

      let titleSplits = {};
      let descriptionSplits = {};
      let handleResize;
      let cleanupFns = [];

      (async () => {
        const { ScrollTrigger } = await import("gsap/ScrollTrigger");
        const { SplitText } = await import("gsap/SplitText");
        gsap.registerPlugin(ScrollTrigger, SplitText);

        items.forEach((item) => {
          titleSplits[item.id] = new SplitText(`.title-${item.id}`, {
            type: "chars, words, lines",
            mask: "lines",
          });
          descriptionSplits[item.id] = new SplitText(`.description-${item.id}`, {
            type: "chars, words, lines",
            mask: "lines",
          });
        });

        const createItemTimeline = (item, startPos, endPos) => {
          const lineSelector = `.jl-${item.id}`;
          const dotSelector = `.jd-${item.id}`;
          const titleLines = titleSplits[item.id]?.lines || [];
          const descriptionLines = descriptionSplits[item.id]?.lines || [];

          const isTop = topJourneyData.some((topItem) => topItem.id === item.id);
          if (!isTop) {
            gsap.set(lineSelector, { transformOrigin: "top top" });
          }

          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: section,
              start: `${startPos}% 30%`,
              end: `${endPos}% 50%`,
              scrub: true,
            },
          });

          timeline
            .to(lineSelector, { scaleY: 1, duration: normalizedDuration * 0.4 })
            .to(dotSelector, { scale: 1, duration: normalizedDuration * 0.4 }, "<")
            .fromTo(
              titleLines,
              { y: 100 },
              {
                y: 0,
                delay: -0.8 * normalizedDuration,
                duration: normalizedDuration,
                stagger: 0.02,
                ease: "power2.out",
              }
            )
            .fromTo(
              descriptionLines,
              { y: 100 },
              {
                y: 0,
                duration: normalizedDuration,
                stagger: 0.02,
                ease: "power2.out",
              },
              "<"
            );

          return timeline;
        };

        const positions =
          window.innerWidth < 600
            ? [
                [22, 32], [28, 38], [36, 46], [45, 55],
                [52, 62], [60, 70], [69, 79],
              ]
            : [
                [6, 26], [16, 36], [26, 46], [35, 55],
                [45, 65], [55, 75], [65, 85],
              ];

        items.forEach((item, index) => {
          const [startPos, endPos] = positions[index];
          createItemTimeline(item, startPos, endPos);
        });

        handleResize = () => ScrollTrigger.refresh();
        window.addEventListener("resize", handleResize);
        cleanupFns.push(() => window.removeEventListener("resize", handleResize));
        cleanupFns.push(() => {
          Object.values(titleSplits).forEach((split) => split?.revert?.());
          Object.values(descriptionSplits).forEach((split) => split?.revert?.());
        });
      })();

      return () => {
        cleanupFns.forEach((fn) => fn());
      };
    },
    { dependencies: [normalizedDuration, reducedMotion], scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id="journey"
      className="h-[200vw] max-[600px]:h-[400vh] w-full relative"
      style={sectionStyle}
    >
      <div className="h-screen w-screen sticky top-[0%] pt-[10%] overflow-hidden max-[600px]:top-[5%]">
        <div
          ref={wholeSliderRef}
          className="mr-[2vw] flex h-[30vw] w-[240vw] items-center gap-[5vw] px-[5vw] max-[600px]:h-[80vh] max-[600px]:w-[800vw] max-[600px]:px-[7vw]"
        >
          <div className="h-full w-[30vw] overflow-hidden rounded-[1vw] max-[600px]:h-[65vw] max-[600px]:w-[85vw] max-[600px]:rounded-[5vw]">
            <img
              src={imageUrl}
              alt={imageAlt}
              draggable={false}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="relative h-full w-full">
            <div className="w-full absolute left-0 top-[49%] tranlate-y-[-50%] flex items-center h-fit">
              <div className="h-[.8vw] max-[600px]:h-[2vw] max-[600px]:w-[2vw] w-[.8vw] rounded-full" style={activeStyle}></div>
              <div className="h-px w-[0%] rounded-full journey-line" style={activeStyle}></div>
              <div className="h-[.8vw] max-[600px]:h-[2vw] max-[600px]:w-[2vw] w-[.8vw] rounded-full" style={activeStyle}></div>
            </div>

            <div className="flex h-1/2 w-full items-center justify-start gap-[.5vw]">
              <div className="h-full w-[20%] pt-[2vw] max-[600px]:h-fit max-[600px]:pt-[5vw]">
                <h2 className="w-[65%] text-[3vw] leading-[0.95] max-[600px]:text-[8.5vw] whitespace-pre-line">
                  {title}
                </h2>
              </div>

              <div className="w-full flex h-full gap-x-[15vw] max-[600px]:gap-x-[40vw]">
                {topJourneyData.map((item) => (
                  <div
                    key={`top-${item.id}`}
                    className="relative h-full w-[30vw] px-[3vw] max-[600px]:flex max-[600px]:w-[70vw] max-[600px]:flex-col max-[600px]:px-[7vw]"
                  >
                    <div className="w-full absolute left-0 bottom-0 top-0 h-full">
                      <div
                        className={`size-[1vw] max-[600px]:size-[2.5vw] translate-x-[-50%] relative aspect-square rounded-full jd-${item.id}`}
                        style={activeStyle}
                      ></div>
                      <div
                        className={`h-[94%] w-px origin-bottom rounded-full jl-${item.id}`}
                        style={activeStyle}
                      ></div>
                    </div>

                    <div className="mt-[-1vw] space-y-[1vw] max-[600px]:mt-[-2vw]">
                      <h4 className={`title-${item.id} text-[2.5vw] leading-none max-[600px]:text-[6.4vw]`}>
                        {item.year} {item.month}
                      </h4>
                      <p
                        className={`description-${item.id} w-[90%] text-[1.5vw] leading-[1.15] max-[600px]:w-[90%] max-[600px]:text-[4.8vw]`}
                        style={mutedTextStyle}
                      >
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-1/2 flex items-center justify-start w-full">
              <div className="w-[34%] pt-[2vw] max-[600px]:pt-[5vw] max-[600px]:w-[30%] h-full">
                <p className="text-[1.65vw] leading-none max-[600px]:text-[4.2vw]" style={mutedTextStyle}>
                  {periodLabel}
                </p>
              </div>

              <div className="w-full flex h-full gap-x-[20vw] ml-[7vw] max-[600px]:gap-x-[40vw] max-[600px]:ml-[7vw]">
                {bottomJourneyData.map((item) => (
                  <div
                    key={`bottom-${item.id}`}
                    className="relative h-full w-[25vw] px-[3vw] max-[600px]:w-[70vw] max-[600px]:px-[7vw]"
                  >
                    <div className="w-full absolute left-0 bottom-[-1%] h-full">
                      <div
                        className={`h-[94%] origin-top w-px rounded-full max-[600px]:h-full jl-${item.id}`}
                        style={activeStyle}
                      ></div>
                      <div
                        className={`size-[1vw] max-[600px]:size-[2.5vw] translate-x-[-50%] relative w-auto aspect-square rounded-full jd-${item.id}`}
                        style={activeStyle}
                      ></div>
                    </div>

                    <div className="flex h-full w-full flex-col justify-end space-y-[1vw]">
                      <h4 className={`title-${item.id} text-[2.5vw] leading-none max-[600px]:text-[6.4vw]`}>
                        {item.year} {item.month}
                      </h4>
                      <p
                        className={`description-${item.id} w-[90%] text-[1.5vw] leading-[1.15] max-[600px]:w-[90%] max-[600px]:text-[4.8vw]`}
                        style={mutedTextStyle}
                      >
                        {item.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
