"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { fetchApi } from "@/lib/utils";
import { IconArrowRight, IconCheck } from "@tabler/icons-react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import Reveal from "@/components/ui/Reveal";

const WHATSAPP_NUMBER = "917678336268";

const FALLBACK_CATEGORIES = [
  { name: "Fragrances", slug: "fragrances" },
  { name: "Gift Sets", slug: "gift-sets" },
  { name: "Discovery", slug: "discovery" },
  { name: "Body Care", slug: "body-care" },
  { name: "Candles", slug: "candles" },
  { name: "Accessories", slug: "accessories" },
];

export function FeaturedCategoriesSection() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi("/public/categories")
      .then((res) => setCategories((res.data?.categories || []).slice(0, 12)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayCats = categories.length > 0 ? categories : FALLBACK_CATEGORIES;

  return (
    <section className="py-14 md:py-16  bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
        <div className="text-center mb-14">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-4">The Collections</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-[42px] text-noir mb-5 tracking-tight leading-tight">
            Explore Our <em className="italic text-gold-dark">Collections</em>
          </h2>
          <p className="text-[14px] md:text-[15px] text-stone max-w-lg mx-auto font-light tracking-wide">
            Discover our curated range of luxury fragrances, each crafted to leave a lasting impression
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-ivory animate-pulse border border-line" style={{ borderRadius: "8px" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
            {displayCats.map((cat) => (
              <Link
                key={cat.id || cat.slug}
                href={cat.slug ? `/category/${cat.slug}` : "/products"}
                className="group flex flex-col items-center gap-3 p-6 bg-white border border-line transition-all duration-500 hover:-translate-y-1 hover:border-gold/50"
                style={{ borderRadius: "8px" }}
              >
                <div className="w-14 h-14 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:scale-110">
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} width={56} height={56} className="w-12 h-12 object-contain" />
                  ) : (
                    <span className="font-display italic text-2xl text-gold/40">{cat.name?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <span className="text-[11px] uppercase tracking-[0.15em] font-medium leading-tight line-clamp-2 text-noir/70 group-hover:text-gold-dark transition-colors">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link href="/categories" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] font-medium text-noir hover:text-gold transition-colors duration-300">
            View All Collections
            <IconArrowRight className="h-4 w-4" stroke={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Counter({ value, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const spring = useSpring(0, { stiffness: 55, damping: 20 });
  const display = useTransform(spring, (v) => `${Math.round(v).toLocaleString("en-IN")}${suffix}`);

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
    </span>
  );
}

export function ColdChainBanner() {
  const reasons = [
    "Premium natural ingredients sourced from around the world",
    "Composed by master perfumers with decades of expertise",
    "Small-batch production ensures uncompromising quality",
    "Long lasting formulations designed for memorable evenings",
  ];

  const stats = [
    { value: 50000, suffix: "+", label: "Happy Clients" },
    { value: 1200, suffix: "+", label: "Curated Fragrances" },
    { value: 4.9, suffix: "/5", label: "Client Rating", fixed: true },
  ];

  return (
    <section className="py-14 md:py-16  bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left: Image */}
          <Reveal>
            <div className="relative">
              <div className="relative overflow-hidden aspect-[4/5] group" style={{ borderRadius: "8px" }}>
                <Image
                  src="/perfumery-story.jpg"
                  alt="The Art of Perfumery"
                  fill
                  className="object-cover transition-transform ease-out group-hover:scale-105"
                  style={{ transitionDuration: "1400ms" }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)" }}
                />
                <div className="absolute inset-3 border border-white/20 pointer-events-none" style={{ borderRadius: "6px" }} />
              </div>

              {/* Floating rating badge */}
              <div
                className="absolute -bottom-6 -right-3 md:right-8 bg-noir p-6 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] border border-gold/30"
                style={{ borderRadius: "8px" }}
              >
                <span className="font-display text-3xl block leading-tight text-gold-light">
                  4.9<span className="text-lg text-white/50">/5</span>
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-white/50">Client Rating</span>
              </div>
            </div>
          </Reveal>

          {/* Right: Content */}
          <Reveal delay={0.2}>
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium block mb-5">
                The MWP SUPPLEMENTS Story
              </span>
              <h2 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] tracking-tight text-noir mb-7 leading-[1.06]">
                The Art of <br className="hidden md:block" />
                <em className="italic text-gold-dark">Modern Perfumery</em>
              </h2>
              <p className="text-[14px] md:text-[15px] text-stone leading-relaxed mb-9 max-w-lg font-light">
                MWP SUPPLEMENTS is a luxury perfume house dedicated to creating fragrances that blend timeless elegance with modern craftsmanship. Every scent tells a story, every bottle holds an experience.
              </p>

              {/* Reasons List */}
              <div className="space-y-4 mb-10">
                {reasons.map((reason, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <span
                      className="w-6 h-6 border border-gold/60 flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ borderRadius: "4px" }}
                    >
                      <IconCheck className="w-3 h-3 text-gold-dark" stroke={2.5} />
                    </span>
                    <span className="text-[13px] text-noir/70 leading-relaxed tracking-wide font-light">{reason}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 py-8 border-y border-line mb-10">
                {stats.map(({ value, suffix, label, fixed }) => (
                  <div key={label}>
                    <span className="font-display text-2xl md:text-4xl text-noir block">
                      {fixed ? <>4.9<span className="text-gold-dark">/5</span></> : <Counter value={value} suffix={suffix} />}
                    </span>
                    <span className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-stone mt-1 block">{label}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2.5 bg-noir text-white px-7 py-3.5 text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-gold-dark transition-colors duration-500"
                  style={{ borderRadius: "8px" }}
                >
                  Explore Collection
                  <IconArrowRight className="h-4 w-4" stroke={1.5} />
                </Link>
                <Link
                  href="/about"
                  className="inline-flex items-center gap-2.5 border border-line text-noir px-7 py-3.5 text-[11px] uppercase tracking-[0.15em] font-medium hover:border-gold hover:text-gold transition-colors duration-500"
                  style={{ borderRadius: "8px" }}
                >
                  Our Story
                </Link>
              </div>
            </div>
          </Reveal>

        </div>
      </div>
    </section>
  );
}

export function WhatsAppSticky() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%20want%20to%20know%20more%20about%20your%20products.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-green-500/40"
      style={{ background: "#25D366" }}
      aria-label="Chat with us on WhatsApp"
    >
      <img src="/whatsapp.png" alt="WhatsApp" className="w-8 h-8 object-contain" />
    </a>
  );
}
