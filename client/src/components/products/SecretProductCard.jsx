"use client";

import Link from "next/link";
import Image from "next/image";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconLock,
} from "@tabler/icons-react";

const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function SecretProductCard({ product }) {
  const basePrice = product.basePrice;
  const hasSale = product.hasSale;
  const regularPrice = product.regularPrice;
  const discountPercent =
    hasSale && regularPrice && basePrice && regularPrice > basePrice
      ? Math.round(((regularPrice - basePrice) / regularPrice) * 100)
      : null;

  return (
    <Link href={`/secret-collection/${product.slug}`} className="group block">
      <div className="bg-white border border-line overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:shadow-[0_30px_80px_-25px_rgba(0,0,0,0.12)] hover:border-gold/40">
        {/* Image Container */}
        <div className="relative aspect-[4/5] w-full overflow-hidden bg-ivory">
          {product.image ? (
            <Image
              src={getImageUrl(product.image)}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="font-display italic text-[5rem] text-noir/5 select-none">
                {product.name?.charAt(0)?.toUpperCase() || "R"}
              </span>
            </div>
          )}

          {/* Dark overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-noir/60 via-noir/0 to-noir/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {/* Secret badge - top left */}
          <div className="absolute top-5 left-5 flex items-center gap-2 px-3 py-2 bg-noir/85 backdrop-blur-md text-white text-[9px] uppercase tracking-[0.25em] font-medium">
            <IconLock className="h-3 w-3 text-gold" stroke={1.5} />
            Secret
          </div>

          {/* Discount badge - top right */}
          {discountPercent && (
            <div className="absolute top-5 right-5 px-3 py-1.5 bg-gold text-white text-[9px] uppercase tracking-[0.2em] font-semibold">
              -{discountPercent}%
            </div>
          )}

          {/* Hover arrow - bottom right */}
          <span className="absolute bottom-5 right-5 w-12 h-12 flex items-center justify-center border border-white/0 text-white opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 group-hover:border-white/30 transition-all duration-700 bg-white/0 group-hover:bg-white/10 backdrop-blur-sm">
            <IconArrowUpRight className="h-5 w-5" stroke={1.5} />
          </span>

          {/* Brand label - bottom left (on hover) */}
          <div className="absolute bottom-5 left-5 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-2 group-hover:translate-y-0">
            <span className="text-[9px] uppercase tracking-[0.3em] text-white/70 font-light">
              MWP SUPPLEMENTS
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-7">
          {/* Category */}
          {product.category && (
            <span className="block text-[9px] uppercase tracking-[0.3em] text-gold font-medium mb-2">
              {product.category.name}
            </span>
          )}

          {/* Product Name */}
          <h3 className="font-display text-[17px] md:text-[19px] text-noir tracking-tight mb-2 leading-tight line-clamp-2 group-hover:text-gold-dark transition-colors duration-500">
            {product.name}
          </h3>

          {/* Description snippet */}
          {product.description && (
            <p className="text-[12px] text-stone font-light leading-relaxed mb-4 line-clamp-2">
              {product.description.replace(/<[^>]*>/g, "").substring(0, 100)}
              {product.description.length > 100 ? "..." : ""}
            </p>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            {hasSale && basePrice && (
              <span className="font-display text-[18px] text-noir">
                {formatCurrency(basePrice)}
              </span>
            )}
            {hasSale && regularPrice && basePrice && regularPrice > basePrice && (
              <span className="text-[13px] text-stone line-through font-light">
                {formatCurrency(regularPrice)}
              </span>
            )}
            {!hasSale && basePrice && (
              <span className="font-display text-[18px] text-noir">
                {formatCurrency(basePrice)}
              </span>
            )}
          </div>

          {/* CTA */}
          <span className="inline-flex items-center gap-2.5 text-[10px] uppercase font-medium tracking-[0.18em] text-noir group-hover:text-gold transition-colors duration-500">
            Discover Fragrance
            <span className="h-px w-0 bg-gold group-hover:w-8 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" />
            <IconArrowRight
              className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1"
              stroke={1.5}
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
