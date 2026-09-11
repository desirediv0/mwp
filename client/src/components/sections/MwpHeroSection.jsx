"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
} from "@tabler/icons-react";

/* ------------------------------------------------------------------ *
 * Local fallback slides — shown when the banner API returns nothing.
 * desk.PNG / desk2.PNG  -> desktop + tablet
 * mob.PNG  / mob2.PNG   -> mobile
 * ------------------------------------------------------------------ */
const LOCAL_FALLBACKS = [
  {
    id: "fallback-1",
    image: "/hero-desk-1.jpg",
    tabletImage: "/hero-desk-1.jpg",
    mobileImage: "/hero-mob-1.jpg",
    title: "Engineered For Peak Output",
    subtitle:
      "Zero filler. Zero banned substances. Precision-dosed active extracts built for high-performing men and women.",
    link: "/products",
  },
  {
    id: "fallback-2",
    image: "/hero-desk-2.jpg",
    tabletImage: "/hero-desk-2.jpg",
    mobileImage: "/hero-mob-2.jpg",
    title: "Men. Women. Power.",
    subtitle:
      "Clinical-grade sports nutrition. Explore all flagship formulations — lab tested and GMP certified.",
    link: "/products",
  },
];

function SkeletonLoader({ heightStyle }) {
  return (
    <div
      className="relative w-full bg-[#09090b] animate-pulse overflow-hidden"
      style={heightStyle}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#09090b] via-[#0f0f12] to-[#09090b]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-6 px-6">
          <div className="h-px w-16 bg-white/10 mx-auto" />
          <div className="h-8 w-56 bg-white/5 rounded mx-auto" />
          <div className="h-4 w-72 bg-white/5 rounded mx-auto" />
          <div className="h-10 w-40 bg-white/5 rounded mx-auto mt-4" />
        </div>
      </div>
    </div>
  );
}

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? "-100%" : "100%", opacity: 0 }),
};

const contentVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay: 0.3 + i * 0.15, ease: [0.22, 1, 0.36, 1] },
  }),
  exit: { opacity: 0, y: -12, transition: { duration: 0.3 } },
};

