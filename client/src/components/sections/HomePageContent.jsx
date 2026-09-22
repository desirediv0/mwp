"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/utils";
import Link from "next/link";
import { ProductCard } from "@/components/products/ProductCard";
import Reveal from "@/components/ui/Reveal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { IconArrowRight, IconArrowLeft } from "@tabler/icons-react";

const SECTION_METADATA = {
  featured: {
    bannerImage: "/featured_banner.png",
    tag: "Flagship Formulations",
    title: "MAXIMUM",
    subtitle: "POTENCY",
    dateText: "Clinical strength male & gym performance nutrition",
    linkUrl: "/products?search=featured"
  },
  latest: {
    bannerImage: "/latest_banner.png",
    tag: "New Formulations",
    title: "RAPID",
    subtitle: "PERFORMANCE",
    dateText: "Fast-acting nitric expansion and cellular oxygenation",
    linkUrl: "/products?search=latest"
  },
  bestseller: {
    bannerImage: "/bestseller_banner.png",
    tag: "Most Demanded",
    title: "ATHLETE",
    subtitle: "CHOICE",
    dateText: "Top-rated sports nutrition and hormone vitality stacks",
    linkUrl: "/products?search=bestseller"
  },
  trending: {
    bannerImage: "/trending_banner.png",
    tag: "Trending Protocols",
    title: "CLINICAL",
    subtitle: "ACTIVES",
    dateText: "Standardized KSM-66, Shilajit, Citrulline Malate, and Beta-Alanine",
    linkUrl: "/products?search=trending"
  },
  new: {
    bannerImage: "/new_banner.png",
    tag: "Daily Essential",
    title: "DAILY",
    subtitle: "VITALITY",
    dateText: "32-in-1 complete multivitamin and antioxidant protection",
    linkUrl: "/products?search=new"
  }
};

const ProductSkeleton = () => (
  <div className="bg-white overflow-hidden animate-pulse border border-gray-100">
    <div className="aspect-[4/5] w-full bg-gray-100" />
    <div className="pt-4 pb-5 px-4 space-y-2.5">
      <div className="h-2.5 w-16 bg-gray-100 rounded" />
      <div className="h-3.5 w-3/4 bg-gray-100 rounded" />
      <div className="h-3.5 w-1/2 bg-gray-100 rounded" />
      <div className="h-4 w-20 bg-gray-100 rounded mt-3" />
    </div>
  </div>
);

