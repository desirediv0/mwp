"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { IconArrowRight, IconArrowLeft, IconArrowNarrowDown } from "@tabler/icons-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../ui/carousel";

function normalizeSlide(slide) {
  return {
    img: slide.img || slide.desktopImage || "/hero.jpg",
    tabletImg: slide.tabletImg || slide.tabletImage || "/hero-tablet.jpg",
    smimg: slide.smimg || slide.mobileImage || "/hero-mobile.jpg",
    title: slide.title || slide.headline || "",
    subtitle: slide.subtitle || slide.subheadline || "",
    ctaLink: slide.ctaLink || slide.link || "/products",
  };
}

function bannerToSlide(banner) {
  return normalizeSlide({
    img: banner.desktopImage || "",
    tabletImg: banner.tabletImage || banner.desktopImage || "",
    smimg: banner.mobileImage || banner.desktopImage || "",
    title: banner.title || "",
    subtitle: banner.subtitle || "",
    ctaLink: banner.link || "/products",
  });
}

const FALLBACK_SLIDES = [
  {
    img: "/hero-banner.png",
    tabletImg: "/hero-banner.png",
    smimg: "/hero-mobile.png",
    title: "MWP SUPPLEMENTS",
    subtitle: "MEN | WOMEN | POWER — High-performance clinical sports and vitality nutrition.",
    ctaLink: "/products",
  },
  {
    img: "/deals-sub.png",
    tabletImg: "/deals-sub.png",
    smimg: "/hero-mobile.png",
    title: "PURE CLINICAL POTENCY",
    subtitle: "Standardized active extracts, zero fillers, third-party lab certified.",
    ctaLink: "/products",
  },
];

/* Split a headline into two visual lines for the masked reveal */
function splitTitle(title = "") {
  const words = title.trim().split(/\s+/);
  if (words.length < 3) return [title];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
}

