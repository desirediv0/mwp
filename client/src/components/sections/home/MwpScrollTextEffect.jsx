"use client";

// Adapted from the Skiper31 "text-scroll-animation" component
// (https://21st.dev), converted to JS for this project and re-skinned with
// MWP's own copy, product tile images and brand color. Structure/animation
// logic kept as close to the original as possible.

import { motion, useScroll, useTransform } from "framer-motion";
import ReactLenis from "lenis/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const CharacterV1 = ({ char, index, centerIndex, scrollYProgress }) => {
  const isSpace = char === " ";
  const distanceFromCenter = index - centerIndex;

  const x = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5], [distanceFromCenter * 50, 0]);

  return (
    <motion.span
      className={cn("inline-block text-[color:var(--gold,#C9A227)]", isSpace && "w-5 sm:w-7")}
      style={{ x, rotateX }}
    >
      {char}
    </motion.span>
  );
};


export default function MwpScrollTextEffect() {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: targetRef });

  const text = "proof before promises";
  const characters = text.split("");
  const centerIndex = Math.floor(characters.length / 2);



  return (
    <ReactLenis root>
      <main className="w-full bg-white">
        <div className="top-10 absolute left-1/2 z-10 grid -translate-x-1/2 content-start justify-items-center gap-6 text-center text-black">
          <span className="relative max-w-[12ch] text-xs uppercase leading-tight opacity-40 after:absolute after:left-1/2 after:top-full after:h-16 after:w-px after:bg-gradient-to-b after:from-[#f5f4f3] after:to-black after:content-['']">
            Scroll to see more
          </span>
        </div>

        <div
          ref={targetRef}
          className="relative box-border flex h-[160vh] sm:h-[210vh] items-center justify-center gap-[2vw] overflow-hidden bg-[#f5f4f3] p-[2vw]"
        >
          <div
            className="w-full max-w-5xl text-center text-3xl sm:text-5xl md:text-6xl font-semibold uppercase tracking-wide text-black"
            style={{ perspective: "500px" }}
          >
            {characters.map((char, index) => (
              <CharacterV1
                key={index}
                char={char}
                index={index}
                centerIndex={centerIndex}
                scrollYProgress={scrollYProgress}
              />
            ))}
          </div>
        </div>


      </main>
    </ReactLenis>
  );
}
