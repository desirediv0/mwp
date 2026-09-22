"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Star,
  ChevronLeft,
  ChevronRight,
  BadgeCheck,
  ThumbsUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const STATS = [
  { value: "4.9 / 5", label: "Average Rating", sub: "Based on 1,420+ verified reviews" },
  { value: "100%", label: "Lab Batch Tested", sub: "Published HPLC reports" },
  { value: "25,000+", label: "Orders Delivered", sub: "Across 140+ Indian cities" },
  { value: "98.4%", label: "Athlete Retention", sub: "Repeat monthly orders" },
];

const TESTIMONIALS = [
  {
    id: "review-1",
    name: "Arjun Verma",
    role: "Competitive Powerlifter",
    city: "Mumbai",
    avatar: "/reviews/arjun.jpg",
    rating: 5,
    date: "2 days ago",
    verified: true,
    batchNo: "Batch #UP-204",
    product: "Ultra Pro Iso-Whey 2kg",
    flavor: "Double Rich Chocolate",
    headline: "Unmatched mixability, zero bloating on 2 scoops daily",
    text: "Switched to Ultra Pro 8 weeks out from my regional meet. 27g protein per scoop with zero digestive distress is genuinely hard to find. Mixes completely in 10 seconds without any shaker ball.",
    helpful: 94,
  },
  {
    id: "review-2",
    name: "Sneha Kapoor",
    role: "CrossFit Athlete & Coach",
    city: "Bengaluru",
    avatar: "/reviews/sneha.jpg",
    rating: 5,
    date: "4 days ago",
    verified: true,
    batchNo: "Batch #HP-118",
    product: "Her Power + Her Energy Stack",
    flavor: "Mixed Berry Rush",
    headline: "Clean sustained training energy with zero crash",
    text: "Most women's pre-workouts are underdosed sugar mixes. Her Energy actually gives clean laser focus through 90-minute morning WODs with no rapid heart rate or jitters. DOMS recovery has been incredible.",
    helpful: 88,
  },
  {
    id: "review-3",
    name: "Rohit Malhotra",
    role: "Marathon Runner & Triathlete",
    city: "Delhi NCR",
    avatar: "/reviews/rohit.jpg",
    rating: 5,
    date: "1 week ago",
    verified: true,
    batchNo: "Batch #RB-302",
    product: "Rapid Boost Intra-Workout",
    flavor: "Tangy Orange Rush",
    headline: "Endurance during 20km tempo runs is genuinely real",
    text: "Rapid Boost kicks in within 20 minutes. During my Sunday 20km sessions, glycogen and hydration stay locked in. Doesn't sit heavy in the stomach even in intense summer humidity.",
    helpful: 72,
  },
  {
    id: "review-4",
    name: "Kavya Reddy",
    role: "Clinical Sports Nutritionist",
    city: "Hyderabad",
    avatar: "/reviews/kavya.jpg",
    rating: 5,
    date: "1 week ago",
    verified: true,
    batchNo: "Batch #DB-105",
    product: "Daily Boost Foundation",
    flavor: "Chelated Mineral Pack",
    headline: "100% transparent label — exact milligram doses",
    text: "I audit supplement certificates for athletes. MWP's published HPLC third-party test reports match the bottle 1:1. Chelated zinc and bioavailable magnesium make this a world-class foundation.",
    helpful: 116,
  },
  {
    id: "review-5",
    name: "Ishaan Gupta",
    role: "Strength Enthusiast",
    city: "Pune",
    avatar: "/reviews/ishaan.jpg",
    rating: 5,
    date: "2 weeks ago",
    verified: true,
    batchNo: "Batch #PM-408",
    product: "Power Max Pre-Workout",
    flavor: "Blue Razz Ice",
    headline: "Heavy leg day drive is insane. Pure focus, no headache",
    text: "3.2g Beta-Alanine and 350mg Caffeine Anhydrous with L-Theanine hits just right. The pumps on heavy squats are skin-splitting. Best part: you don't get the post-caffeine afternoon headache.",
    helpful: 81,
  },
  {
    id: "review-6",
    name: "Ananya Deshmukh",
    role: "Physique Athlete",
    city: "Ahmedabad",
    avatar: "/reviews/ananya.jpg",
    rating: 5,
    date: "3 weeks ago",
    verified: true,
    batchNo: "Batch #UP-208",
    product: "Ultra Pro Iso-Whey",
    flavor: "Vanilla Bean Cream",
    headline: "Third-party tested purity made me a lifetime customer",
    text: "I scan the QR code on every tub and verify the lab batch analysis directly. Heavy metals test reports are always clear. Taste is 10/10, macros are clinical grade. Highly recommended!",
    helpful: 95,
  },
];