function ProductCarousel({ products, isLoading }) {
  const [api, setApi] = useState(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };
    api.on("select", onSelect);
    onSelect();
    return () => api.off("select", onSelect);
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      if (api.canScrollNext()) {
        api.scrollNext();
      } else {
        api.scrollTo(0);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [api]);

  if (!isLoading && (!products || products.length === 0)) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 lg:gap-6">
        {[...Array(4)].map((_, i) => <ProductSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      <Carousel
        setApi={setApi}
        opts={{ align: "start", loop: false, slidesToScroll: 1 }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {products.map((product, index) => (
            <CarouselItem
              key={product.id || product.slug || index}
              className="pl-4 basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5 py-2"
            >
              <ProductCard product={product} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {canScrollPrev && (
        <button
          onClick={() => api?.scrollPrev()}
          aria-label="Previous products"
          className="absolute left-0 top-[40%] -translate-y-1/2 -translate-x-2 md:-translate-x-4 w-10 h-10 md:w-12 md:h-12 bg-neutral-900 border border-white/20 text-white flex items-center justify-center hover:bg-neutral-900 hover:border-neutral-900 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 z-10 shadow-lg"
        >
          <IconArrowLeft className="h-4 w-4 md:h-5 md:w-5" stroke={2} />
        </button>
      )}
      {canScrollNext && (
        <button
          onClick={() => api?.scrollNext()}
          aria-label="Next products"
          className="absolute right-0 top-[40%] -translate-y-1/2 translate-x-2 md:translate-x-4 w-10 h-10 md:w-12 md:h-12 bg-neutral-900 border border-white/20 text-white flex items-center justify-center hover:bg-neutral-900 hover:border-neutral-900 transition-all duration-300 opacity-0 group-hover/carousel:opacity-100 z-10 shadow-lg"
        >
          <IconArrowRight className="h-4 w-4 md:h-5 md:w-5" stroke={2} />
        </button>
      )}
    </div>
  );
}

export default function HomePageContent() {
  const [loading, setLoading] = useState(true);
  const [dbSections, setDbSections] = useState([]);
  const [products, setProducts] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        let fetchedSections = [];
        try {
          const sectionRes = await fetchApi("/public/product-sections");
          if (sectionRes?.data?.sections) {
            fetchedSections = sectionRes.data.sections;
            setDbSections(fetchedSections);
          }
        } catch (sectionErr) {
          console.error("Error fetching db sections:", sectionErr);
        }

        const displaySections = fetchedSections.length > 0 ? fetchedSections : [
          { slug: "featured" },
          { slug: "bestseller" },
          { slug: "latest" },
          { slug: "trending" },
        ];

        const dynamicEndpoints = displaySections.map((sec) => ({
          key: sec.slug?.toLowerCase(),
          url: `/public/products/type/${sec.slug?.toLowerCase()}?limit=12`,
        }));

        const results = await Promise.allSettled(
          dynamicEndpoints.map(({ url }) => fetchApi(url))
        );

        const updated = {};
        results.forEach((result, index) => {
          const key = dynamicEndpoints[index].key;
          if (result.status === "fulfilled") {
            updated[key] = result.value?.data?.products || [];
          }
        });
        setProducts(updated);
      } catch (err) {
        console.error("Error fetching home products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const renderSection = (key, sectionIndex) => {
    const sectionProducts = products[key];
    if (!loading && (!sectionProducts || sectionProducts.length === 0)) return null;

    const defaultBanner = SECTION_METADATA[key] || {
      bannerImage: "/placeholder.jpg",
      tag: "Formulation Stack",
      title: key.toUpperCase(),
      subtitle: "POWER",
      dateText: "High-performance clinical supplement protocols",
      linkUrl: `/products?search=${key}`,
    };

    const dbSection = dbSections.find(
      (s) =>
        s.slug?.toLowerCase() === key.toLowerCase() ||
        s.slug?.toLowerCase().replace(/-/g, "") === key.toLowerCase()
    );

    const cleanDesc = (text) => {
      if (!text || /jewel|handcrafted piece|custom and handcrafted/i.test(text)) {
        return defaultBanner.dateText;
      }
      return text;
    };

    const banner = {
      ...defaultBanner,
      tag: dbSection?.name && !/jewel/i.test(dbSection.name) ? dbSection.name : defaultBanner.tag,
      title: dbSection?.title || defaultBanner.title,
      subtitle: defaultBanner.subtitle,
      dateText: cleanDesc(dbSection?.description),
    };

    return (
      <section
        key={key}
        className="py-10 md:py-14 overflow-hidden bg-white border-b border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            {/* Section Header with Top-Right "View All" */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
              <div>
                <div className="inline-flex items-center gap-2 mb-1.5 sm:mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-900" />
                  <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-neutral-600 font-bold">
                    {banner.tag}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-neutral-950 uppercase">
                  {banner.title}{" "}
                  {banner.subtitle && <span>{banner.subtitle}</span>}
                </h2>
                {banner.dateText && (
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal max-w-lg">
                    {banner.dateText}
                  </p>
                )}
              </div>

              <Link
                href={banner.linkUrl}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider uppercase text-neutral-900 hover:text-neutral-600 transition-colors group self-start sm:self-end shrink-0"
              >
                <span>View All</span>
                <IconArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  stroke={2}
                />
              </Link>
            </div>

            <ProductCarousel products={sectionProducts || []} isLoading={loading} />
          </Reveal>
        </div>
      </section>
    );
  };

  const displaySections =
    dbSections.length > 0
      ? [...dbSections].sort((a, b) => a.displayOrder - b.displayOrder)
      : [
          { id: "featured", slug: "featured" },
          { id: "bestseller", slug: "bestseller" },
          { id: "latest", slug: "latest" },
          { id: "trending", slug: "trending" },
        ];

  return (
    <>
      {displaySections.map((sec, idx) => {
        const key = sec.slug?.toLowerCase();
        return renderSection(key, idx);
      })}
    </>
  );
}
