"use client";

import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

const PROMO_CARDS = [
  {
    id: "promo-1",
    image: "/promo-banner-1.jpg",
    alt: "MWP Massive Whey & Testosterone Booster",
    link: "/products?search=protein",
  },
  {
    id: "promo-2",
    image: "/promo-banner-2.jpg",
    alt: "MWP Power Max Pre-Workout",
    link: "/products?search=power",
  },
  {
    id: "promo-3",
    image: "/promo-banner-3.jpg",
    alt: "MWP Her Power & Daily Boost",
    link: "/products?search=daily",
  },
];

export default function HomePromoBanners() {
  return (
    <section className="py-6 sm:py-10 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          {/* Responsive Grid: 3 cards on desktop (lg+), 2 cards on tablet/small (sm), 1 on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {PROMO_CARDS.map((card, idx) => (
              <Link
                key={card.id}
                href={card.link}
                className="group relative block overflow-hidden rounded-md bg-[#0a0a0c] border border-gray-200/80 shadow-sm hover:shadow-xl hover:border-neutral-900 transition-all duration-300"
              >
                {/* 16:9 Banner Image Container without duplicate text overlay */}
                <div className="relative aspect-[16/9] w-full overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    priority={idx === 0}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
