"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconArrowUpRight } from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";
import { fetchApi } from "@/lib/utils";

// Eight tinted product tiles with catalog images and local cutout fallbacks.
const SLIDES = [
  {
    n: "01",
    key: "ultra-pro",
    name: "MWP Ultra Pro",
    headline: "The Quiet Miracle.",
    copy: "Advanced men's vitality formula for natural performance and stamina.",
    href: null,
    tint: "from-[#F1E4BF] to-[#E3CC8C]",
    glow: "#C9A227",
    image: "/products/cutouts/ultra-pro.webp",
  },
  {
    n: "02",
    key: "power-max",
    name: "MWP Power Max",
    headline: "Unlock Your Miracle.",
    copy: "Herbal performance formula for strength, stamina and vitality.",
    href: null,
    tint: "from-[#D7E1F6] to-[#B9CAEC]",
    glow: "#3B4E8A",
    image: "/products/cutouts/power-max.webp",
  },
  {
    n: "03",
    key: "rapid-boost",
    name: "MWP Rapid Boost",
    headline: "Fast Action. Real Results.",
    copy: "Fast-acting support formula for energy and confidence.",
    href: null,
    tint: "from-[#F4DEC6] to-[#EBC49C]",
    glow: "#A15C2C",
    image: "/products/cutouts/rapid-boost.webp",
  },
  {
    n: "04",
    key: "her-power",
    name: "MWP Her Power",
    headline: "Her Inner Miracle.",
    copy: "Women's wellness formula for balance and daily confidence.",
    href: null,
    tint: "from-[#F6D8D0] to-[#EBB6AB]",
    glow: "#9C5A4A",
    image: "/products/cutouts/her-power.webp",
  },
  {
    n: "05",
    key: "her-energy",
    name: "MWP Her Energy",
    headline: "Keeps Up With Her.",
    copy: "Daily energy and focus formula for an active life.",
    href: null,
    tint: "from-[#E6D8F6] to-[#CFB8EA]",
    glow: "#6B4E92",
    image: "/products/cutouts/her-energy.webp",
  },
  {
    n: "06",
    key: "daily-vitality",
    name: "MWP Daily Vitality",
    headline: "Age Is A Number.",
    copy: "Complete daily wellness formula for everyday health.",
    href: null,
    tint: "from-[#E7E4D8] to-[#D1CCB8]",
    glow: "#5C5648",
    image: "/products/cutouts/daily-vitality.webp",
  },
  {
    n: "07",
    key: "alpha-prime",
    name: "MWP Alpha Prime",
    headline: "Strength. Focus. Performance.",
    copy: "Explore the Alpha Prime performance formula.",
    href: null,
    tint: "from-[#F1D9BE] to-[#E0B88D]",
    glow: "#AA652B",
    image: "/products/cutouts/alpha-prime.webp",
  },
  {
    n: "08",
    key: "titan-force",
    name: "MWP Titan Force",
    headline: "Power For Your Everyday.",
    copy: "Discover the Titan Force performance formula.",
    href: null,
    tint: "from-[#EFD8BF] to-[#DEB78C]",
    glow: "#AF6028",
    image: "/products/cutouts/titan-force.webp",
  },
];

