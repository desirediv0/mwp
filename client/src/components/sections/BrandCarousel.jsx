"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";

import { fetchApi } from "@/lib/utils";
import Image from "next/image";
import Reveal from "@/components/ui/Reveal";

export default function BrandCarousel({ tag, title }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading(true);
      try {
        const res = await fetchApi(`/public/brands-by-tag?tag=${tag}`);
        setBrands(res.data.brands || []);
        setError(null);
      } catch (err) {
        setError("Failed to load brands");
      } finally {
        setLoading(false);
      }
    };
    fetchBrands();
  }, [tag]);

  if (loading) {
    return <div className="py-8 text-center text-stone text-xs uppercase tracking-[0.3em]">Loading {title}…</div>;
  }
  if (error) {
    return null;
  }
  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <section className="py-14 md:py-20 border-y border-line bg-ivory">
      <div className="max-w-7xl mx-auto px-4">
        <Reveal className="text-center mb-12">
          <span className="luxe-eyebrow block mb-4">Curated For You</span>
          <h2 className="font-display text-3xl md:text-4xl tracking-tight text-noir">
            {title}
          </h2>
          <span className="luxe-rule mt-5 !w-20" style={{ display: "inline-block" }} />
        </Reveal>
        <Carousel opts={{ align: "start", loop: true }}>
          <CarouselContent>
            {brands.map((brand) => (
              <CarouselItem
                key={brand.id}
                className="basis-1/3 md:basis-1/4 lg:basis-[14.28%] p-4"
              >
                <Link
                  href={`/brand/${brand.slug}`}
                  className="block group text-center"
                >
                  <div className="relative h-20 md:h-36 w-20 md:w-36 mx-auto mb-4 bg-white border border-line group-hover:border-gold/60 flex items-center justify-center p-3 transition-all duration-500 group-hover:shadow-[0_18px_40px_-24px_rgba(13,11,12,0.25)]">
                    <Image
                      width={120}
                      height={120}
                      src={
                        brand.image?.startsWith("http")
                          ? brand.image
                          : `https://desirediv-storage.blr1.digitaloceanspaces.com/${brand.image}`
                      }
                      alt={brand.name}
                      className="object-contain h-16 w-16 md:h-28 md:w-28 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    />
                  </div>
                  <div className="text-[11px] uppercase tracking-[0.18em] font-medium mt-2 text-noir/70 group-hover:text-gold-dark transition-colors whitespace-nowrap overflow-hidden text-ellipsis">
                    {brand.name}
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="-left-3 md:-left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-none bg-white border-line text-noir shadow-sm hover:bg-noir hover:text-gold-light hover:border-noir" />
          <CarouselNext className="-right-1 md:right-0 top-1/2 -translate-y-1/2 h-10 w-10 rounded-none bg-white border-line text-noir shadow-sm hover:bg-noir hover:text-gold-light hover:border-noir" />
        </Carousel>
      </div>
    </section>
  );
}
