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
import { getProductTone, productTagline, productBlurb } from "@/lib/product-tones";

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

  const tone = getProductTone(product.slug);
  const tagline = productTagline(product);
  const blurb = productBlurb(product);
  const hasReviews = reviewCount > 0 && rating > 0;
  const productHref = `/products/${product.slug}`;

  const Stars = ({ size = 13 }) => (
    <span className="inline-flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn("shrink-0", i <= Math.round(rating) ? "fill-[#D4A437] text-[#D4A437]" : "fill-[#E6E8EE] text-[#E6E8EE]")} style={{ width: size, height: size }} />
      ))}
    </span>
  );

  const PriceBlock = ({ large = false } = {}) =>
    showPrice ? (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={cn("font-semibold tracking-tight text-[#12213F]", large ? "text-[24px]" : "text-[20px]")}>{formatCurrency(displayPrice)}</span>
        {originalPrice && <span className="text-[13px] text-[#6B7388] line-through">{formatCurrency(originalPrice)}</span>}
      </div>
    ) : (
      <button onClick={() => openAuthModal && openAuthModal()} className="text-[13px] font-semibold text-[#12213F] underline underline-offset-4">
        Sign in to see the price
      </button>
    );

  const CartButton = ({ className = "" } = {}) => (
    <button
      onClick={handleAddToCart}
      disabled={!showPrice || isAddingToCart || isOutOfStock}
      className={cn(
        "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold transition-all active:scale-[0.98]",
        addedToCart ? "bg-[#1F8A4C] text-white" : "bg-[#12213F] text-white hover:bg-[#B3001B]",
        "disabled:cursor-not-allowed disabled:bg-[#C9CDD8] disabled:text-white",
        className
      )}
    >
      {isAddingToCart ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</>
      ) : addedToCart ? (
        <><Check className="h-4 w-4" /> Added to bag</>
      ) : isOutOfStock ? (
        "Sold out"
      ) : (
        <><ShoppingBag className="h-4 w-4" /> Add to bag</>
      )}
    </button>
  );

  const RoundIcon = ({ onClick, active, label, children, disabled }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "grid h-10 w-10 place-items-center rounded-full border bg-white/95 shadow-sm backdrop-blur transition-all hover:scale-105 sm:h-9 sm:w-9",
        active ? "border-[#B3001B] text-[#B3001B]" : "border-black/[0.06] text-[#4A5470] hover:text-[#12213F]"
      )}
    >
      {children}
    </button>
  );

  const Badges = () => (
    <div className="pointer-events-none absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
      {discountPercent > 0 && (
        <span className="rounded-full bg-[#B3001B] px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm">Save {discountPercent}%</span>
      )}
      {showFlashSaleBadge && (
        <span className="rounded-full bg-[#12213F] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#E6C26A] shadow-sm">Flash sale</span>
      )}
      {product.featured && !discountPercent && !showFlashSaleBadge && (
        <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A8741F] shadow-sm ring-1 ring-[#EADFC4]">Best seller</span>
      )}
    </div>
  );

  const Actions = () => (
    <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
      <RoundIcon onClick={handleAddToWishlist} active={Boolean(inWishlist)} disabled={isAddingToWishlist[product.id]} label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}>
        {isAddingToWishlist[product.id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={cn("h-[17px] w-[17px]", inWishlist && "fill-current")} />}
      </RoundIcon>
      <RoundIcon onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(product); }} active={isInCompare(product.id)} label={isInCompare(product.id) ? "Remove from compare" : "Add to compare"}>
        <GitCompareArrows className="h-[17px] w-[17px]" />
      </RoundIcon>
    </div>
  );

  const Visual = ({ className = "", sizes }) => (
    <Link
      href={productHref}
      aria-label={`View ${product.name}`}
      className={cn("relative block overflow-hidden", className)}
      style={{ background: `radial-gradient(circle at 50% 46%, #ffffff 0%, ${tone.background} 52%, ${tone.surface} 135%)` }}
    >
      <span aria-hidden="true" className="absolute left-1/2 top-[52%] h-[62%] w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: tone.surface, opacity: 0.55 }} />
      <Image
        src={getAllProductImages[currentImageIndex] || "/placeholder.jpg"}
        alt={product.name}
        fill
        className="object-contain p-5 drop-shadow-[0_22px_26px_rgba(18,33,63,0.22)] transition-transform duration-500 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.04] sm:p-7"
        sizes={sizes}
      />
    </Link>
  );

  /* ── LIST MODE ── */
  if (isList) {
    return (
      <article
        className="group relative flex overflow-hidden rounded-3xl border border-[#E6DFC9] bg-white transition-all duration-300 hover:border-[#D4A437] hover:shadow-[0_26px_50px_-36px_#12213F88]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-[150px] shrink-0 sm:w-[220px]">
          {Visual({ className: "h-full min-h-[200px]", sizes: "220px" })}
          {Badges()}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 p-4 sm:p-6">
          <div>
            {categoryName && <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone.accent }}>{categoryName}</span>}
            <Link href={productHref}><h3 className="mt-1 text-[18px] font-semibold leading-snug text-[#12213F] hover:text-[#A8741F]">{product.name}</h3></Link>
            {tagline && <p className="mt-1 text-[13.5px] text-[#4A5470]">{tagline}</p>}
            {hasReviews && <div className="mt-2 flex items-center gap-1.5"><Stars /><span className="text-[12px] text-[#4A5470]">{rating.toFixed(1)} ({reviewCount})</span></div>}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            {PriceBlock()}
            {CartButton({ className: "min-w-[150px]" })}
          </div>
        </div>
        {Actions()}
      </article>
    );
  }

  /* ── GRID MODE ── */
  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-[#E6DFC9] bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#D4A437] hover:shadow-[0_30px_50px_-34px_#12213F88]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {Visual({ className: "aspect-[4/4.4]", sizes: "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" })}
        {Badges()}
        {Actions()}
        {isOutOfStock && (
          <div className="absolute inset-0 z-10 grid place-items-center bg-white/70 backdrop-blur-[2px]">
            <span className="rounded-full border border-black/[0.08] bg-white px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#12213F]">Sold out</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {categoryName && (
          <span className="mb-1.5 line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: tone.accent }}>{categoryName}</span>
        )}
        <Link href={productHref} className="block">
          <h3 className="text-[17px] font-semibold leading-snug tracking-tight text-[#12213F] transition-colors group-hover:text-[#A8741F] sm:text-[19px]">{product.name}</h3>
        </Link>
        {tagline && <p className="mt-1 line-clamp-1 text-[13px] font-medium text-[#4A5470]">{tagline}</p>}
        {blurb && <p className="mt-2 hidden line-clamp-2 text-[13px] leading-relaxed text-[#5A6275] sm:block">{blurb}</p>}
        {hasReviews && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <Stars />
            <span className="text-[12px] text-[#4A5470]">{rating.toFixed(1)} ({reviewCount})</span>
          </div>
        )}

        <div className="mt-auto pt-4">
          {PriceBlock()}
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            {CartButton({ className: "w-full" })}
            <Link
              href={productHref}
              className="hidden min-h-[46px] items-center justify-center rounded-full border border-[#12213F]/20 px-4 text-[13px] font-semibold text-[#12213F] transition-colors hover:border-[#A8741F] hover:text-[#A8741F] sm:inline-flex"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