function ProductTile({ slide }) {
  const { t } = useLanguage();
  const href = `/products/${slide.key}`;
  return (
    <div
      data-tile
      className={`group relative flex flex-col overflow-hidden border border-black/[0.04] bg-gradient-to-br ${slide.tint}`}
    >
      {/* Whole card is one link; the text blocks below let clicks fall through to it */}
      <Link
        href={href}
        aria-label={`View ${slide.name}`}
        className="absolute inset-0 z-[5] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-neutral-900"
      />
      {/* Clean spotlight right behind the bottle (no wide blurry blob), brightens on hover */}
      <div
        data-tile-glow
        className="pointer-events-none absolute left-1/2 bottom-[6%] h-[340px] w-[340px] -translate-x-1/2 rounded-full opacity-70 sm:h-[400px] sm:w-[400px] lg:bottom-[4%] lg:h-[460px] lg:w-[460px]"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.55) 38%, rgba(255,255,255,0) 68%)" }}
      />

      <span aria-hidden="true" className="absolute right-5 top-6 text-[11px] tracking-[0.2em] text-neutral-600/60 sm:right-8 sm:top-8">
        {slide.n} / 08
      </span>

      <div data-tile-copy className="pointer-events-none relative z-10 px-5 pt-[84px] pb-2 text-center sm:px-8 sm:pt-24 lg:px-12">
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.02em] text-neutral-950 sm:text-[34px] lg:text-[42px]">
          {slide.name}
        </h2>
        <p className="mt-3 text-[18px] font-medium leading-snug tracking-tight text-neutral-800 sm:text-xl lg:text-[22px]">
          {slide.headline}
        </p>
        <p className="mx-auto mt-3 max-w-[330px] min-h-[44px] text-[14px] leading-[1.6] text-neutral-700 sm:min-h-[48px] sm:text-[15px]">
          {slide.copy}
        </p>

        <div className="mt-5 flex items-center justify-center gap-3 text-[12px] sm:gap-4 sm:text-[13px]">
          <Link
            href={href}
            className="pointer-events-auto inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-900 px-5 text-white transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900"
          >
            {t("discoverFormula")}
          </Link>
          <Link
            href={href}
            className="pointer-events-auto inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-3 text-neutral-900 transition-colors hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900"
          >
            {t("shopNow")}
            <IconArrowUpRight size={15} stroke={1.5} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Equal-height bottle stages with a separate GSAP hover wrapper. */}
      <div data-tile-stage className="pointer-events-none relative z-10 mx-auto mt-7 mb-9 flex h-[300px] w-full items-center justify-center sm:mt-8 sm:mb-12 sm:h-[330px] lg:h-[380px]">
        <span aria-hidden="true" className="absolute bottom-0 left-1/2 h-4 w-40 -translate-x-1/2 rounded-full bg-black/20 blur-md sm:w-48" />
        <div data-tile-image className="relative flex h-full w-full items-center justify-center">
        {slide.image ? (
          <Image
            src={slide.image}
            alt={slide.name}
            width={slide.key === "her-energy" ? 708 : 417}
            height={1000}
            sizes="(max-width: 640px) 220px, 280px"
            className="h-full w-auto max-w-[90%] object-contain drop-shadow-[0_20px_18px_rgba(0,0,0,0.16)]"
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
    </div>
  );
}

export default function MwpProductShowcase() {
  const gridRef = useRef(null);
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    let alive = true;
    fetchApi("/public/products?limit=100")
      .then(res => { if (alive) setCatalog(res.data?.products || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let ctx;
    let media;
    let mounted = true;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (!mounted || !gridRef.current) return;
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        media = gsap.matchMedia();
        media.add("(prefers-reduced-motion: no-preference)", () => {
          const cleanups = [];
          gridRef.current.querySelectorAll("[data-tile]").forEach((tile) => {
            const copy = tile.querySelector("[data-tile-copy]");
            const stage = tile.querySelector("[data-tile-stage]");
            gsap.timeline({
              scrollTrigger: { trigger: tile, start: "top 88%", once: true },
              defaults: { ease: "power3.out" },
            })
              .from(copy, { y: 24, opacity: 0, duration: 0.7 })
              .from(stage, { y: 40, opacity: 0, duration: 0.95 }, 0.12);

            // A separate wrapper keeps reveal and hover transforms independent.
            const hover = gsap.timeline({ paused: true, defaults: { duration: 0.55, ease: "power2.out" } })
              .to(tile.querySelector("[data-tile-image]"), { y: -10, scale: 1.035 }, 0)
              .to(tile.querySelector("[data-tile-glow]"), { opacity: 1, scale: 1.06 }, 0);
            const enter = () => hover.play();
            const leave = () => hover.reverse();
            const pointerEnter = (event) => { if (event.pointerType === "mouse") enter(); };
            const focusOut = (event) => { if (!tile.contains(event.relatedTarget)) leave(); };
            tile.addEventListener("pointerenter", pointerEnter);
            tile.addEventListener("pointerleave", leave);
            tile.addEventListener("focusin", enter);
            tile.addEventListener("focusout", focusOut);
            cleanups.push(() => {
              tile.removeEventListener("pointerenter", pointerEnter);
              tile.removeEventListener("pointerleave", leave);
              tile.removeEventListener("focusin", enter);
              tile.removeEventListener("focusout", focusOut);
            });
          });
          return () => cleanups.forEach(cleanup => cleanup());
        });
      }, gridRef);
    })().catch(() => {
      // Content stays visible even if animation modules fail to load.
      media?.revert();
      ctx?.revert();
    });

    return () => {
      mounted = false;
      media?.revert();
      ctx?.revert();
    };
  }, []);

  return (
    <section className="overflow-hidden bg-white">
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2">
          {SLIDES.map((slide) => (
            <ProductTile key={slide.key} slide={{ ...slide, image: catalog.find(product => product.slug === slide.key)?.image || slide.image }} />
          ))}
        </div>
    </section>
  );
}

export { SLIDES as MWP_SHOWCASE_SLIDES };
