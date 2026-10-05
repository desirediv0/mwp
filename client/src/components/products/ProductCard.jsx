"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Loader2, ShoppingBag, Check, Star, Eye, GitCompareArrows } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { fetchApi, formatCurrency, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useCompare } from "@/lib/compare-context";
import { useRouter } from "next/navigation";

const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (image.startsWith("http") || image.startsWith("/")) return image;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

const calculateDiscountPercentage = (regularPrice, salePrice) => {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

const parsePrice = (value) => {
  if (value === null || value === undefined) return null;
  if (value === 0) return 0;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(parsed) ? null : parsed;
};

export const ProductCard = ({ product, viewMode = "grid" }) => {
  const isList = viewMode === "list";
  const { isAuthenticated, openAuthModal } = useAuth();
  const { addToCart } = useCart();
  const { isInCompare, toggleCompare } = useCompare();
  const router = useRouter();

  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [wishlistItems, setWishlistItems] = useState({});
  const [isAddingToWishlist, setIsAddingToWishlist] = useState({});
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [priceSettings, setPriceSettings] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || typeof window === "undefined") return;
    fetchApi("/users/wishlist", { credentials: "include" })
      .then((res) => {
        const map = res.data?.wishlistItems?.reduce((acc, item) => {
          acc[item.productId] = true;
          return acc;
        }, {}) || {};
        setWishlistItems(map);
      })
      .catch(console.error);
  }, [isAuthenticated]);

  useEffect(() => {
    fetchApi("/public/price-visibility-settings")
      .then((res) => { if (res.success) setPriceSettings(res.data); })
      .catch(() => setPriceSettings({ hidePricesForGuests: false }));
  }, []);

  const getAllProductImages = useMemo(() => {
    const images = [];
    const imageUrls = new Set();
    const push = (raw) => {
      const url = raw?.url || raw;
      if (!url) return;
      const full = getImageUrl(url);
      if (!imageUrls.has(full)) { imageUrls.add(full); images.push(full); }
    };
    product.variants?.forEach((v) => v.images?.forEach(push));
    product.images?.forEach(push);
    if (images.length === 0 && product.image) push(product.image);
    if (images.length === 0) images.push("/placeholder.jpg");
    return images;
  }, [product]);

  useEffect(() => {
    if (!isHovered || getAllProductImages.length <= 1) { setCurrentImageIndex(0); return; }
    const t = setInterval(() => setCurrentImageIndex((p) => (p + 1) % getAllProductImages.length), 2000);
    return () => clearInterval(t);
  }, [isHovered, getAllProductImages.length]);

  const basePriceField = parsePrice(product.basePrice);
  const regularPriceField = parsePrice(product.regularPrice);
  const priceField = parsePrice(product.price);
  const salePriceField = parsePrice(product.salePrice);

  const hasFlashSale = product.flashSale?.isActive === true;
  const flashSalePrice = hasFlashSale ? parsePrice(product.flashSale.flashSalePrice) : null;
  const flashSaleDiscountPercent = hasFlashSale ? product.flashSale.discountPercentage : 0;

  let hasSale = product.hasSale !== undefined && product.hasSale !== null ? Boolean(product.hasSale) : false;
  if (!hasSale && salePriceField !== null && salePriceField > 0) {
    if ((regularPriceField && salePriceField < regularPriceField) || (priceField && salePriceField < priceField))
      hasSale = true;
  }

  let originalPrice = null;
  let currentPrice = 0;
  if (basePriceField !== null && regularPriceField !== null) {
    currentPrice = basePriceField;
    originalPrice = hasSale && basePriceField < regularPriceField ? regularPriceField : null;
  } else if (salePriceField !== null && hasSale) {
    currentPrice = salePriceField;
    originalPrice = priceField || basePriceField || regularPriceField || null;
  } else {
    currentPrice = basePriceField || regularPriceField || priceField || salePriceField || 0;
  }
  if (!currentPrice || isNaN(currentPrice)) currentPrice = 0;

  let displayPrice = currentPrice;
  let showFlashSaleBadge = false;
  if (hasFlashSale && flashSalePrice !== null) {
    if (!originalPrice) originalPrice = currentPrice;
    displayPrice = flashSalePrice;
    showFlashSaleBadge = true;
  }

  const discountPercent = showFlashSaleBadge
    ? flashSaleDiscountPercent
    : hasSale && originalPrice && currentPrice
      ? calculateDiscountPercentage(originalPrice, currentPrice)
      : 0;

  const showPrice = !priceSettings?.hidePricesForGuests || isAuthenticated;

  const variantStockList = Array.isArray(product.variants)
    ? product.variants
      .filter((v) => v?.isActive !== false)
      .map((v) => v?.stock ?? v?.quantity)
      .filter((n) => typeof n === "number")
    : [];
  const totalVariantStock = variantStockList.reduce((sum, n) => sum + n, 0);
  const isOutOfStock =
    product.stock === 0 ||
    product.inStock === false ||
    (variantStockList.length > 0 && totalVariantStock <= 0);
  const inWishlist = wishlistItems[product.id];

  const rating = parsePrice(product.averageRating ?? product.rating) || 0;
  const reviewCount = product._count?.reviews ?? product.reviewCount ?? 0;
  const categoryName = product.category?.name || product.categories?.[0]?.category?.name || product.primaryCategory?.name;

  const handleAddToWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!isAuthenticated) { router.push(`/auth?redirect=/products/${product.slug}`); return; }
    setIsAddingToWishlist((p) => ({ ...p, [product.id]: true }));
    try {
      if (inWishlist) {
        const res = await fetchApi("/users/wishlist", { credentials: "include" });
        const item = res.data?.wishlistItems?.find((i) => i.productId === product.id);
        if (item) {
          await fetchApi(`/users/wishlist/${item.id}`, { method: "DELETE", credentials: "include" });
          setWishlistItems((p) => { const n = { ...p }; delete n[product.id]; return n; });
        }
      } else {
        await fetchApi("/users/wishlist", {
          method: "POST", credentials: "include",
          body: JSON.stringify({ productId: product.id }),
        });
        setWishlistItems((p) => ({ ...p, [product.id]: true }));
      }
    } catch { toast.error("Failed to update wishlist"); }
    finally { setIsAddingToWishlist((p) => ({ ...p, [product.id]: false })); }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!showPrice) {
      if (typeof openAuthModal === "function") openAuthModal();
      else toast.error("Please login to purchase items");
      return;
    }
    if (isOutOfStock) {
      toast.error("This product is out of stock");
      return;
    }
    const firstAvailable =
      product.variants?.find(
        (v) => v?.isActive !== false && (v?.stock ?? v?.quantity ?? 1) > 0
      ) || product.variants?.[0];
    const variantId = firstAvailable?.id;
    if (!variantId) {
      toast.error("Select options on product page");
      router.push(`/products/${product.slug}`);
      return;
    }
    setIsAddingToCart(true);
    try {
      await addToCart(variantId, 1);
      setAddedToCart(true);
      toast.success("Added to cart!");
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (err) { console.error(err); }
    finally { setIsAddingToCart(false); }
  };

  const Stars = ({ size = 12 }) => (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "shrink-0",
            i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"
          )}
          style={{ width: size, height: size }}
        />
      ))}
    </span>
  );

  /* ── LIST MODE ── */
  if (isList) {
    return (
      <div
        className="group relative flex flex-row overflow-hidden rounded-lg border border-black/[0.06] bg-white transition-all duration-300 hover:border-black/[0.12] hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.22)]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Link
          href={`/products/${product.slug}`}
          className="relative flex-shrink-0 overflow-hidden bg-[#f6f2eb]"
          style={{
            width: "180px",
            minHeight: "180px",
            backgroundColor: "var(--mwp-cream)",
          }}
        >
          <Image
            src={getAllProductImages[currentImageIndex] || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
            sizes="180px"
          />
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 bg-gray-900 text-white text-[11px] font-extrabold px-2 py-1">
              −{discountPercent}%
            </span>
          )}
        </Link>
        <div className="flex flex-col flex-1 p-5 justify-between min-w-0">
          <div>
            {categoryName && (
              <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold">{categoryName}</span>
            )}
            <Link href={`/products/${product.slug}`}>
              <h3 className="text-[15px] font-semibold text-neutral-900 mt-1 mb-1.5 line-clamp-1 hover:text-black transition-colors">
                {product.name}
              </h3>
            </Link>
            {(rating > 0 || reviewCount > 0) && (
              <div className="flex items-center gap-1.5 mb-2">
                <Stars />
                <span className="text-[11px] text-gray-500">
                  {rating > 0 ? rating.toFixed(1) : "New"}{reviewCount > 0 ? ` (${reviewCount})` : ""}
                </span>
              </div>
            )}
            {showPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-[17px] font-extrabold text-gray-900">{formatCurrency(displayPrice)}</span>
                {originalPrice && <span className="text-[13px] text-gray-400 line-through">{formatCurrency(originalPrice)}</span>}
              </div>
            ) : (
              <button onClick={() => openAuthModal && openAuthModal()} className="text-[12px] text-gray-900 font-semibold hover:underline">
                Login for Price
              </button>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={!showPrice || isAddingToCart || isOutOfStock}
            className="mt-4 self-start inline-flex items-center gap-2 rounded-full py-2.5 px-5 text-[11px] font-semibold transition-all bg-neutral-900 text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingToCart ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : addedToCart ? <><Check className="w-3.5 h-3.5" /> Added</> : isOutOfStock ? "Out of Stock" : <><ShoppingBag className="w-3.5 h-3.5" /> Add to Cart</>}
          </button>
        </div>
      </div>
    );
  }

  /* ── GRID MODE ── */
  return (
    <div
      className="group relative flex flex-col h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-colors hover:border-neutral-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: "4/5",
          backgroundColor: "var(--mwp-cream)",
        }}
      >
        <Link href={`/products/${product.slug}`} className="relative block w-full h-full">
          <Image
            src={getAllProductImages[currentImageIndex] || "/placeholder.jpg"}
            alt={product.name}
            fill
            className="object-contain p-2 sm:p-3 transition-transform duration-300 ease-out group-hover:scale-[1.025]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </Link>

        {/* Badges (top-left) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 pointer-events-none">
          {discountPercent > 0 && (
            <span className="rounded-full bg-neutral-900 text-white text-[10px] font-semibold px-3 py-1.5 shadow-sm">
              −{discountPercent}%
            </span>
          )}
          {showFlashSaleBadge && (
            <span className="rounded-full bg-white text-neutral-900 text-[10px] font-semibold uppercase tracking-wide px-3 py-1.5 shadow-sm">
              Flash Sale
            </span>
          )}
        </div>

        {/* Wishlist + Compare (top-right) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            onClick={handleAddToWishlist}
            disabled={isAddingToWishlist[product.id]}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-sm border border-black/[0.06] transition-all duration-300",
              inWishlist ? "text-gray-900" : "text-gray-400 hover:text-gray-900"
            )}
            aria-label="Add to wishlist"
          >
            {isAddingToWishlist[product.id]
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Heart className={cn("h-4 w-4", inWishlist && "fill-current")} />}
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(product); }}
            className={cn(
              "w-9 h-9 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-sm shadow-sm border border-black/[0.06] transition-all duration-300",
              isInCompare(product.id) ? "text-gray-900 bg-gray-100" : "text-gray-400 hover:text-gray-900"
            )}
            aria-label="Compare product"
            title={isInCompare(product.id) ? "Remove from compare" : "Add to compare"}
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
        </div>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="rounded-full text-[11px] uppercase tracking-[0.12em] font-semibold text-neutral-900 bg-white px-4 py-2 border border-black/[0.08]">
              Sold Out
            </span>
          </div>
        )}

      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {categoryName && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 font-semibold mb-1.5 line-clamp-1">
            {categoryName}
          </span>
        )}

        <Link href={`/products/${product.slug}`} className="block">
          <h3 className="text-[14px] sm:text-[15px] font-semibold text-neutral-900 leading-snug line-clamp-2 min-h-[2.5em] group-hover:text-black transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mt-1.5 mb-2.5">
          <Stars />
          <span className="text-[11px] text-gray-500">
            {rating > 0 ? rating.toFixed(1) : "New"}{reviewCount > 0 ? ` (${reviewCount})` : ""}
          </span>
        </div>

        {/* Price */}
        <div className="mt-auto flex items-end justify-between gap-2">
          {showPrice ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[16px] font-semibold text-neutral-900">
                {formatCurrency(displayPrice)}
              </span>
              {originalPrice && (
                <span className="text-[12px] text-gray-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
            </div>
          ) : (
            <button onClick={() => openAuthModal && openAuthModal()} className="text-[12px] uppercase tracking-[0.1em] text-gray-900 font-bold hover:underline">
              Login for Price
            </button>
          )}

          {/* Quick view (desktop hover) */}
          <Link
            href={`/products/${product.slug}`}
            className="hidden sm:flex items-center justify-center w-8 h-8 border border-gray-200 text-gray-400 hover:border-gray-400 hover:text-gray-900 transition-colors shrink-0"
            aria-label="View product"
          >
            <Eye className="h-4 w-4" />
          </Link>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!showPrice || isAddingToCart || isOutOfStock}
          className="mt-4 w-full min-h-11 flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAddingToCart
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : addedToCart
              ? <><Check className="h-4 w-4" /> Added</>
              : isOutOfStock
                ? "Out of Stock"
                : <><ShoppingBag className="h-4 w-4" /> Add to Cart</>}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
