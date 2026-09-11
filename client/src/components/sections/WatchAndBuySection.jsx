"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { fetchApi, formatCurrency } from "@/lib/utils";
import Link from "next/link";
import {
  IconPlayerPlay,
  IconVolume,
  IconVolumeOff,
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconShoppingBag,
  IconBrandInstagram,
} from "@tabler/icons-react";

function getProductImageUrl(product) {
  if (!product) return null;
  if (product.image) return product.image;
  if (product.primaryImage) return product.primaryImage;
  if (product.images && product.images.length > 0) {
    const img = product.images[0];
    if (typeof img === "string") return img;
    if (img?.url) return img.url;
  }
  return null;
}

const ReelSkeleton = () => (
  <div className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] animate-pulse">
    <div className="aspect-[9/14] bg-ivory rounded-lg" />
    <div className="mt-4 space-y-2">
      <div className="h-3 w-3/4 bg-ivory-deep rounded" />
      <div className="h-3 w-1/2 bg-ivory-deep rounded" />
    </div>
  </div>
);

function ReelCard({ reel, onClick }) {
  const videoRef = useRef(null);
  const cardRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (videoRef.current) {
          if (entry.isIntersecting) {
            videoRef.current.play().catch(() => { });
            setIsPlaying(true);
          } else {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const product = reel.products?.[0];

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 w-[200px] sm:w-[220px] md:w-[240px] cursor-pointer group/card"
      onClick={() => onClick(reel)}
    >
      <div
        className="relative aspect-[9/14] overflow-hidden bg-ivory group-hover/card:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] transition-all duration-500"
        style={{ borderRadius: "8px", border: "1px solid #EAEAEA" }}
      >
        {reel.videoUrl ? (
          <video
            ref={videoRef}
            src={reel.videoUrl}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
            muted
            loop
            playsInline
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-ivory">
            <IconPlayerPlay className="h-12 w-12 text-stone/30" stroke={1} />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />

        {/* Play indicator */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-500">
          <div
            className="w-16 h-16 flex items-center justify-center bg-white/95 backdrop-blur-sm transition-transform duration-500 group-hover/card:scale-110"
            style={{ borderRadius: "50%" }}
          >
            <IconPlayerPlay className="h-6 w-6 text-noir ml-0.5" stroke={1.5} fill="currentColor" />
          </div>
        </div>

        {/* Reel badge */}
        <div className="absolute top-3 left-3">
          <div
            className="px-3 py-1.5 bg-white/95 backdrop-blur-sm"
            style={{ borderRadius: "4px" }}
          >
            <span className="text-[8px] uppercase tracking-[0.2em] text-noir font-medium">Reel</span>
          </div>
        </div>
      </div>

      {product && (
        <div className="mt-4 px-1">
          <div className="flex gap-3 items-start">
            {getProductImageUrl(product) && (
              <div
                className="w-12 h-12 overflow-hidden flex-shrink-0 border border-line"
                style={{ borderRadius: "6px" }}
              >
                <img
                  src={getProductImageUrl(product)}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-[13px] font-medium text-noir truncate leading-tight">
                {product.name}
              </h3>
              <div className="flex items-center gap-2 mt-1.5">
                {product.salePrice ? (
                  <>
                    <span className="text-[13px] font-semibold text-noir">
                      {formatCurrency(product.salePrice)}
                    </span>
                    <span className="text-[11px] line-through text-stone">
                      {formatCurrency(product.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-[13px] font-semibold text-noir">
                    {formatCurrency(product.price)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReelViewer({ reels, currentIndex, onClose, onNavigate }) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null);

  const currentReel = reels[currentIndex];
  const product = currentReel?.products?.[0];

  useEffect(() => {
    setIsMuted(true);
    setIsPlaying(false);
  }, [currentIndex]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = true;
    videoRef.current.play().catch(() => { });
    setIsPlaying(true);
    setIsMuted(true);
  }, [currentIndex]);

  const handleVideoClick = async () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      try {
        videoRef.current.muted = false;
        setIsMuted(false);
        await videoRef.current.play();
        setIsPlaying(true);
      } catch {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    } else {
      if (!videoRef.current.muted) {
        videoRef.current.muted = true;
        setIsMuted(true);
      } else {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const toggleMute = async (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    try {
      videoRef.current.muted = false;
      setIsMuted(false);
      if (videoRef.current.paused) {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && currentIndex > 0) onNavigate(currentIndex - 1);
      if (e.key === "ArrowRight" && currentIndex < reels.length - 1) onNavigate(currentIndex + 1);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, reels.length, onClose, onNavigate]);

  const touchStartRef = useRef(null);
  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const diff = touchStartRef.current - e.changedTouches[0].clientX;
    if (diff > 50 && currentIndex < reels.length - 1) onNavigate(currentIndex + 1);
    else if (diff < -50 && currentIndex > 0) onNavigate(currentIndex - 1);
    touchStartRef.current = null;
  };

  if (!currentReel) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "rgba(17,17,17,0.95)" }}
      onClick={onClose}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] w-10 h-10 md:w-11 md:h-11 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
      >
        <IconX className="h-5 w-5 text-white" stroke={2} />
      </button>

      {/* Left arrow */}
      {currentIndex > 0 && (
        <button
          onClick={() => onNavigate(currentIndex - 1)}
          className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <IconChevronLeft className="h-6 w-6 text-white" stroke={2} />
        </button>
      )}

      {/* Right arrow */}
      {currentIndex < reels.length - 1 && (
        <button
          onClick={() => onNavigate(currentIndex + 1)}
          className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <IconChevronRight className="h-6 w-6 text-white" stroke={2} />
        </button>
      )}

      {/* Video container */}
      <div
        className="relative w-full max-w-[380px] md:max-w-[420px] h-[85vh] max-h-[700px] flex flex-col bg-black overflow-hidden"
        style={{ borderRadius: "12px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 cursor-pointer" onClick={handleVideoClick}>
          <video ref={videoRef} src={currentReel.videoUrl} className="w-full h-full object-cover" loop playsInline />

          {/* Mute button */}
          <button
            onClick={toggleMute}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/60 transition-colors"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            {isMuted ? (
              <IconVolumeOff className="h-4 w-4 text-white" stroke={1.5} />
            ) : (
              <IconVolume className="h-4 w-4 text-white" stroke={1.5} />
            )}
          </button>

          {/* Tap for sound indicator */}
          {isMuted && isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
                <IconVolumeOff className="h-4 w-4 text-white" stroke={1.5} />
                <span className="text-white text-[12px] font-medium">Tap for sound</span>
              </div>
            </div>
          )}

          {/* Play/Pause indicator */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
              <div
                className="w-20 h-20 flex items-center justify-center"
                style={{ borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.9)" }}
              >
                <IconPlayerPlay className="h-8 w-8 text-noir ml-1" stroke={1.5} fill="currentColor" />
              </div>
            </div>
          )}

          {/* Counter */}
          <div
            className="absolute top-4 left-4 px-3 py-1.5"
            style={{ borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.4)" }}
          >
            <span className="text-white text-[11px] font-medium tracking-wide">
              {currentIndex + 1} / {reels.length}
            </span>
          </div>
        </div>

        {/* Product panel */}
        {product && (
          <div
            className="absolute bottom-0 left-0 right-0 p-5 pb-6"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.7) 60%, transparent)" }}
          >
            <div className="flex items-end gap-4">
              {getProductImageUrl(product) && (
                <div
                  className="w-16 h-16 overflow-hidden flex-shrink-0 shadow-lg"
                  style={{ borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)" }}
                >
                  <img src={getProductImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white text-[14px] font-medium truncate">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1.5">
                  {product.salePrice ? (
                    <>
                      <span className="text-white text-[16px] font-semibold">{formatCurrency(product.salePrice)}</span>
                      <span className="text-[12px] line-through" style={{ color: "rgba(255,255,255,0.5)" }}>{formatCurrency(product.price)}</span>
                    </>
                  ) : (
                    <span className="text-white text-[16px] font-semibold">{formatCurrency(product.price)}</span>
                  )}
                </div>
              </div>
              <Link
                href={`/products/${product.slug || product.id}`}
                className="flex-shrink-0 flex items-center gap-2 bg-white text-noir px-5 py-3 text-[11px] uppercase tracking-[0.12em] font-medium hover:bg-gold transition-colors shadow-lg"
                style={{ borderRadius: "6px", height: "48px" }}
              >
                <IconShoppingBag className="h-4 w-4" stroke={1.5} />
                <span className="hidden sm:inline">View</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WatchAndBuySection() {
  const [reels, setReels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const scrollRef = useRef(null);
  const isPausedRef = useRef(false);

  useEffect(() => {
    const fetchReels = async () => {
      try {
        const data = await fetchApi("/api/public/video-reels");
        setReels(data?.data?.reels || []);
      } catch (error) {
        console.error("Failed to fetch video reels:", error);
        setReels([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReels();
  }, []);

  useEffect(() => {
    if (reels.length === 0 || !scrollRef.current) return;
    const container = scrollRef.current;
    let animationId;
    let speed = 0.5;
    const autoScroll = () => {
      if (!isPausedRef.current && container) {
        container.scrollLeft += speed;
        const maxScroll = container.scrollWidth - container.clientWidth;
        if (container.scrollLeft >= maxScroll) container.scrollLeft = 0;
      }
      animationId = requestAnimationFrame(autoScroll);
    };
    animationId = requestAnimationFrame(autoScroll);
    return () => { if (animationId) cancelAnimationFrame(animationId); };
  }, [reels]);

  const handleMouseEnter = () => { isPausedRef.current = true; };
  const handleMouseLeave = () => { isPausedRef.current = false; };
  const handleTouchStart = () => { isPausedRef.current = true; };
  const handleTouchEnd = () => { setTimeout(() => { isPausedRef.current = false; }, 2000); };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const amount = scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
    }
  };

  const openViewer = useCallback((reel) => {
    const index = reels.findIndex((r) => r.id === reel.id);
    setViewerIndex(index >= 0 ? index : 0);
    setViewerOpen(true);
    document.body.style.overflow = "hidden";
  }, [reels]);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    document.body.style.overflow = "";
  }, []);

  const navigateViewer = useCallback((index) => { setViewerIndex(index); }, []);

  useEffect(() => {
    if (viewerOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [viewerOpen]);

  if (isLoading) {
    return (
      <section className="py-14 md:py-16  bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gold block mb-3 font-medium">Luxury Films</span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl tracking-tight text-noir">Watch &amp; Buy</h2>
          </div>
          <div className="flex gap-5 overflow-hidden">
            {[...Array(5)].map((_, i) => <ReelSkeleton key={i} />)}
          </div>
        </div>
      </section>
    );
  }

  if (reels.length === 0) return null;

  return (
    <>
      <section className="py-14 md:py-16  bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-14">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium">Luxury Films</span>
                <span className="h-px w-8 bg-gold/40" />
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-[42px] tracking-tight text-noir leading-tight">
                Watch <em className="italic text-gold-dark">&amp; Buy</em>
              </h2>
              <p className="text-[15px] text-stone mt-3 font-light tracking-wide max-w-md">
                Tap to watch — shop the look straight from the reel
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/mwpsupplements"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] font-medium text-stone hover:text-noir transition-colors"
              >
                <IconBrandInstagram className="h-4 w-4" stroke={1.5} />
                @mwpsupplements
              </a>
            </div>
          </div>

          {/* Reels Carousel */}
          <div className="relative group" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
              onClick={() => scroll("left")}
              aria-label="Scroll reels left"
              className="absolute left-0 top-[30%] -translate-y-1/2 z-10 w-12 h-12 bg-white border border-line flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-noir hover:text-white hover:border-noir text-noir"
              style={{ borderRadius: "8px" }}
            >
              <IconChevronLeft className="h-5 w-5" stroke={1.5} />
            </button>

            <div
              ref={scrollRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none", scrollBehavior: "auto" }}
            >
              {reels.map((reel) => (
                <ReelCard key={reel.id} reel={reel} onClick={openViewer} />
              ))}
            </div>

            <button
              onClick={() => scroll("right")}
              aria-label="Scroll reels right"
              className="absolute right-0 top-[30%] -translate-y-1/2 z-10 w-12 h-12 bg-white border border-line flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-noir hover:text-white hover:border-noir text-noir"
              style={{ borderRadius: "8px" }}
            >
              <IconChevronRight className="h-5 w-5" stroke={1.5} />
            </button>
          </div>
        </div>
      </section>

      {viewerOpen && (
        <ReelViewer reels={reels} currentIndex={viewerIndex} onClose={closeViewer} onNavigate={navigateViewer} />
      )}
    </>
  );
}
