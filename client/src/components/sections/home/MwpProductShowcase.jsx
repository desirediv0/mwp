"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IconShieldCheck } from "@tabler/icons-react";
import { useLanguage } from "@/lib/language-context";
import { fetchApi } from "@/lib/utils";

// Apple-style product grid — 8 equal tiles, 2 columns, light/white base with
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
    image: "/products/cutouts/ultra-pro.webp",
    badge: "Natural Heal",
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
    image: "/products/cutouts/power-max.webp",
    badge: "Natural Heal",
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
    image: "/products/cutouts/rapid-boost.webp",
    badge: "Natural Heal",
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
    image: "/products/cutouts/her-power.webp",
    badge: "Natural Heal",
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
    image: "/products/cutouts/her-energy.webp",
    badge: "Natural Heal",
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
    image: "/products/cutouts/daily-vitality.webp",
    badge: "Natural Heal",
  },
  {
    n: "07",
    key: "alpha-prime",
    name: "MWP Alpha Prime",
    headline: "Strength. Focus. Performance.",
    copy: "Explore the Alpha Prime performance formula.",
    href: "/products?search=Alpha%20Prime",
    tint: "from-[#FBF2E9] to-[#F0DFC9]",
    glow: "#AA652B",
    image: "/products/cutouts/alpha-prime.webp",
    badge: "Natural Heal",
  },
  {
    n: "08",
    key: "titan-force",
    name: "MWP Titan Force",
    headline: "Power For Your Everyday.",
    copy: "Discover the Titan Force performance formula.",
    href: "/products?search=Titan%20Force",
    tint: "from-[#F8F0E7] to-[#EEDBC7]",
    glow: "#AF6028",
    image: "/products/cutouts/titan-force.webp",
    badge: "Natural Heal",
  },
];

function ProductTile({ slide, index }) {
  const { t } = useLanguage();
  return (
    <div
      data-tile
      className={`group relative overflow-hidden  bg-gradient-to-br ${slide.tint} border border-black/[0.04] flex flex-col opacity-0`}
    >
      {/* Shield-shaped ribbon badge, top-left corner — smaller on mobile, full size from sm: up */}
      {slide.badge && (
        <div className="pointer-events-none absolute top-0 left-4 sm:left-6 z-20 w-14 sm:w-20">
          {/* Ambient glow behind the badge, tinted per product */}
          <div
            className="absolute -inset-1.5 sm:-inset-2 -top-1 rounded-full blur-lg opacity-60"
            style={{ background: slide.glow }}
          />
          {/* Golden outline: gold shape with a slightly inset green shape on top */}
          <div
            className="relative bg-gradient-to-b from-[#E5C56A] via-[#C9A227] to-[#8B6914] p-[2px] pb-[3px] drop-shadow-[0_8px_14px_rgba(0,0,0,0.3)]"
            style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)" }}
          >
            <div
              className="relative flex flex-col items-center justify-center bg-gradient-to-b from-emerald-600 to-emerald-900 pt-2.5 sm:pt-3.5 pb-3.5 sm:pb-5 text-white"
              style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 84%, 0 100%)" }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-white/20 to-transparent" />
              <IconShieldCheck className="h-3.5 w-3.5 sm:h-5 sm:w-5 mb-0.5 sm:mb-1 text-[#F5DE9A] drop-shadow-[0_0_4px_rgba(229,197,106,0.7)]" stroke={2} />
              <span className="text-[7px] sm:text-[9.5px] font-bold uppercase tracking-wide leading-[1.15] text-center px-1">
                {slide.badge.split(" ").map((word, i) => (
                  <span key={i} className="block">{word}</span>
                ))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Soft colored glow behind the product, brightens on hover */}
      <div
        className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[70%] h-[55%] rounded-full blur-[60px] opacity-25 group-hover:opacity-45 transition-opacity duration-500"
        style={{ background: slide.glow }}
      />

      <div className="relative z-10 px-8 sm:px-10 pt-14 sm:pt-12 pb-2 text-center">
        <p className="text-xl sm:text-4xl font-semibold tracking-tight text-neutral-900">
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
        className="relative z-10 mx-auto mt-5 mb-6 h-[320px] w-full max-w-[280px] sm:h-[380px] sm:max-w-[320px] transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:scale-[1.03]"
      >
        {slide.image ? (
          <Image
            src={slide.image}
            alt={slide.name}
            fill
            sizes="(max-width: 640px) 280px, 320px"
            className="object-contain drop-shadow-[0_18px_20px_rgba(0,0,0,0.16)]"
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
      <div >
        <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 ">
          {SLIDES.map((slide, i) => (
            <ProductTile key={slide.key} slide={{ ...slide, image: catalog.find(product => product.slug === slide.key)?.image || slide.image }} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export { SLIDES as MWP_SHOWCASE_SLIDES };
