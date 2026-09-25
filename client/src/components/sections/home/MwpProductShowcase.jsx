"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

// Apple-style product grid — 6 equal tiles, 2 columns, light/white base with
// a subtle per-product tint. Static content only (no API).
const SLIDES = [
  {
    n: "01",
    key: "ultra-pro",
    name: "MWP Ultra Pro",
    headline: "The Quiet Miracle.",
    copy: "Advanced men's vitality formula for natural performance and stamina.",
    href: "/products?search=Ultra%20Pro",
    tint: "from-[#FBF7EE] to-[#F3ECD8]",
    glow: "#C9A227",
    image: "/mwp-tile-ultra-pro.png",
  },
  {
    n: "02",
    key: "power-max",
    name: "MWP Power Max",
    headline: "Unlock Your Miracle.",
    copy: "Herbal performance formula for strength, stamina and vitality.",
    href: "/products?search=Power%20Max",
    tint: "from-[#EEF2FB] to-[#E2E9F7]",
    glow: "#3B4E8A",
    image: "/mwp-tile-power-max.png",
  },
  {
    n: "03",
    key: "rapid-boost",
    name: "MWP Rapid Boost",
    headline: "Fast Action. Real Results.",
    copy: "Fast-acting support formula for energy and confidence.",
    href: "/products?search=Rapid%20Boost",
    tint: "from-[#FBF2E9] to-[#F5E4D0]",
    glow: "#A15C2C",
    image: "/mwp-tile-rapid-boost.png",
  },
  {
    n: "04",
    key: "her-power",
    name: "MWP Her Power",
    headline: "Her Inner Miracle.",
    copy: "Women's wellness formula for balance and daily confidence.",
    href: "/products?search=Her%20Power",
    tint: "from-[#FBEFEC] to-[#F5DFD9]",
    glow: "#9C5A4A",
    image: "/mwp-tile-her-power.png",
  },
  {
    n: "05",
    key: "her-energy",
    name: "MWP Her Energy",
    headline: "Keeps Up With Her.",
    copy: "Daily energy and focus formula for an active life.",
    href: "/products?search=Her%20Energy",
    tint: "from-[#F4EEFB] to-[#E9DEF5]",
    glow: "#6B4E92",
    image: "/mwp-tile-her-energy.png",
  },
  {
    n: "06",
    key: "daily-vitality",
    name: "MWP Daily Vitality",
    headline: "Age Is A Number.",
    copy: "Complete daily wellness formula for everyday health.",
    href: "/products?search=Daily%20Vitality",
    tint: "from-[#F6F5F1] to-[#ECE9E1]",
    glow: "#5C5648",
    image: "/mwp-tile-daily-vitality.png",
  },
];

function ProductTile({ slide, index }) {
  const { t } = useLanguage();
  return (
    <div
      data-tile
      className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${slide.tint} border border-black/[0.04] flex flex-col opacity-0`}
    >
      {/* Soft colored glow behind the product, brightens on hover */}
      <div
        className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[70%] h-[55%] rounded-full blur-[60px] opacity-25 group-hover:opacity-45 transition-opacity duration-500"
        style={{ background: slide.glow }}
      />

      <div className="relative z-10 px-8 sm:px-10 pt-10 sm:pt-12 pb-2 text-center">
        <p className="text-[15px] sm:text-base font-semibold tracking-tight text-neutral-900">
          {slide.name}
        </p>
        <p className="mt-1.5 text-xl sm:text-2xl font-semibold tracking-tight text-neutral-800">
          {slide.headline}
        </p>
        <p className="mt-2 text-[12.5px] sm:text-[13px] text-neutral-500 max-w-xs mx-auto leading-relaxed">
          {slide.copy}
        </p>

        <div className="mt-4 flex items-center justify-center gap-4 text-[13px] sm:text-[14px]">
          <Link
            href={slide.href}
            className="text-white bg-neutral-900 hover:bg-neutral-800 transition-colors rounded-full px-4 py-1.5 font-medium"
          >
            {t("discoverFormula")}
          </Link>
          <Link
            href={slide.href}
            className="text-neutral-900 hover:underline underline-offset-4 font-medium"
          >
            {t("shopNow")}
          </Link>
        </div>
      </div>

      {/* Product image — fills the tile edge-to-edge, no gap, gentle float on hover */}
      <div
        data-tile-image
        className="relative z-10 flex-1 min-h-[260px] sm:min-h-[340px] -mx-2 -mb-2 transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.03]"
      >
        {slide.image ? (
          <Image
            src={slide.image}
            alt={slide.name}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-contain object-bottom p-4 sm:p-6 drop-shadow-[0_25px_35px_rgba(0,0,0,0.18)]"
          />
        ) : (
          <span
            className="absolute bottom-6 right-6 select-none font-black tracking-tight text-[4rem] opacity-[0.1] leading-none"
            style={{ color: slide.glow }}
          >
            {slide.n}
          </span>
        )}
      </div>
    </div>
  );
}

export default function MwpProductShowcase() {
  const gridRef = useRef(null);

  useEffect(() => {
    let ctx;
    let mounted = true;

    (async () => {
      const gsapModule = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      if (!mounted) return;
      const gsap = gsapModule.default;
      gsap.registerPlugin(ScrollTrigger);

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const tiles = gridRef.current?.querySelectorAll("[data-tile]");
      if (!tiles || tiles.length === 0) return;

      ctx = gsap.context(() => {
        if (reduceMotion) {
          gsap.set(tiles, { opacity: 1, y: 0, scale: 1 });
          return;
        }

        tiles.forEach((tile, i) => {
          const fromLeft = i % 2 === 0;
          gsap.fromTo(
            tile,
            {
              opacity: 0,
              y: 60,
              x: fromLeft ? -30 : 30,
              scale: 0.92,
              rotateZ: fromLeft ? -1.5 : 1.5,
            },
            {
              opacity: 1,
              y: 0,
              x: 0,
              scale: 1,
              rotateZ: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: tile,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );

          const img = tile.querySelector("[data-tile-image]");
          if (img) {
            gsap.fromTo(
              img,
              { y: 40, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 1,
                delay: 0.15,
                ease: "power3.out",
                scrollTrigger: {
                  trigger: tile,
                  start: "top 88%",
                  toggleActions: "play none none reverse",
                },
              }
            );
          }
        });
      }, gridRef);
    })();

    return () => {
      mounted = false;
      ctx?.revert();
    };
  }, []);

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {SLIDES.map((slide, i) => (
            <ProductTile key={slide.key} slide={slide} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { SLIDES as MWP_SHOWCASE_SLIDES };
