"use client";

import { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(SplitText, ScrollTrigger, useGSAP);

const defaultGsapVars = {
  chars: {
    x: 150,
    opacity: 0,
    duration: 0.7,
    ease: "power3",
    stagger: 0.05,
  },
  words: {
    x: 150,
    opacity: 0,
    ease: "power3",
    duration: 1,
    stagger: 0.2,
    y: -100,
    rotation: "random(-80, 80)",
  },
  lines: {
    duration: 1,
    yPercent: 100,
    opacity: 0,
    stagger: 0.4,
    ease: "expo.out",
  },
};

export const RevealText = ({
  type = "chars",
  gsapVars = {},
  splitTextVars = {},
  ...props
}) => {
  const wrapperRef = useRef(null);

  const splitType = useMemo(
    () => ({ chars: "chars,words,lines", words: "words,lines", lines: "lines" })[type],
    [type]
  );

  useGSAP(
    () => {
      const element = wrapperRef.current;
      if (!element) return;

      let split;
      let cancelled = false;

      // Split only after the web font is ready so character widths are correct.
      const ready = document.fonts?.ready ?? Promise.resolve();
      ready.then(() => {
        if (cancelled) return;
        split = SplitText.create(element, { type: splitType, ...splitTextVars });
        gsap.from(split[type], {
          ...defaultGsapVars[type],
          scrollTrigger: { trigger: element, start: "top 85%", once: true },
          ...gsapVars,
        });
        ScrollTrigger.refresh();
      });

      return () => {
        cancelled = true;
        split?.revert();
      };
    },
    { scope: wrapperRef }
  );

  return <div {...props} ref={wrapperRef} />;
};

export default RevealText;