const lineReveal = {
  hidden: { y: "115%", rotate: 2 },
  visible: (i) => ({
    y: "0%",
    rotate: 0,
    transition: { duration: 1, delay: 0.35 + i * 0.14, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function HeroSection() {
  const [api, setApi] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [device, setDevice] = useState("desktop");
  const [slides, setSlides] = useState(FALLBACK_SLIDES);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      if (w < 768) {
        setDevice("mobile");
      } else if (w < 1024) {
        setDevice("tablet");
      } else {
        setDevice("desktop");
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await fetchApi("/public/banners");
        const bannersArray = response?.data?.banners;
        if (Array.isArray(bannersArray) && bannersArray.length > 0) {
          setSlides(bannersArray.map(bannerToSlide));
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      } catch (err) {
        console.error("Error fetching banners:", err);
        setSlides(FALLBACK_SLIDES);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (!api || !autoplay) return;
    const interval = setInterval(() => api.scrollNext(), 6500);
    return () => clearInterval(interval);
  }, [api, autoplay]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => api.off("select", onSelect);
  }, [api]);

  const handleSlideClick = (ctaLink) => router.push(ctaLink || "/products");

  if (isLoading) {
    return (
      <div className="relative w-full h-[88vh] md:h-screen bg-noir flex items-center justify-center luxe-grain">
        <div className="flex flex-col items-center gap-6">
          <span className="font-display text-2xl tracking-[0.3em] text-white font-extrabold uppercase">MWP SUPPLEMENTS</span>
          <span className="block h-px w-32 overflow-hidden bg-white/10 relative">
            <span className="absolute inset-y-0 left-0 w-1/3 bg-red-500 animate-marquee-x" />
          </span>
        </div>
      </div>
    );
  }

  if (slides.length === 0) return null;

  const active = slides[currentSlide] || slides[0];

  return (
    <section className="w-full relative overflow-hidden bg-noir text-ivory">
      <Carousel
        setApi={setApi}
        opts={{ loop: true, align: "start", duration: 34 }}
        className="w-full"
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="p-0">
              <div
                className="relative w-full h-[88vh] md:h-screen overflow-hidden cursor-pointer"
                onClick={() => handleSlideClick(slide.ctaLink)}
                data-cursor="Explore"
              >
                <Image
                  src={device === "mobile" ? slide.smimg : (device === "tablet" ? slide.tabletImg : slide.img)}
                  alt={slide.title || `Slide ${index + 1}`}
                  fill
                  className="object-cover object-center hero-kenburns"
                  priority={index === 0}
                  sizes="100vw"
                />

                {/* Cinematic veil */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(26,13,33,0.82) 0%, rgba(26,13,33,0.48) 45%, rgba(8,60,90,0.18) 75%), linear-gradient(0deg, rgba(26,13,33,0.7) 0%, rgba(26,13,33,0) 35%)",
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Grain veil over imagery */}
      <div className="absolute inset-0 pointer-events-none luxe-grain" aria-hidden="true" />

      {/* Hairline frame (passe-partout) */}
      <div className="absolute inset-3 md:inset-5 border border-white/15 pointer-events-none hidden sm:block" aria-hidden="true" />

      {/* Editorial copy — animated per active slide */}
      <div className="absolute inset-0 flex items-end md:items-center pointer-events-none">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 w-full pb-32 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.35 } }}
              className="max-w-2xl pointer-events-auto"
            >
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="flex items-center gap-4 mb-6"
              >
                <span className="block h-px w-10 bg-gradient-to-r from-gold to-azure" />
                <span className="luxe-eyebrow-dark">MWP Supplements — Maison de Mode</span>
              </motion.div>

              <h1 className="font-display font-medium text-[2.6rem] leading-[1.04] sm:text-6xl md:text-7xl lg:text-[5.2rem] tracking-tight mb-6 text-ivory">
                {splitTitle(active.title).map((line, i) => (
                  <span key={i} className="block overflow-hidden pb-1 -mb-1">
                    <motion.span custom={i} variants={lineReveal} className="block">
                      {i === 1 ? <em className="luxe-italic text-gradient-light">{line}</em> : line}
                    </motion.span>
                  </span>
                ))}
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.75 }}
                className="text-sm sm:text-[15px] text-white/70 font-light leading-relaxed tracking-wide mb-10 max-w-md"
              >
                {active.subtitle}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="flex flex-wrap gap-4"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSlideClick(active.ctaLink);
                  }}
                  className="btn-luxe-gold active:scale-95"
                >
                  Shop the Edit <IconArrowRight className="h-4 w-4" stroke={1.5} />
                </button>
                <Link href="/categories" className="btn-luxe-white active:scale-95">
                  Explore Collections
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom control bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 md:px-16 pb-7 md:pb-9 flex items-end justify-between gap-6">
          {/* Counter + progress */}
          <div className="flex items-center gap-5">
            <span className="font-display text-lg text-ivory tabular-nums">
              {String(currentSlide + 1).padStart(2, "0")}
            </span>
            <span className="relative block h-px w-24 sm:w-40 bg-white/20 overflow-hidden">
              <motion.span
                key={currentSlide}
                className="absolute inset-y-0 left-0 bg-gold"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 6.5, ease: "linear" }}
              />
            </span>
            <span className="font-display text-sm text-white/45 tabular-nums">
              {String(slides.length).padStart(2, "0")}
            </span>
          </div>

          {/* Arrows */}
          {slides.length > 1 && (
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => api?.scrollPrev()}
                aria-label="Previous slide"
                className="h-12 w-12 flex items-center justify-center border border-white/25 text-ivory/80 hover:border-gold hover:text-gold-light hover:bg-white/5 transition-all duration-300"
              >
                <IconArrowLeft className="h-4 w-4" stroke={1.5} />
              </button>
              <button
                onClick={() => api?.scrollNext()}
                aria-label="Next slide"
                className="h-12 w-12 flex items-center justify-center border border-white/25 text-ivory/80 hover:border-gold hover:text-gold-light hover:bg-white/5 transition-all duration-300"
              >
                <IconArrowRight className="h-4 w-4" stroke={1.5} />
              </button>
            </div>
          )}

          {/* Scroll cue */}
          <div className="hidden lg:flex items-center gap-3 text-white/50">
            <span className="text-[9px] uppercase tracking-[0.4em]">Scroll</span>
            <motion.span
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            >
              <IconArrowNarrowDown className="h-4 w-4" stroke={1.5} />
            </motion.span>
          </div>
        </div>
      </div>

      {/* Vertical side label */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-30 hidden xl:block pointer-events-none" aria-hidden="true">
        <span className="block text-[9px] uppercase tracking-[0.6em] text-white/35 [writing-mode:vertical-rl]">
          Bags · Clothing · Accessories — Est. MMXXV
        </span>
      </div>
    </section>
  );
}
