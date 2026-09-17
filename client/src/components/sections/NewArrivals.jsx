"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
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

export const NewArrivals = () => {
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
        // Try new product type first
        let response = await fetchApi("/public/products/type/new?limit=12");

        if (!response?.data?.products?.length) {
          // Fallback to recent products
          response = await fetchApi("/public/products?sort=createdAt&order=desc&limit=12");
        }

        setProducts(response?.data?.products || []);
      } catch (err) {
        console.error("Error fetching new arrivals:", err);
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
      <section className="py-10 md:py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2.5 mb-4"><span className="h-px w-8 bg-gray-900/50" /><span className="text-[10px] uppercase tracking-[0.3em] text-gray-900 font-bold">Just Arrived</span><span className="h-px w-8 bg-gray-900/50" /></div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">New <span className="text-gray-900">Arrivals</span></h2>
            <p className="text-[15px] text-gray-500 mt-3.5 font-light max-w-xl mx-auto">Fresh products just added to our lineup</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, index) => (
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
    <section className="py-10 md:py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4"><span className="h-px w-8 bg-gray-900/50" /><span className="text-[10px] uppercase tracking-[0.3em] text-gray-900 font-bold">Just Arrived</span><span className="h-px w-8 bg-gray-900/50" /></div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900">New <span className="text-gray-900">Arrivals</span></h2>
          <p className="text-[15px] text-gray-500 mt-3.5 font-light max-w-xl mx-auto">Fresh products just added to our lineup</p>
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
                  className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 py-4"
                >
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
            </CarouselContent>

            {/* Navigation Controls */}
            <CarouselPrevious className="absolute -left-2 md:left-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white hover:bg-white hover:text-primary border-gray-200 text-gray-700 shadow-lg z-10" />
            <CarouselNext className="absolute -right-2 md:right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-white hover:bg-white hover:text-primary border-gray-200 text-gray-700 shadow-lg z-10" />
          </Carousel>
        </div>

        {/* View All Button */}
        <div className="text-center mt-6">
          <Link href="/products?productType=new">
            <Button
              variant="outline"
              size="lg"
              className="font-medium border-primary text-primary border-gray-200 hover:bg-gray-900 hover:text-white group px-8"
            >
              View All New Products
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default NewArrivals;
