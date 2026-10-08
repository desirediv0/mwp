"use client";

import { useEffect, useRef } from "react";
import "./editorial-refresh.css";

export function EditorialCanvas({ children, className = "" }) {
  const rootRef = useRef(null);
  useEffect(() => {
    let active = true;
    let media;
    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!active || !rootRef.current) return;
      gsap.registerPlugin(ScrollTrigger);
      media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        rootRef.current.querySelectorAll("[data-editorial-reveal]").forEach(element => {
          gsap.from(element, { opacity: 0, y: 22, duration: 0.75, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 94%", once: true } });
        });
      }, rootRef);
    })().catch(() => media?.revert());
    return () => { active = false; media?.revert(); };
  }, []);
  return <main ref={rootRef} className={`mwp-page mwp-editorial ${className}`}>{children}</main>;
}