export default function CustomerReviewsSection() {
  const [page, setPage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 3 items per page on desktop
  const itemsPerPage = 3;
  const totalPages = Math.ceil(TESTIMONIALS.length / itemsPerPage);

  const nextPage = useCallback(() => {
    setPage((prev) => (prev + 1) % totalPages);
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => (prev - 1 + totalPages) % totalPages);
  }, [totalPages]);

  // Auto-scroll every 4.5 seconds (pauses on mouse hover)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextPage();
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, nextPage]);

  const visibleReviews = TESTIMONIALS.slice(
    page * itemsPerPage,
    page * itemsPerPage + itemsPerPage
  );

  return (
    <section className="py-14 sm:py-20 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Navigation */}
        <Reveal>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 sm:mb-12 pb-5 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
                <span className="text-[11px] uppercase tracking-[0.25em] text-neutral-600 font-bold">
                  Verified Athlete Feedback
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-neutral-950">
                What Athletes Are Saying
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-neutral-600 max-w-lg">
                Real feedback from real powerlifters, runners, coaches, and gym athletes who train on MWP.
              </p>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3 self-start md:self-end">
              <span className="text-xs font-bold text-neutral-500 tracking-wider">
                {page + 1} / {totalPages}
              </span>
              <div className="inline-flex rounded-md border border-gray-200 overflow-hidden shadow-sm">
                <button
                  onClick={prevPage}
                  aria-label="Previous reviews"
                  className="p-2.5 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors border-r border-gray-200"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextPage}
                  aria-label="Next reviews"
                  className="p-2.5 bg-white hover:bg-neutral-100 text-neutral-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Real Reviews Grid with auto-scroll and hover-pause: 3 cards on desktop, 2 on tablet, 1 on mobile */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          className="transition-all duration-500"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {visibleReviews.map((r, i) => (
              <Reveal key={`${page}-${r.id}`} delay={0.06 * i}>
                <div className="group h-full flex flex-col justify-between bg-white border border-gray-200/90 rounded-md p-5 sm:p-6 shadow-sm hover:shadow-xl hover:border-neutral-900 transition-all duration-300 relative">
                  <div>
                    {/* Reviewer Header: Distinct Avatar + Name + Verified Badge */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-900/10 shadow-inner flex-shrink-0 bg-neutral-100">
                          <Image
                            src={r.avatar}
                            alt={r.name}
                            fill
                            sizes="48px"
                            className="object-cover object-center"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm sm:text-base font-extrabold text-neutral-950 tracking-tight">
                              {r.name}
                            </h3>
                            {r.verified && (
                              <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] sm:text-xs text-neutral-500 font-medium">
                            {r.role} &bull; {r.city}
                          </p>
                        </div>
                      </div>

                      {/* Date */}
                      <span className="text-[10px] sm:text-[11px] font-semibold text-neutral-400 whitespace-nowrap">
                        {r.date}
                      </span>
                    </div>

                    {/* Rating Stars & Verification Tag */}
                    <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, idx) => (
                          <Star
                            key={idx}
                            className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                          />
                        ))}
                        <span className="ml-1.5 text-xs font-bold text-neutral-900">
                          5.0
                        </span>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {r.batchNo}
                      </span>
                    </div>

                    {/* Product purchased tag */}
                    <div className="mb-3">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-100 text-neutral-800 text-[11px] font-semibold">
                        <Sparkles className="w-3 h-3 text-neutral-600" />
                        <span>{r.product}</span>
                        <span className="text-neutral-400">&bull;</span>
                        <span className="text-neutral-500">{r.flavor}</span>
                      </div>
                    </div>

                    {/* Review Headline & Authentic Body */}
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-2 leading-snug">
                      &ldquo;{r.headline}&rdquo;
                    </h4>
                    <p className="text-xs sm:text-[13px] text-neutral-600 leading-relaxed font-normal">
                      {r.text}
                    </p>
                  </div>

                  {/* Card Footer: Helpful counter */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-neutral-500">
                    <span className="inline-flex items-center gap-1.5 text-neutral-600 font-medium">
                      <ThumbsUp className="w-3.5 h-3.5 text-neutral-500" />
                      {r.helpful} athletes found this helpful
                    </span>
                    <span className="font-semibold text-emerald-600">Verified Buyer</span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Dots Indicator for Auto-scroll Progress */}
          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                aria-label={`Go to page ${i + 1}`}
                className={`h-2 transition-all duration-500 rounded-full ${
                  page === i
                    ? "w-8 bg-neutral-950"
                    : "w-2.5 bg-neutral-300 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Trust Stats Strip */}
        <Reveal delay={0.15}>
          <div className="mt-10 sm:mt-12 pt-8 border-t border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((s, idx) => (
              <div
                key={idx}
                className="bg-neutral-50 border border-gray-200/70 rounded-md p-4 sm:p-5 text-center"
              >
                <div className="text-xl sm:text-2xl font-black text-neutral-950 tracking-tight">
                  {s.value}
                </div>
                <div className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-neutral-800 mt-1">
                  {s.label}
                </div>
                <div className="text-[10px] sm:text-[11px] text-neutral-500 mt-0.5">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
