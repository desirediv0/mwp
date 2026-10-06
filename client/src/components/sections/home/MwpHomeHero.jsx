"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

const PRODUCT_ALT = "MWP collection: Ultra Pro, Power Max, Rapid Boost, Her Power, Her Energy, Daily Vitality, Alpha Prime and Titan Force.";

// Same order as the bottles in the banner image (left to right, top row then bottom row on mobile).
const BANNER_PRODUCTS = [
  { name: "Ultra Pro", href: "/products/ultra-pro" },
  { name: "Power Max", href: "/products/power-max" },
  { name: "Rapid Boost", href: "/products/rapid-boost" },
  { name: "Her Power", href: "/products/her-power" },
  { name: "Her Energy", href: "/products/her-energy" },
  { name: "Daily Vitality", href: "/products/daily-vitality" },
  { name: "Alpha Prime", href: "/products/alpha-prime" },
  { name: "Titan Force", href: "/products/titan-force" },
];

export default function MwpHomeHero() {
  const { t } = useLanguage();
  return (
    <section aria-labelledby="mwp-hero-title" className="relative w-full overflow-hidden bg-[#f6f2eb] text-neutral-900">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[360px] bg-[radial-gradient(ellipse_at_center,rgba(255,223,158,0.35),transparent_70%)]" />
      <div className="relative z-10 mx-auto max-w-5xl px-5 pb-3 pt-5 text-center sm:pb-0 sm:pt-6">
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#7b602e] sm:text-xs">
          MWP Supplements · The complete collection
        </p>
        <h1 id="mwp-hero-title" className="text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Men &bull; Women &bull; Power.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-600 sm:text-base">
          Eight distinct formulas. Discover your everyday wellness essentials.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-5 text-sm sm:text-base">
          <Link href="/products" className="rounded-full bg-neutral-900 px-6 py-3 font-medium text-white transition-colors hover:bg-neutral-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
            {t("shopNow")}
          </Link>
          <Link href="/why-us" className="font-medium underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
            Learn more
          </Link>
        </div>
      </div>
      {/* Desktop framing trims extra studio background around the full lineup.
          The browser fetches only the matching hero asset. */}
      <div className="relative mx-auto w-full">
      <picture
        className="relative mx-auto block w-full"
        style={{
          maskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent), linear-gradient(to bottom, transparent, black 10%, black 88%, transparent)",
          maskComposite: "intersect",
          WebkitMaskImage: "linear-gradient(to right, transparent, black 3%, black 97%, transparent), linear-gradient(to bottom, transparent, black 10%, black 88%, transparent)",
          WebkitMaskComposite: "source-in",
        }}
      >
        <source media="(min-width: 640px)" srcSet="/mwp-eight-products-desktop.webp" width="1774" height="887" />
        <img
          src="/mwp-eight-products-mobile.webp"
          alt={PRODUCT_ALT}
          width="1122"
          height="1402"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className="block h-auto w-full sm:h-[max(300px,34vw)] sm:object-cover sm:object-[center_70%]"
        />
      </picture>
      {/* Invisible click areas, one per bottle in the banner image */}
      <nav
        aria-label="MWP products"
        className="absolute inset-x-0 top-[8%] bottom-[8%] z-20 grid grid-cols-4 grid-rows-2 sm:inset-y-0 sm:grid-cols-8 sm:grid-rows-1"
      >
        {BANNER_PRODUCTS.map((p) => (
          <Link
            key={p.name}
            href={p.href}
            aria-label={`View ${p.name}`}
            title={p.name}
            className="group relative block cursor-pointer rounded-2xl transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-neutral-900"
          >
            <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-neutral-900/90 px-3 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              {p.name}
            </span>
          </Link>
        ))}
      </nav>
      </div>
    </section>
  );
}