export default function MwpHeroSection() {
  const router = useRouter();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLaptop, setIsLaptop] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoPlayRef = useRef(null);

  /* ---- responsive breakpoints (JS driven, matches reference impl) ---- */
  useEffect(() => {
    const checkScreen = () => {
      const w = window.innerWidth;
      setIsMobile(w < 640);
      setIsTablet(w >= 640 && w < 1024);
      setIsLaptop(w >= 1024 && w < 1440);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  /* ---- fetch banners; fall back to LOCAL_FALLBACKS on empty/error ---- */
  useEffect(() => {
    let alive = true;
    fetchApi("/public/banners")
      .then((res) => {
        const arr = res?.data?.banners;
        if (alive && Array.isArray(arr) && arr.length > 0) {
          const mapped = arr
            .map((b, i) => {
              const desktop = b.desktopImage || b.image || b.imageUrl || null;
              const mobile = b.mobileImage || b.mobileImg || null;
              return {
                id: b.id || b._id || `banner-${i}`,
                image: desktop || mobile || "/hero-desk-1.jpg",
                tabletImage: desktop || mobile || "/hero-desk-1.jpg",
                mobileImage: mobile || desktop || "/hero-mob-1.jpg",
                title: b.title || "MWP SUPPLEMENTS",
                subtitle:
                  b.subtitle || "Clinical-grade performance nutrition for men & women.",
                link: b.link || "/products",
              };
            })
            .filter((b) => b.image || b.mobileImage);
          setBanners(mapped.length > 0 ? mapped : LOCAL_FALLBACKS);
        } else if (alive) {
          setBanners(LOCAL_FALLBACKS);
        }
      })
      .catch(() => {
        if (alive) setBanners(LOCAL_FALLBACKS);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const goTo = useCallback(
    (idx) => {
      setDirection(idx > currentIndex ? 1 : -1);
      setCurrentIndex(idx);
    },
    [currentIndex]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    autoPlayRef.current = setInterval(next, 5000);
    return () => clearInterval(autoPlayRef.current);
  }, [banners.length, isPaused, next]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.touches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev();
  };

  const heightStyle = {
    height: isMobile ? "480px" : isTablet ? "600px" : isLaptop ? "700px" : "820px",
  };

  if (loading) return <SkeletonLoader heightStyle={heightStyle} />;

  const current = banners[currentIndex];

  return (
    <section
      className="relative w-full bg-[#09090b] text-white overflow-hidden"
      style={heightStyle}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      role="region"
      aria-label="Hero banner carousel"
    >
      {/* -------- image slide -------- */}
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={current.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={
              isMobile
                ? current.mobileImage || "/hero-mob-1.jpg"
                : isTablet
                ? current.tabletImage || "/hero-desk-1.jpg"
                : current.image || "/hero-desk-1.jpg"
            }
            alt={current.title}
            fill
            priority={currentIndex === 0}
            sizes="100vw"
            className="object-cover object-center"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiMwOTA5MGIiLz48L3N2Zz4="
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* -------- text overlay -------- */}
      <AnimatePresence mode="wait">
        <motion.div key={`text-${current.id}`} className="absolute inset-0 z-20 flex items-center">
          <div className="w-full px-5 sm:px-10 md:px-16 lg:px-20 xl:px-24">
            <div className="max-w-[520px] sm:max-w-[640px] pointer-events-auto">
              <motion.div
                custom={0}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-center gap-2 sm:gap-3 mb-4 md:mb-7"
              >
                <span className="block h-px w-6 sm:w-10 bg-red-500" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.25em] sm:tracking-[0.3em] text-white/70 font-semibold">
                  MWP Supplements &bull; Men | Women | Power
                </span>
              </motion.div>

              <motion.h1
                custom={1}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="font-extrabold uppercase leading-[1.05] tracking-tight mb-4 sm:mb-6 text-white"
                style={{
                  fontSize: isMobile ? "28px" : isTablet ? "46px" : isLaptop ? "56px" : "68px",
                }}
              >
                {current.title}
              </motion.h1>

              <motion.p
                custom={2}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="font-normal leading-relaxed tracking-wide mb-6 sm:mb-8 md:mb-10 text-white/75 max-w-[540px]"
                style={{ fontSize: isMobile ? "14px" : isTablet ? "16px" : "18px" }}
              >
                {current.subtitle}
              </motion.p>

              <motion.div
                custom={3}
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-row flex-wrap gap-2 sm:gap-3"
              >
                <button
                  onClick={() => router.push(current.link || "/products")}
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-1.5 sm:py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-[10px] sm:text-[12px] font-bold tracking-[0.08em] uppercase rounded-[4px] sm:rounded-[6px] hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/30 transition-all duration-300 active:scale-[0.98]"
                  style={{ height: isMobile ? "34px" : "48px" }}
                >
                  Shop Now
                  <IconArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" stroke={2} />
                </button>
                <Link
                  href="/categories"
                  className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-1.5 sm:py-2 border border-white/25 text-white text-[10px] sm:text-[12px] font-semibold tracking-[0.08em] uppercase rounded-[4px] sm:rounded-[6px] hover:bg-white/10 transition-all duration-300 active:scale-[0.98]"
                  style={{ height: isMobile ? "34px" : "48px" }}
                >
                  Collections
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* -------- arrows + dots -------- */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-black/50 transition-all duration-300"
            aria-label="Previous banner"
          >
            <IconChevronLeft className="h-4 w-4 sm:h-6 sm:w-6" stroke={1.5} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-black/50 transition-all duration-300"
            aria-label="Next banner"
          >
            <IconChevronRight className="h-4 w-4 sm:h-6 sm:w-6" stroke={1.5} />
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === currentIndex
                    ? "w-8 h-2 bg-red-500"
                    : "w-2 h-2 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}

      {/* -------- slide counter -------- */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div className="w-full px-5 sm:px-10 md:px-16 lg:px-20 xl:px-24 pb-4 sm:pb-6 md:pb-8 flex items-end justify-end">
          <span className="text-[8px] sm:text-[9px] uppercase tracking-[0.25em] sm:tracking-[0.35em] text-white/25">
            {String(currentIndex + 1).padStart(2, "0")} / {String(banners.length).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 z-[5] bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none" />
    </section>
  );
}
