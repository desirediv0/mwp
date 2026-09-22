"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/utils";
import { ProductCard } from "@/components/products/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

// Skeleton loader
const ProductSkeleton = () => (
  <div className="bg-white overflow-hidden animate-pulse border border-gray-100">
    <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
    <div className="p-4">
      <div className="h-3 w-16 bg-gray-200 mx-auto mb-2"></div>
      <div className="h-4 w-full bg-gray-100 mb-2"></div>
      <div className="h-4 w-3/4 mx-auto bg-gray-100 mb-3"></div>
      <div className="h-6 w-20 bg-gray-200 mx-auto"></div>
    </div>
  </div>
);

export const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [api, setApi] = useState(null);

  // Auto-scroll carousel every 2.5 seconds
  useEffect(() => {
    if (!api) return;

    const scrollInterval = setInterval(() => {
      api.scrollNext();
    }, 2500);

    return () => clearInterval(scrollInterval);
  }, [api]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Try featured type first
        let response = await fetchApi("/public/products/type/featured?limit=12");

        if (!response?.data?.products?.length) {
          // Fallback to featured products
          response = await fetchApi("/public/products?featured=true&limit=12");
        }

        setProducts(response?.data?.products || []);
      } catch (err) {
        console.error("Error fetching featured products:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (error) {
    return null;
  }

  if (loading) {
    return (
      <section className="py-10 md:py-14 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
            <div>
              <div className="h-3 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-8 w-48 bg-gray-200 rounded mb-1 animate-pulse" />
              <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 md:py-14 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Top-Right "View All" */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
          <div>
            <div className="inline-flex items-center gap-2 mb-1.5 sm:mb-2">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-600 font-bold">
                Bestsellers
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 uppercase">
              Featured Products
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal max-w-lg">
              Handpicked bestsellers our athletes keep coming back to
            </p>
          </div>

          <Link
            href="/products?featured=true"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-900 hover:text-neutral-600 transition-colors group self-start sm:self-end shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Products Carousel */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {products.map((product, index) => (
                <CarouselItem
                  key={product.id || product.slug || index}
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 py-2 sm:py-4"
                >
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Controls */}
            <CarouselPrevious className="hidden sm:flex absolute -left-2 md:left-2 top-1/2 -translate-y-1/2 h-9 w-9 md:h-10 md:w-10 bg-white hover:bg-white hover:text-primary border-gray-200 text-gray-700 shadow-lg z-10" />
            <CarouselNext className="hidden sm:flex absolute -right-2 md:right-2 top-1/2 -translate-y-1/2 h-9 w-9 md:h-10 md:w-10 bg-white hover:bg-white hover:text-primary border-gray-200 text-gray-700 shadow-lg z-10" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
