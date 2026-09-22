"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, sortCategories } from "@/lib/utils";
import Reveal from "@/components/ui/Reveal";
import { IconArrowRight, IconArrowUpRight } from "@tabler/icons-react";

const MAX_ON_HOME = 12;

function CategoryCard({ category }) {
  const count = category._count?.products || 0;
  return (
    <Link href={`/category/${category.slug}`} className="group block">
      <div className="relative overflow-hidden bg-gray-100 aspect-[4/3] border border-gray-200 transition-all duration-300 group-hover:border-gray-400 group-hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,0.18)]">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name || "Category"}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200">
            <span className="text-5xl font-extrabold text-gray-300 select-none">
              {category.name?.charAt(0)?.toUpperCase() || "M"}
            </span>
          </div>
        )}

        {/* Gradient + label */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-white font-bold text-[15px] leading-tight line-clamp-2">
                {category.name}
              </h3>
              <p className="text-white/70 text-[11px] font-medium mt-0.5">
                {count > 0 ? `${count} ${count === 1 ? "product" : "products"}` : "Explore"}
              </p>
            </div>
            <span className="shrink-0 w-8 h-8 bg-white/15 backdrop-blur-sm border border-white/25 flex items-center justify-center text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <IconArrowUpRight className="h-4 w-4" stroke={2} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse bg-gray-100 aspect-[4/3]" />
      ))}
    </div>
  );
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchApi("/public/categories");
        if (!alive) return;
        if (res.success && res.data?.categories) {
          setCategories(sortCategories(res.data.categories));
        } else {
          setError(true);
        }
      } catch {
        if (alive) setError(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  if (error || (!loading && categories.length === 0)) return null;

  const shown = categories.slice(0, MAX_ON_HOME);
  const hasMore = categories.length > MAX_ON_HOME;

  return (
    <section className="py-14 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10">
        <Reveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
            <div>
              <div className="inline-flex items-center gap-2 mb-1.5 sm:mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-600 font-bold">
                  Performance Targets
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 uppercase">
                Shop by Category
              </h2>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal max-w-lg">
                Targeted nutritional protocols for strength, hormone balance, endurance, and daily wellness.
              </p>
            </div>
            <Link
              href="/categories"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-900 hover:text-neutral-600 transition-colors group self-start sm:self-end shrink-0"
            >
              <span>View All</span>
              <IconArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" stroke={2} />
            </Link>
          </div>
        </Reveal>

        {loading ? (
          <SkeletonGrid />
        ) : (
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {shown.map((c) => (
                <CategoryCard key={c.id} category={c} />
              ))}

              {hasMore && (
                <Link
                  href="/categories"
                  className="group flex flex-col items-center justify-center border-2 border-dashed border-gray-200 aspect-[4/3] text-center px-4 hover:border-gray-400 hover:bg-gray-50/40 transition-colors"
                >
                  <span className="w-10 h-10 bg-gray-900 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <IconArrowRight className="h-5 w-5" stroke={2} />
                  </span>
                  <span className="text-[13px] font-bold text-gray-900">
                    +{categories.length - MAX_ON_HOME} more
                  </span>
                  <span className="text-[11px] text-gray-500 mt-0.5">View all categories</span>
                </Link>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
