"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { fetchApi } from "@/lib/utils";
import { Reveal } from "@/components/ui/Reveal";
import {
  IconArrowRight,
  IconChevronLeft,
  IconLock,
  IconShoppingBag,
  IconStar,
  IconMoodEmpty,
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

export default function SecretProductPage() {
  const params = useParams();
  const { slug } = params;
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth?redirect=/secret-collection/${slug}`);
      return;
    }

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await fetchApi(`/public/secret-products/${slug}`);
        const productData = response.data?.product;
        setProduct(productData);

        if (productData?.variants?.length > 0) {
          setSelectedVariant(productData.variants[0]);
        }
      } catch (err) {
        console.error("Error fetching product:", err);
        if (err.message?.includes("401") || err.message?.toLowerCase()?.includes("authentication")) {
          router.replace(`/auth?redirect=/secret-collection/${slug}`);
          return;
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug, authLoading, isAuthenticated, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-5 py-20">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] bg-ivory animate-pulse" />
            <div className="space-y-6">
              <div className="h-4 bg-ivory-deep rounded w-1/4 animate-pulse" />
              <div className="h-8 bg-ivory-deep rounded w-3/4 animate-pulse" />
              <div className="h-4 bg-ivory-deep rounded w-1/3 animate-pulse" />
              <div className="h-20 bg-ivory-deep rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center px-5">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center border border-line bg-ivory">
            <IconMoodEmpty className="w-7 h-7 text-gold-dark" stroke={1.2} />
          </div>
          <h2 className="font-display text-3xl text-noir mb-3">Product Not Found</h2>
          <p className="text-stone mb-10 max-w-sm mx-auto text-sm font-light">
            This secret product may have been removed or is no longer available.
          </p>
          <Link href="/secret-collection" className="btn-luxe">
            <IconChevronLeft className="h-4 w-4" stroke={1.5} />
            Back to Collection
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const variants = product.variants || [];
  const currentPrice = selectedVariant?.salePrice || selectedVariant?.price || product.basePrice;
  const originalPrice = selectedVariant?.price;

  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-5 pt-8 pb-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-stone">
          <Link href="/" className="hover:text-gold transition-colors">Home</Link>
          <span className="text-gold">·</span>
          <Link href="/secret-collection" className="hover:text-gold transition-colors">Secret Collection</Link>
          <span className="text-gold">·</span>
          <span className="text-noir">{product.name}</span>
        </div>
      </div>

      {/* Product */}
      <div className="max-w-7xl mx-auto px-5 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">

          {/* Images */}
          <Reveal>
            <div className="space-y-4">
              {/* Main image */}
              <div className="relative aspect-[3/4] overflow-hidden bg-ivory border border-line">
                {images.length > 0 ? (
                  <Image
                    src={getImageUrl(images[selectedImage]?.url || images[0]?.url)}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-display italic text-[6rem] text-noir/5 select-none">
                      {product.name?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                )}
                {/* Secret badge */}
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 bg-noir/80 backdrop-blur-sm text-white text-[9px] uppercase tracking-[0.2em] font-medium">
                  <IconLock className="h-3 w-3" stroke={1.5} />
                  Secret Collection
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`relative w-20 h-20 flex-shrink-0 overflow-hidden border transition-all duration-300 ${
                        selectedImage === index
                          ? "border-gold"
                          : "border-line hover:border-gold/30"
                      }`}
                    >
                      <Image
                        src={getImageUrl(image.url)}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Reveal>

          {/* Details */}
          <Reveal delay={0.1}>
            <div className="lg:sticky lg:top-8">
              {/* Category */}
              {product.category && (
                <span className="luxe-eyebrow block mb-4">
                  {product.category.name}
                </span>
              )}

              <h1 className="font-display text-3xl sm:text-4xl text-noir tracking-tight mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              {product.avgRating && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <IconStar
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(parseFloat(product.avgRating))
                            ? "text-gold fill-gold"
                            : "text-ivory-deep"
                        }`}
                        stroke={1.5}
                      />
                    ))}
                  </div>
                  <span className="text-[12px] text-stone">
                    {product.avgRating} ({product.reviewCount} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                {currentPrice && (
                  <span className="font-display text-2xl text-noir">
                    {formatCurrency(currentPrice)}
                  </span>
                )}
                {originalPrice && currentPrice && parseFloat(originalPrice) > parseFloat(currentPrice) && (
                  <span className="text-base text-stone line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              <span className="block h-px w-full bg-line mb-6" />

              {/* Description */}
              {product.description && (
                <div
                  className="text-stone text-[13px] leading-relaxed font-light mb-8 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              )}

              {/* Variants */}
              {variants.length > 1 && (
                <div className="mb-8">
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-stone font-medium mb-3">
                    Select Variant
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-4 py-2 border text-[12px] font-medium transition-all duration-300 ${
                          selectedVariant?.id === variant.id
                            ? "border-gold bg-gold/5 text-gold"
                            : "border-line text-noir hover:border-gold/30"
                        }`}
                      >
                        {variant.attributes?.map((attr) => attr.value).join(" / ") || variant.sku}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stock */}
              {selectedVariant && (
                <div className="mb-8">
                  {selectedVariant.quantity > 0 ? (
                    <span className="text-[11px] uppercase tracking-[0.15em] text-green-600 font-medium">
                      In Stock
                    </span>
                  ) : (
                    <span className="text-[11px] uppercase tracking-[0.15em] text-red-500 font-medium">
                      Out of Stock
                    </span>
                  )}
                </div>
              )}

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/secret-collection"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 border border-line text-noir text-[11px] uppercase font-medium tracking-[0.15em] hover:border-gold hover:text-gold transition-all duration-500"
                  style={{ borderRadius: "var(--radius)" }}
                >
                  <IconChevronLeft className="h-4 w-4" stroke={1.5} />
                  Back to Collection
                </Link>
              </div>

              {/* Trust signals */}
              <div className="mt-10 pt-8 border-t border-line space-y-4">
                <div className="flex items-center gap-3">
                  <IconLock className="h-4 w-4 text-gold" stroke={1.5} />
                  <span className="text-[12px] text-stone">Exclusive Secret Collection item</span>
                </div>
                <div className="flex items-center gap-3">
                  <IconShoppingBag className="h-4 w-4 text-gold" stroke={1.5} />
                  <span className="text-[12px] text-stone">Premium luxury packaging included</span>
                </div>
              </div>
            </div>
          </Reveal>

        </div>
      </div>

    </div>
  );
}
