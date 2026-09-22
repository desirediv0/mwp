"use client";

import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

export default function HomeLargeCtaBanner() {
  return (
    <section className="py-6 sm:py-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <Link
            href="/products"
            className="group relative block overflow-hidden rounded-md bg-[#09090b] border border-gray-200/90 shadow-md hover:shadow-2xl transition-all duration-500"
            aria-label="Shop MWP Supplements Featured Collection"
          >
            {/* Aspect ratio container: wide cinematic on desktop, proportionate on mobile */}
            <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[2.4/1] overflow-hidden">
              <Image
                src="/large-cta-banner.jpg"
                alt="MWP Supplements - Engineered for Performance"
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 95vw, 1280px"
                className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                priority
              />

              {/* Subtle hover gradient illumination */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-40 group-hover:opacity-20 transition-opacity duration-500" />
            </div>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
