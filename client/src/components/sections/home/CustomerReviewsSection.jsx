"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, CheckCircle2, Quote, Users, Package, ThumbsUp } from "lucide-react";
import Reveal from "@/components/ui/Reveal";

const STATS = [
  { value: "6", label: "Flagship Formulations", icon: Package },
  { value: "25,000+", label: "Servings Shipped", icon: ThumbsUp },
  { value: "100%", label: "Batch Lab-Tested", icon: CheckCircle2 },
  { value: "4.8/5", label: "Average Rating", icon: Star },
];

const TESTIMONIALS = [
  {
    name: "Arjun Verma",
    role: "Powerlifter",
    city: "Delhi",
    product: "Ultra Pro + Power Max",
    text: "Two months on Ultra Pro and my training energy is noticeably more stable. Power Max pre-workout gives clean focus with no crash afterwards. Label doses match what the research actually calls for.",
    rating: 5,
    verified: true,
  },
  {
    name: "Sneha Kapoor",
    role: "CrossFit Athlete",
    city: "Bengaluru",
    product: "Her Power + Her Energy",
    text: "Finally a women's stack that isn't just a repackaged fat burner. Her Energy keeps me sharp through long training days without jitters, and recovery has been better since adding Her Power.",
    rating: 5,
    verified: true,
  },
  {
    name: "Rohit Malhotra",
    role: "Marathon Runner",
    city: "Mumbai",
    product: "Rapid Boost",
    text: "Rapid Boost genuinely kicks in within about 40 minutes. Pump and blood flow during tempo runs is real. Mixes clean, no chalky aftertaste.",
    rating: 5,
    verified: true,
  },
  {
    name: "Kavya Reddy",
    role: "Fitness Coach",
    city: "Hyderabad",
    product: "Daily Boost",
    text: "I recommend Daily Boost to clients who want one solid multivitamin foundation. 32 bioavailable nutrients, chelated minerals, and it actually digests well on an empty stomach.",
    rating: 4,
    verified: true,
  },
  {
    name: "Ishaan Gupta",
    role: "Gym Enthusiast",
    city: "Pune",
    product: "Ultra Pro",
    text: "Third-party test reports are on the site for every batch, which is why I switched. Strength on compounds has been trending up and sleep quality feels deeper.",
    rating: 5,
    verified: true,
  },
];

export default function CustomerReviewsSection() {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);

  const count = TESTIMONIALS.length;
  const goNext = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const goPrev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    const id = setInterval(goNext, 6000);
    return () => clearInterval(id);
  }, [goNext]);

  const t = TESTIMONIALS[index];

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="h-px w-8 bg-red-500/40" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold">
                Trusted By Athletes
              </span>
              <span className="h-px w-8 bg-red-500/40" />
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-[44px] text-noir tracking-tight leading-tight font-extrabold">
              What The <em className="italic text-red-500">Community</em> Says
            </h2>
          </div>
        </Reveal>

        {/* Stats */}
        <Reveal delay={0.05}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="rounded-2xl border border-gray-100 bg-[#fafafa] p-5 md:p-6 text-center"
                >
                  <Icon className="h-5 w-5 text-red-600 mx-auto mb-2.5" />
                  <div className="text-2xl md:text-3xl font-extrabold text-noir tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-stone font-semibold mt-1">
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Testimonial carousel */}
        <Reveal delay={0.1}>
          <div className="relative max-w-3xl mx-auto">
            <div
              ref={trackRef}
              className="rounded-3xl border border-gray-100 bg-[#fafafa] p-7 md:p-10 text-center"
            >
              <Quote className="h-8 w-8 text-red-200 mx-auto mb-5" />
              <div className="flex items-center justify-center gap-1 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-[15px] md:text-[17px] text-noir/85 leading-relaxed font-light max-w-2xl mx-auto">
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="mt-7 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-noir">{t.name}</span>
                  {t.verified && (
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-emerald-600 font-bold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-stone">
                  {t.role} &bull; {t.city}
                </span>
                <span className="mt-2 inline-block text-[10px] uppercase tracking-[0.15em] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded">
                  {t.product}
                </span>
              </div>
            </div>

            {/* Controls */}
            <button
              onClick={goPrev}
              aria-label="Previous review"
              className="absolute left-0 md:-left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-noir/60 hover:text-noir hover:border-red-300 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={goNext}
              aria-label="Next review"
              className="absolute right-0 md:-right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-noir/60 hover:text-noir hover:border-red-300 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mt-6">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to review ${i + 1}`}
                  className={`transition-all duration-300 rounded-full ${
                    i === index ? "w-7 h-2 bg-red-500" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
