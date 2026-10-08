"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency } from "@/lib/utils";
import {
  IconMinus,
  IconPlus,
  IconAlertCircle,
  IconHeart,
  IconCircleCheck,
  IconTruck,
  IconShieldCheck,
  IconChevronRight,
  IconChevronLeft,
  IconShare,
  IconStar,
  IconZoomIn,
  IconZoomOut,
  IconX,
  IconBrandWhatsapp,
  IconBrandFacebook,
  IconBrandX,
  IconLink,
  IconCheck,
  IconGitCompare,
} from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import ReviewSection from "./ReviewSection";
import ProductFormulaSections from "./ProductFormulaSections";
import { useAddVariantToCart } from "@/lib/cart-utils";
import { useCart } from "@/lib/cart-context";
import { useCompare } from "@/lib/compare-context";
import { ProductCard } from "@/components/products/ProductCard";
import { toast } from "sonner";
import "./product-detail.css";

const getImageUrl = (img) => {
  if (!img) return "/placeholder.jpg";
  let urlStr = typeof img === "object" ? (img.url || img.image || "") : img;
  if (!urlStr || typeof urlStr !== "string") return "/placeholder.jpg";
  if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) return urlStr;
  const cleanPath = urlStr.startsWith("/") ? urlStr.slice(1) : urlStr;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${cleanPath}`;
};

// Reviews display approved customer feedback; new submissions go through moderation.
const SHOW_REVIEWS = true;

const PRODUCT_THEMES = {
  "ultra-pro": { background: "#f8f4e9", surface: "#f1e2b7", deep: "#c7ae6c", accent: "#806326", line: "#e5d9b8" },
  "power-max": { background: "#f0f3f9", surface: "#cdd8ee", deep: "#8398bf", accent: "#405d91", line: "#d2dced" },
  "rapid-boost": { background: "#fbefeb", surface: "#efc7bc", deep: "#ba7970", accent: "#a4483c", line: "#eed3ca" },
  "her-power": { background: "#f7efeb", surface: "#e5c3b7", deep: "#a77b74", accent: "#a36855", line: "#ead3c9" },
  "her-energy": { background: "#f5f0f9", surface: "#ded0eb", deep: "#a18ab7", accent: "#72568b", line: "#e0d3e9" },
  "daily-vitality": { background: "#f4f4ed", surface: "#dddfc7", deep: "#a0a786", accent: "#657341", line: "#dce0cb" },
  "alpha-prime": { background: "#f8f0e8", surface: "#e8ceb1", deep: "#b68b68", accent: "#8a5e37", line: "#e7d5c2" },
  "titan-force": { background: "#faf1e9", surface: "#edcfb4", deep: "#ba855d", accent: "#975e32", line: "#ebd5c2" },
};

export default function ProductContent({ slug }) {
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [effectivePriceInfo, setEffectivePriceInfo] = useState(null);
  const [openSections, setOpenSections] = useState({
    fragranceNotes: true,
    ingredients: true,
  });
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [availableCombinations, setAvailableCombinations] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [priceSettings, setPriceSettings] = useState(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [bundleSelected, setBundleSelected] = useState({});
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [activeThumb, setActiveThumb] = useState(0);
  const galleryLength = selectedVariant?.images?.length || product?.images?.length || 0;

  // Zoom & Lightbox states
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [lightboxScale, setLightboxScale] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleSocialShare = (platform) => {
    if (typeof window === "undefined") return;
    const currentUrl = window.location.href;
    const prodName = product?.name || "Product";
    const message = `Check out ${prodName} on MWP Supplements`;

    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message + " - " + currentUrl)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, "_blank");
    } else if (platform === "twitter") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(currentUrl)}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  useEffect(() => {
    if (!isZoomModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setIsZoomModalOpen(false);
      if (e.key === "ArrowLeft") setActiveThumb((prev) => (prev > 0 ? prev - 1 : Math.max(0, galleryLength - 1)));
      if (e.key === "ArrowRight") setActiveThumb((prev) => (prev < galleryLength - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomModalOpen, galleryLength]);

  const { isAuthenticated, openAuthModal } = useAuth();
  const router = useRouter();
  const { addVariantToCart } = useAddVariantToCart();
  const { addToCart } = useCart();
  const { isInCompare, toggleCompare } = useCompare();

  const getEffectivePrice = (variant, qty) => {
    if (!variant) return null;
    const salePrice = variant.salePrice ? parseFloat(variant.salePrice) : null;
    const regPrice = variant.price ? parseFloat(variant.price) : 0;
    let price = salePrice && salePrice < regPrice ? salePrice : regPrice;
    let originalPrice = salePrice && salePrice < regPrice ? regPrice : null;
    if (variant.pricingSlabs?.length > 0) {
      const sorted = [...variant.pricingSlabs].sort((a, b) => b.minQty - a.minQty);
      for (const slab of sorted) {
        if (qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)) {
          return { price: parseFloat(slab.price), originalPrice: price, source: "SLAB", slab };
        }
      }
    }
    return { price, originalPrice, source: "DEFAULT", slab: null };
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true); setInitialLoading(true); setError(null); setCartSuccess(false);
    fetchApi(`/public/products/${slug}`)
      .then((res) => {
        const pd = res.data.product;
        setProduct(pd);
        setRelatedProducts(res.data.relatedProducts || []);
        if (pd.images?.length) { setMainImage(pd.images[0]); setActiveThumb(0); }
        if (pd.variants?.length) {
          const combos = pd.variants.filter((v) => v.isActive).map((v) => ({ attributeValueIds: v.attributes?.map((a) => a.attributeValueId) || [], variant: v }));
          setAvailableCombinations(combos);
          const v = combos.find(c => (c.variant.stock ?? c.variant.quantity ?? 0) > 0)?.variant || combos[0]?.variant;
          if (v) {
            // Select an actual API variant, even when admin-defined attribute combinations differ.
            setSelectedAttributes(Object.fromEntries((v.attributes || []).map(a => [a.attributeId, a.attributeValueId])));
            setSelectedVariant(v);
            setQuantity(v.moq || 1);
            setEffectivePriceInfo(getEffectivePrice(v, v.moq || 1));
          } else {
            setSelectedAttributes({}); setSelectedVariant(null); setEffectivePriceInfo(null);
          }
        }
      })
      .catch((err) => { console.error(err); setError(err.message); })
      .finally(() => { setLoading(false); setInitialLoading(false); });
  }, [slug]);

  useEffect(() => {
    fetchApi("/public/price-visibility-settings")
      .then((r) => { if (r.success) setPriceSettings(r.data); })
      .catch(() => setPriceSettings({ hidePricesForGuests: false }));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !product) return;
    fetchApi("/users/wishlist", { credentials: "include" })
      .then((r) => setIsInWishlist(r.data.wishlistItems?.some((i) => i.productId === product.id)))
      .catch(console.error);
  }, [isAuthenticated, product]);

  useEffect(() => {
    const handleScroll = () => {
      const btn = document.getElementById("main-add-to-cart-btn");
      if (btn) setShowStickyBar(btn.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (product) {
      const initial = { [product.id]: true };
      relatedProducts.slice(0, 3).forEach((p) => { initial[p.id] = true; });
      setBundleSelected(initial);
    }
  }, [product, relatedProducts]);

  const handleAttributeChange = (attrId, valueId) => {
    const next = { ...selectedAttributes, [attrId]: valueId };
    setSelectedAttributes(next);
    const selIds = Object.values(next).sort();
    const match = availableCombinations.find((c) => {
      const cIds = c.attributeValueIds.sort();
      return cIds.length === selIds.length && cIds.every((id, i) => id === selIds[i]);
    });
    if (match) {
      setSelectedVariant(match.variant);
      const moq = match.variant.moq || 1;
      const max = match.variant.stock ?? match.variant.quantity ?? moq;
      const nextQuantity = Math.max(moq, Math.min(quantity, max));
      setQuantity(nextQuantity);
      setEffectivePriceInfo(getEffectivePrice(match.variant, nextQuantity));
    } else { setSelectedVariant(null); setEffectivePriceInfo(null); }
  };

  const getAvailableValues = (attrId) => {
    if (!product?.attributeOptions) return [];
    const attr = product.attributeOptions.find((a) => a.id === attrId);
    if (!attr?.values) return [];
    const others = { ...selectedAttributes }; delete others[attrId];
    const available = new Set();
    availableCombinations.forEach((c) => {
      const othIds = Object.values(others);
      if (othIds.length === 0 || othIds.every((id) => c.attributeValueIds.includes(id)))
        c.variant.attributes?.forEach((a) => { if (a.attributeId === attrId) available.add(a.attributeValueId); });
    });
    return attr.values.filter((v) => available.has(v.id));
  };

  const handleQuantityChange = (delta) => {
    const moq = selectedVariant?.moq || 1;
    const stock = selectedVariant?.stock ?? selectedVariant?.quantity ?? 0;
    const next = quantity + delta;
    if (next < moq || next > stock) return;
    setQuantity(next);
    if (selectedVariant) setEffectivePriceInfo(getEffectivePrice(selectedVariant, next));
  };

  const handleAddToCart = async (buyNow = false) => {
    if (isAddingToCart) return;
    const v = selectedVariant || product?.variants?.[0];
    if (!v) return;
    const vStock = v.stock ?? v.quantity ?? null;
    if (vStock !== null && vStock < quantity) {
      setCartSuccess(false);
      return; // out of stock / not enough stock — button is already disabled, guard anyway
    }
    setIsAddingToCart(true); setCartSuccess(false);
    try {
      const result = await addVariantToCart(v, quantity, product.name);
      if (result.success) {
        setCartSuccess(true); setTimeout(() => setCartSuccess(false), 3000);
        if (buyNow === true) router.push(isAuthenticated ? "/checkout" : "/auth?redirect=%2Fcheckout");
      }
    } catch (err) { console.error(err); }
    finally { setIsAddingToCart(false); }
  };

  const handleAddBundleToCart = async () => {
    if (isAddingBundle || isAddingToCart) return;
    setIsAddingBundle(true);
    try {
      const mainV = selectedVariant || product?.variants?.[0];
      if (mainV && bundleSelected[product.id]) await addToCart(mainV.id, quantity);
      for (const p of relatedProducts.slice(0, 3)) {
        if (bundleSelected[p.id]) { const v = p.variants?.[0]; if (v) await addToCart(v.id, 1); }
      }
      setCartSuccess(true); setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) { console.error(err); toast.error(err.message || "Some items could not be added. Please check your cart."); }
    finally { setIsAddingBundle(false); }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { router.push(`/auth?redirect=/products/${slug}`); return; }
    setIsAddingToWishlist(true);
    try {
      if (isInWishlist) {
        const r = await fetchApi("/users/wishlist", { credentials: "include" });
        const item = r.data.wishlistItems.find((i) => i.productId === product.id);
        if (item) { await fetchApi(`/users/wishlist/${item.id}`, { method: "DELETE", credentials: "include" }); setIsInWishlist(false); }
      } else {
        await fetchApi("/users/wishlist", { method: "POST", credentials: "include", body: JSON.stringify({ productId: product.id }) });
        setIsInWishlist(true);
      }
    } catch (err) { console.error(err); }
    finally { setIsAddingToWishlist(false); }
  };

  const getDeliveryDates = () => {
    const today = new Date();
    const f = (d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const s = new Date(today); s.setDate(today.getDate() + 5);
    const e = new Date(today); e.setDate(today.getDate() + 7);
    return `${f(s).toUpperCase()} – ${f(e).toUpperCase()}`;
  };

  const getImages = () => {
    if (selectedVariant?.images?.length) return selectedVariant.images;
    if (product?.images?.length) return product.images;
    const variantImages = product?.variants?.find((v) => v.images?.length)?.images;
    if (variantImages?.length) return variantImages;
    return [];
  };

  const PriceDisplay = () => {
    if (initialLoading) return <div className="h-11 w-40 bg-neutral-100 animate-pulse rounded-md" />;
    const hidePrices = priceSettings?.hidePricesForGuests && !isAuthenticated;
    if (hidePrices || priceSettings === null)
      return (
        <div>
          <p className="text-xl text-neutral-500">Sign in to view price</p>
          <Link href={`/auth?redirect=/products/${slug}`} className="mt-2 inline-block text-[13px] font-medium text-neutral-900 hover:underline underline-offset-4">Sign in →</Link>
        </div>
      );
    if (product?.flashSale?.isActive) {
      const fp = parseFloat(product.flashSale.flashSalePrice);
      const rp = parseFloat(product.basePrice);
      return (
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl md:text-[2.4rem] font-semibold text-neutral-900 tracking-tight">{formatCurrency(fp)}</span>
          <span className="text-base line-through text-neutral-400">{formatCurrency(rp)}</span>
          <span className="mwp-product-discount px-2.5 py-1 text-[11px] font-semibold rounded-full">−{product.flashSale.discountPercentage}%</span>
        </div>
      );
    }
    if (selectedVariant) {
      const info = effectivePriceInfo || getEffectivePrice(selectedVariant, quantity);
      if (!info) return <p className="text-xl text-neutral-500">Price unavailable</p>;
      const mrp = info.originalPrice ? parseFloat(info.originalPrice) : null;
      const sp = parseFloat(info.price);
      const hasDiff = mrp && mrp > sp;
      const disc = hasDiff ? Math.round(((mrp - sp) / mrp) * 100) : 0;
      return (
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl md:text-[2.4rem] font-semibold text-neutral-900 tracking-tight">{formatCurrency(sp)}</span>
          {hasDiff && <><span className="text-base line-through text-neutral-400">{formatCurrency(mrp)}</span><span className="mwp-product-discount px-2.5 py-1 text-[11px] font-semibold rounded-full">{disc}% off</span></>}
        </div>
      );
    }
    const bp = parseFloat(product?.basePrice) || 0;
    const rp = parseFloat(product?.regularPrice) || 0;
    const cp = (product?.hasSale && rp > bp) ? bp : (bp || rp);
    const op = (product?.hasSale && rp > bp) ? rp : null;
    const disc = op ? Math.round(((op - cp) / op) * 100) : 0;
    return (
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-3xl md:text-[2.4rem] font-semibold text-neutral-900 tracking-tight">{formatCurrency(cp)}</span>
        {op && <><span className="text-base line-through text-neutral-400">{formatCurrency(op)}</span><span className="mwp-product-discount px-2.5 py-1 text-[11px] font-semibold rounded-full">{disc}% off</span></>}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
      <span className="text-lg font-medium text-neutral-300 tracking-tight">MWP Supplements</span>
      <span className="block h-px w-32 overflow-hidden relative bg-neutral-100">
        <span className="absolute inset-y-0 left-0 w-1/3 bg-neutral-900 animate-marquee-x" />
      </span>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-white">
      <div className="w-16 h-16 flex items-center justify-center mb-7 rounded-full bg-neutral-100">
        <IconAlertCircle className="h-7 w-7 text-neutral-400" stroke={1.5} />
      </div>
      <h2 className="text-2xl font-semibold mb-2.5 text-neutral-900 tracking-tight">Product Not Found</h2>
      <p className="mb-8 text-[15px] text-neutral-500">{error || "This product is no longer available."}</p>
      <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 text-[13px] font-medium rounded-full bg-neutral-900 text-white hover:bg-neutral-800 transition-colors">
        Back to Shop
      </Link>
    </div>
  );

  const images = getImages();
  const productTheme = PRODUCT_THEMES[slug] || PRODUCT_THEMES["ultra-pro"];
  const benefitItems = (product.ingredientItems || []).filter(item => item.keyBenefit || item.description).slice(0, 4);
  const primary = mainImage && images.some((i) => i.url === mainImage.url) ? mainImage : (images.find((i) => i.isPrimary) || images[0]);
  // Read the real stock from the selected variant. `?? ` (not `||`) so a genuine 0 is respected
  // instead of falling through to a hardcoded 15, which used to keep "Add to Bag" enabled for
  // out-of-stock variants and made the server reject the add with an empty cart as the result.
  const rawStock =
    selectedVariant?.stock ??
    selectedVariant?.quantity ??
    product?.stock ??
    null;
  const stock = rawStock === null ? (selectedVariant ? 0 : 15) : rawStock;
  const outOfStock = !selectedVariant || stock <= 0;

  const bundleItems = [
    { id: product.id, name: product.name, price: parseFloat(effectivePriceInfo?.price || selectedVariant?.salePrice || selectedVariant?.price || product.basePrice || 0), isMain: true, stock, image: primary?.url },
    ...relatedProducts.slice(0, 3).map((p) => { const v = p.variants?.[0] || {}; return { id: p.id, name: p.name, price: parseFloat(v.salePrice || v.price || p.basePrice || 0), isMain: false, stock: p.stock || 10, image: p.image || p.images?.[0]?.url }; })
  ];
  const bundleTotal = bundleItems.reduce((sum, item) => sum + (bundleSelected[item.id] ? (item.price * (item.isMain ? quantity : 1)) : 0), 0);

  return (
    <div className="mwp-product-detail min-h-screen" style={{
      "--product-bg": productTheme.background,
      "--product-surface": productTheme.surface,
      "--product-deep": productTheme.deep,
      "--product-accent": productTheme.accent,
      "--product-line": productTheme.line,
    }}>

      {/* Breadcrumb */}
      <div className="mwp-product-breadcrumb max-w-6xl mx-auto px-6 lg:px-10 pt-6 pb-1">
        <nav className="flex items-center gap-2 text-[12px] text-neutral-500 flex-wrap" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-neutral-900 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-neutral-900 transition-colors">Shop</Link>
          {product.category && <><span>/</span><Link href={`/category/${product.category.slug}`} className="hover:text-neutral-900 transition-colors">{product.category.name}</Link></>}
          <span>/</span>
          <span className="text-neutral-700 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Product Hero */}
      <div className="mwp-product-hero max-w-6xl mx-auto px-6 lg:px-10 py-6 md:py-10">
        <div className="mwp-product-hero-grid grid grid-cols-1 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] gap-10 lg:gap-16 items-start">

          {/* Left: Gallery */}
          <div className="mwp-product-gallery flex flex-col-reverse gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setMainImage(img); setActiveThumb(idx); }}
                    className="relative flex-shrink-0 w-[64px] h-[80px] overflow-hidden rounded-xl transition-all duration-300"
                    style={{
                      border: activeThumb === idx ? `1.5px solid ${productTheme.accent}` : "1px solid #ECECEC",
                      opacity: activeThumb === idx ? 1 : 0.55,
                      backgroundColor: productTheme.surface,
                    }}
                  >
                    <Image src={getImageUrl(img.url)} alt="" fill className="object-contain p-2" sizes="64px" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div
              className="mwp-product-image relative overflow-hidden group cursor-zoom-in select-none rounded-2xl"
              style={{ background: `linear-gradient(145deg, ${productTheme.surface}, ${productTheme.deep})` }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={handleMouseMove}
              onClick={() => {
                setLightboxScale(1);
                setIsZoomModalOpen(true);
              }}
            >
              {images.length > 0 ? (
                <Image
                  src={getImageUrl(primary?.url)}
                  alt={product.name}
                  fill
                  className="object-contain p-5 sm:p-7 lg:p-8 transition-transform duration-200 ease-out pointer-events-none"
                  style={{
                    transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : "center center",
                    transform: isHovered ? "scale(1.06)" : "scale(1)",
                  }}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <Image src="/placeholder.jpg" alt={product.name} fill className="object-contain p-8" />
              )}

              {/* Hover Zoom Hint */}
              <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-white/95 backdrop-blur-md text-neutral-700 text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <IconZoomIn className="h-3.5 w-3.5" />
                <span>Click to expand</span>
              </div>

              {/* Badges */}
              <div className="absolute top-5 left-5 z-20 flex flex-col gap-2 pointer-events-none">
                {product.flashSale?.isActive && (
                  <span className="px-3.5 py-1.5 text-[11px] font-semibold rounded-full bg-neutral-900 text-white">
                    −{product.flashSale.discountPercentage}% Flash Sale
                  </span>
                )}
                {outOfStock && (
                  <span className="px-3.5 py-1.5 text-[11px] font-semibold rounded-full bg-neutral-500 text-white">Sold Out</span>
                )}
              </div>

              {/* Wishlist quick toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
                disabled={isAddingToWishlist}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 w-10 h-10 rounded-full bg-white/95 shadow-sm backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95"
                aria-label="Wishlist"
              >
                <IconHeart className={`h-4.5 w-4.5 transition-colors ${isInWishlist ? "text-neutral-900" : "text-neutral-400 hover:text-neutral-700"}`} stroke={1.8} fill={isInWishlist ? "currentColor" : "none"} />
              </button>

              {/* Image count */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1.5 backdrop-blur-md text-[11px] z-20 pointer-events-none bg-white/90 text-neutral-600 rounded-full">
                  {activeThumb + 1} / {images.length}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="mwp-product-info flex flex-col lg:self-start">

            {/* Brand */}
            {product.brand && (
              <span className="text-[12px] font-medium text-neutral-400 mb-3">{product.brand.name}</span>
            )}

            {/* Category eyebrow + Title */}
            {product.category?.name && (
              <span className="mwp-product-kicker mb-2">
                {product.category.name}
              </span>
            )}
            <div className="mwp-product-title-row flex items-start gap-3 mb-5 flex-wrap">
              <h1 className="mwp-product-title text-neutral-900">{product.name}</h1>
              {product.gender && (
                <Link
                  href={`/products?gender=${product.gender}`}
                  className="mt-1.5 inline-flex items-center px-3 py-1 text-[11px] font-medium rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  {product.gender}
                </Link>
              )}
            </div>

            {(product.shortDescription || product.mainBenefits || product.metaDescription) && (
              <p className="mwp-product-intro">{product.shortDescription || product.mainBenefits || product.metaDescription}</p>
            )}

            {/* Rating — hidden for now, see SHOW_REVIEWS */}
            {SHOW_REVIEWS && (
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <IconStar key={i} className="h-3.5 w-3.5 text-neutral-900" fill={i <= Math.round(product.avgRating || 0) ? "currentColor" : "none"} stroke={1.5} />)}</div>
                <span className="text-[12px] text-neutral-500">({product.reviewCount || 0} reviews)</span>
              </div>
            )}

            {/* Product Notes */}
            {product.notes && product.notes.length > 0 && (
              <div className="mb-7">
                <p className="text-[12px] font-medium text-neutral-400 mb-3.5">Notes</p>
                <div className="flex flex-wrap gap-4">
                  {product.notes.map((note) => (
                    <div key={note.id} className="flex flex-col items-center gap-2">
                      <div className="relative w-14 h-14 overflow-hidden rounded-2xl">
                        <Image
                          src={getImageUrl(note.image)}
                          alt={note.title || "Note"}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <span className="text-[11px] text-neutral-500">{note.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mwp-product-price mb-5"><PriceDisplay /></div>


            <div className="mwp-product-purchase">
              <p className="mwp-product-purchase-label">Choose your purchase option</p>
            {/* Attributes */}
            {product.attributeOptions?.map((attr) => {
              const values = getAvailableValues(attr.id);
              const selId = selectedAttributes[attr.id];
              const selVal = values.find((v) => v.id === selId);
              return (
                <div key={attr.id} className="mb-6">
                <p className="text-[13px] font-medium mb-3 text-neutral-800">
                    {attr.name} {selVal && <span className="font-normal text-neutral-400">— {selVal.value}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {values.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleAttributeChange(attr.id, v.id)}
                        type="button"
                        aria-pressed={selId === v.id}
                        className={`min-w-[48px] min-h-11 px-4 py-2 text-[13px] font-medium rounded-full border bg-white text-neutral-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-900 ${selId === v.id
                          ? "border-neutral-900 bg-white"
                          : "border-neutral-300 hover:border-neutral-900 hover:bg-white"
                          }`}
                      >
                        {v.value}
                        {selId === v.id && <IconCheck className="inline-block h-3.5 w-3.5 ml-2" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Success */}
            {cartSuccess && (
              <div className="flex items-center gap-2.5 px-4 py-3 text-[13px] font-medium mb-5 rounded-xl bg-neutral-50 text-neutral-700">
                <IconCircleCheck className="h-4.5 w-4.5 flex-shrink-0" stroke={1.6} /> Added to your bag
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="mwp-product-purchase-actions">
            <div className="flex gap-2.5 mb-3" id="main-add-to-cart-btn">
              <div className="flex items-center overflow-hidden h-12 bg-white rounded-full border border-[#d9d0c2]">
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= (selectedVariant?.moq || 1) || isAddingToCart} className="w-10 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition-colors" aria-label="Decrease quantity">
                  <IconMinus className="h-3.5 w-3.5" stroke={2} />
                </button>
                <span className="w-9 text-center text-[15px] font-medium text-neutral-900">{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= stock || isAddingToCart} className="w-10 h-full flex items-center justify-center text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition-colors" aria-label="Increase quantity">
                  <IconPlus className="h-3.5 w-3.5" stroke={2} />
                </button>
              </div>
              <button onClick={() => handleAddToCart()} disabled={isAddingToCart || outOfStock}
                className="flex-1 h-12 rounded-full text-[13px] font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-40 text-white bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99]">
                {isAddingToCart ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : outOfStock ? "Sold Out" : "Add to Cart"}
              </button>
            </div>

            <button type="button" onClick={() => handleAddToCart(true)} disabled={isAddingToCart || outOfStock || quantity > stock}
              className="w-full h-12 mb-3 rounded-full border border-neutral-900 bg-white text-neutral-900 text-[13px] font-medium hover:bg-white disabled:opacity-40 transition-colors">
              {isAddingToCart ? "Adding…" : "Buy Now"}
            </button>
            </div>

            </div>

            {benefitItems.length > 0 && (
              <div className="mwp-product-benefits">
                {benefitItems.map(item => (
                  <div key={item.id || item.name} className="mwp-product-benefit">
                    <p>{item.name}</p>
                    <span>{(item.keyBenefit || item.description).replace(/<[^>]*>/g, "")}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mwp-product-trust">
              <span><IconShieldCheck size={14} /> Authentic formula</span>
              <span><IconCheck size={14} /> Ingredient transparency</span>
              <span><IconShieldCheck size={14} /> Secure checkout</span>
            </div>

            {/* Wishlist + Compare row */}
            <div className="flex gap-2.5 mb-7">
              <button
                onClick={handleWishlist}
                disabled={isAddingToWishlist}
                className={`mwp-product-utility flex-1 h-11 rounded-full border text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors ${isInWishlist
                  ? "border-neutral-300 bg-neutral-50 text-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900"
                  }`}
              >
                <IconHeart className="h-3.5 w-3.5" stroke={2} fill={isInWishlist ? "currentColor" : "none"} />
                {isInWishlist ? "Wishlisted" : "Wishlist"}
              </button>
              <button
                onClick={() => toggleCompare(product)}
                className={`mwp-product-utility flex-1 h-11 rounded-full border text-[12.5px] font-medium flex items-center justify-center gap-2 transition-colors ${isInCompare(product?.id)
                  ? "border-neutral-300 bg-neutral-50 text-neutral-900"
                  : "border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-900"
                  }`}
              >
                <IconGitCompare className="h-3.5 w-3.5" stroke={2} />
                {isInCompare(product?.id) ? "In Compare" : "Compare"}
              </button>
            </div>

            <details className="mwp-product-details">
            <summary className="cursor-pointer text-[13px] text-neutral-600">Delivery &amp; product details</summary>
            {/* Delivery */}
            <div className="mb-6">
              <div className="flex items-center gap-3 py-2.5">
                <IconTruck className="h-4.5 w-4.5 flex-shrink-0 text-neutral-400" stroke={1.6} />
                <div>
                  <p className="text-[13px] font-medium text-neutral-800">Delivery</p>
                  <p className="text-[12px] mt-0.5 text-neutral-400">5–7 business days</p>
                </div>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="flex items-center gap-2 text-[13px] mb-6 text-neutral-500">
              <span className="font-medium text-neutral-800">Est. delivery</span>
              <span>{getDeliveryDates()}</span>
            </div>

            {/* Meta */}
            <div className="pt-6 space-y-2.5 border-t border-neutral-100">
              {product.category && (
                <div className="flex text-[13px] items-baseline">
                  <span className="w-24 text-neutral-400">Category</span>
                  <Link
                    href={`/category/${product.category.slug}`}
                    className="text-neutral-800 hover:text-neutral-900 transition-colors font-medium hover:underline underline-offset-4"
                  >
                    {product.category.name}
                  </Link>
                </div>
              )}
              {product.brand && (
                <div className="flex text-[13px] items-baseline">
                  <span className="w-24 text-neutral-400">Brand</span>
                  <Link
                    href={`/brand/${product.brand.slug}`}
                    className="text-neutral-800 hover:text-neutral-900 transition-colors font-medium hover:underline underline-offset-4"
                  >
                    {product.brand.name}
                  </Link>
                </div>
              )}
            </div>

            {/* Share */}
            <div className="flex items-center gap-4 mt-6 pt-6 border-t border-neutral-100">
              <span className="flex items-center gap-2 text-[12px] font-medium text-neutral-400">
                <IconShare className="h-3.5 w-3.5" stroke={1.5} /> Share
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSocialShare("whatsapp")}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-neutral-400 transition-all duration-300"
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <IconBrandWhatsapp className="w-3.5 h-3.5" stroke={1.8} />
                </button>
                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-neutral-400 transition-all duration-300"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <IconBrandFacebook className="w-3.5 h-3.5" stroke={1.8} />
                </button>
                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-neutral-400 transition-all duration-300"
                  title="Share on X"
                  aria-label="Share on X"
                >
                  <IconBrandX className="w-3.5 h-3.5" stroke={1.8} />
                </button>
                <button
                  onClick={() => handleSocialShare("copy")}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-neutral-200 hover:border-neutral-900 hover:bg-neutral-900 hover:text-white text-neutral-400 transition-all duration-300 relative"
                  title="Copy Link"
                  aria-label="Copy Link"
                >
                  {copied ? <IconCheck className="w-3.5 h-3.5 text-[#886b40]" stroke={2} /> : <IconLink className="w-3.5 h-3.5" stroke={1.8} />}
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded-full shadow whitespace-nowrap">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
            </details>
          </div>
        </div>
      </div>

      <ProductFormulaSections product={product} />

      {/* Bundle */}
      {relatedProducts.length > 0 && (
        <div className="mwp-product-section max-w-6xl mx-auto px-6 lg:px-10 mb-16 md:mb-20">
          <div className="p-6 sm:p-8 md:p-10 rounded-3xl bg-white">
            <div className="mb-8">
              <span className="text-[12px] font-medium text-neutral-400 block mb-2">Build your routine</span>
              <h3 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">Frequently bought together</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-2">
                {bundleItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-3 bg-white transition-colors rounded-2xl">
                    <input type="checkbox" checked={!!bundleSelected[item.id]} disabled={item.isMain} onChange={(e) => setBundleSelected({ ...bundleSelected, [item.id]: e.target.checked })} className="w-4 h-4 cursor-pointer disabled:opacity-50 accent-neutral-900" />
                    <div className="relative w-14 h-16 overflow-hidden flex-shrink-0 rounded-xl" style={{ backgroundColor: productTheme.surface }}>
                      <Image src={getImageUrl(item.image)} alt="" fill className="object-contain p-1" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] truncate font-medium text-neutral-900">{item.isMain && <span className="text-[11px] text-neutral-400 mr-2">This formula</span>}{item.name}</p>
                    </div>
                    <span className="text-[13.5px] font-semibold text-neutral-900">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-4 p-7 sm:p-8 text-center rounded-2xl bg-white">
                <span className="text-[12px] font-medium text-neutral-400 block mb-2">Bundle total</span>
                <span className="text-3xl sm:text-4xl font-semibold block mb-5 text-neutral-900 tracking-tight">{formatCurrency(bundleTotal)}</span>
                <button onClick={handleAddBundleToCart} disabled={isAddingBundle || !Object.values(bundleSelected).some(Boolean)} className="w-full h-12 text-[13px] font-medium transition-all duration-300 disabled:opacity-40 rounded-full text-white bg-neutral-900 hover:bg-neutral-800">
                  {isAddingBundle ? "Adding…" : "Add Bundle to Bag"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordion Sections */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-16 md:mb-20">
        {/* Description - always visible */}
        {product.description && (
          <div className="mb-10 max-w-3xl">
            <p className="text-[12px] font-medium text-neutral-400 mb-4">About this formula</p>
            <div className="text-[15px] leading-relaxed text-neutral-600" dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        )}

        {/* Collapsible sections */}
        <div className="max-w-3xl space-y-0 border-t border-neutral-100">
          {[
            { key: "fragranceNotes", label: "Formula & Key Actives" },
            { key: "feelings", label: "Benefits & Results" },
            { key: "occasions", label: "How & When To Use" },
            { key: "behindThePerfume", label: "Clinical Science & Formulation" },
            { key: "shippingReturn", label: "Shipping & Return" },
            { key: "legalInfo", label: "Quality & Regulatory Info" },
          ].map(({ key, label }) => {
            const content = product[key];
            const hasNotesList = key === "fragranceNotes" && product.notes && product.notes.length > 0;
            if (!content && !hasNotesList) return null;
            const isOpen = !!openSections[key];
            return (
              <div key={key} className="border-b border-neutral-100">
                <button
                  onClick={() => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="flex items-center justify-between w-full py-5 text-left transition-colors"
                >
                  <span className="text-[14px] font-medium text-neutral-900">{label}</span>
                  <IconChevronRight
                    className="h-4 w-4 transition-transform duration-300 text-neutral-400"
                    style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
                    stroke={1.5}
                  />
                </button>
                <div
                  className="overflow-hidden transition-all duration-500"
                  style={{ maxHeight: isOpen ? "1200px" : "0", opacity: isOpen ? 1 : 0, marginBottom: isOpen ? "24px" : "0" }}
                >
                  {key === "fragranceNotes" && product.notes && product.notes.length > 0 && (
                    <div className="mb-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 py-2">
                        {product.notes.map((note) => (
                          <div key={note.id || note.title} className="flex flex-col items-center p-3 rounded-2xl bg-neutral-50 hover:bg-neutral-100 transition-all text-center group">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden mb-2 rounded-2xl">
                              <Image
                                src={getImageUrl(note.image)}
                                alt={note.title || "Key Active"}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="80px"
                              />
                            </div>
                            <span className="text-[11px] font-medium text-neutral-700">{note.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {content && (
                    <div className="text-[15px] leading-relaxed text-neutral-600" dangerouslySetInnerHTML={{ __html: content }} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Ingredients in this product */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div className="border-b border-neutral-100">
              <button
                onClick={() => setOpenSections((prev) => ({ ...prev, ingredients: !prev.ingredients }))}
                className="flex items-center justify-between w-full py-5 text-left transition-colors"
              >
                <span className="text-[14px] font-medium text-neutral-900">
                  Ingredients ({product.ingredients.length})
                </span>
                <IconChevronRight
                  className="h-4 w-4 transition-transform duration-300 text-neutral-400"
                  style={{ transform: openSections.ingredients ? "rotate(90deg)" : "rotate(0deg)" }}
                  stroke={1.5}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: openSections.ingredients ? "4000px" : "0", opacity: openSections.ingredients ? 1 : 0, marginBottom: openSections.ingredients ? "24px" : "0" }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {product.ingredients.map((ing) => (
                    <div key={ing.id} className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-50">
                      {ing.image ? (
                        <div className="relative w-11 h-11 rounded-full overflow-hidden bg-white shrink-0">
                          <Image src={ing.image} alt={ing.name} fill className="object-cover" sizes="44px" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-white shrink-0 flex items-center justify-center text-[8px] text-neutral-300 text-center px-1">
                          Soon
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-medium text-neutral-900 leading-snug">{ing.name}</p>
                        <p className="text-[12.5px] text-neutral-500 leading-relaxed mt-0.5">{ing.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/ingredients"
                  className="mt-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-neutral-900 hover:underline underline-offset-4"
                >
                  See all MWP ingredients
                  <IconChevronRight className="h-3.5 w-3.5" stroke={2} />
                </Link>
              </div>
            </div>
          )}

          {/* Product Videos Section */}
          {product.videos && product.videos.length > 0 && (
            <div className="border-b border-neutral-100">
              <button
                onClick={() => setOpenSections((prev) => ({ ...prev, videos: !prev.videos }))}
                className="flex items-center justify-between w-full py-5 text-left transition-colors"
              >
                <span className="text-[14px] font-medium text-neutral-900">Videos</span>
                <IconChevronRight
                  className="h-4 w-4 transition-transform duration-300 text-neutral-400"
                  style={{ transform: openSections.videos ? "rotate(90deg)" : "rotate(0deg)" }}
                  stroke={1.5}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: openSections.videos ? "2000px" : "0", opacity: openSections.videos ? 1 : 0, marginBottom: openSections.videos ? "24px" : "0" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.videos.map((video, i) => (
                    <div key={video.id || i} className="rounded-2xl overflow-hidden bg-neutral-50">
                      <div className="aspect-video w-full bg-black">
                        <video
                          src={video.videoUrl}
                          controls
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {video.title && (
                        <div className="px-4 py-3">
                          <p className="text-[13.5px] font-medium text-neutral-800">{video.title}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reviews — hidden for now, see SHOW_REVIEWS */}
        {SHOW_REVIEWS && (
          <div className="mt-16 max-w-3xl">
            <ReviewSection product={product} />
          </div>
        )}
      </div>

      {/* Lifestyle Section */}
      {(product.lifestyleImage || product.lifestyleDescription) && (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 mb-16 md:mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {product.lifestyleImage && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <Image
                  src={getImageUrl(product.lifestyleImage)}
                  alt={`${product.name} lifestyle`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}
            {product.lifestyleDescription && (
              <div className={product.lifestyleImage ? "" : "md:col-span-2 max-w-2xl mx-auto text-center"}>
                <div
                  className="text-[15px] leading-relaxed text-neutral-600"
                  dangerouslySetInnerHTML={{ __html: product.lifestyleDescription }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="max-w-6xl mx-auto px-6 lg:px-10 pb-20">
          <div className="flex items-end justify-between mb-9">
            <div>
              <span className="text-[12px] font-medium text-neutral-400 block mb-2.5">Keep exploring</span>
              <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 tracking-tight">You may also like</h2>
            </div>
            <Link href="/products" className="text-[13px] font-medium text-neutral-900 shrink-0 hover:underline underline-offset-4">View all →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Sticky Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-neutral-100 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] py-3">
          <div className="max-w-6xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-neutral-50 flex-shrink-0">
                <Image src={getImageUrl(primary?.url)} alt="" fill className="object-cover" sizes="44px" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13.5px] font-medium text-neutral-900 truncate">{product.name}</h4>
                <p className="text-[14px] font-semibold text-neutral-900 mt-0.5">
                  {formatCurrency(selectedVariant ? (effectivePriceInfo?.price || selectedVariant.price) : (product.basePrice || product.regularPrice))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleCompare(product)}
                className={`h-11 w-11 rounded-full border flex items-center justify-center transition-colors ${isInCompare(product?.id) ? "border-neutral-300 bg-neutral-50 text-neutral-900" : "border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-900"
                  }`}
                aria-label="Compare"
                title={isInCompare(product?.id) ? "In compare" : "Add to compare"}
              >
                <IconGitCompare className="h-4.5 w-4.5" stroke={2} />
              </button>
              <button
                onClick={handleWishlist}
                className={`h-11 w-11 rounded-full border flex items-center justify-center transition-colors ${isInWishlist ? "border-neutral-300 bg-neutral-50 text-neutral-900" : "border-neutral-200 text-neutral-400 hover:border-neutral-400 hover:text-neutral-900"
                  }`}
                aria-label="Wishlist"
              >
                <IconHeart className="h-4.5 w-4.5" stroke={2} fill={isInWishlist ? "currentColor" : "none"} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || outOfStock}
                className="px-6 sm:px-8 h-11 rounded-full text-[12.5px] font-medium flex items-center justify-center gap-2 text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 transition-all"
              >
                {isAddingToCart ? "Adding…" : outOfStock ? "Sold Out" : "Add to Cart"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Fullscreen Interactive Lightbox Modal (Click / Mobile Touch Zoom) ── */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-fadeIn select-none">
          {/* Header Controls */}
          <div className="flex items-center justify-between z-10 text-white border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-white/80">{product.name}</span>
              {images.length > 1 && (
                <span className="text-xs text-white/40">
                  ({activeThumb + 1} of {images.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full">
                <button
                  onClick={() => setLightboxScale((prev) => Math.max(1, prev - 0.5))}
                  disabled={lightboxScale <= 1}
                  className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
                  title="Zoom Out"
                >
                  <IconZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLightboxScale(1)}
                  className="px-2 py-1 text-xs font-mono font-medium text-white/70 hover:bg-white/10 rounded-full transition-colors"
                  title="Reset Zoom"
                >
                  {Math.round(lightboxScale * 100)}%
                </button>
                <button
                  onClick={() => setLightboxScale((prev) => Math.min(4, prev + 0.5))}
                  disabled={lightboxScale >= 4}
                  className="p-2 rounded-full hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
                  title="Zoom In"
                >
                  <IconZoomIn className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors ml-2"
                title="Close (Esc)"
              >
                <IconX className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Lightbox Display */}
          <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden my-4">
            {images.length > 1 && (
              <button
                onClick={() => setActiveThumb((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-white hover:text-neutral-900 text-white backdrop-blur-md transition-all"
                aria-label="Previous Image"
              >
                <IconChevronLeft className="w-6 h-6" />
              </button>
            )}

            <div
              className="relative w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center cursor-pointer overflow-auto p-4"
              onClick={() => setLightboxScale((prev) => (prev > 1 ? 1 : 2.5))}
            >
              <Image
                src={getImageUrl(images[activeThumb]?.url || primary?.url)}
                alt={product.name}
                width={1200}
                height={1600}
                className="object-contain max-h-full max-w-full transition-transform duration-300 ease-out select-none"
                style={{
                  transform: `scale(${lightboxScale})`,
                }}
                priority
              />
            </div>

            {images.length > 1 && (
              <button
                onClick={() => setActiveThumb((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-white hover:text-neutral-900 text-white backdrop-blur-md transition-all"
                aria-label="Next Image"
              >
                <IconChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Footer Thumbnails list in Lightbox */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-3 overflow-x-auto py-2 border-t border-white/10 no-scrollbar z-10">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveThumb(idx);
                    setLightboxScale(1);
                  }}
                  className={`relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden transition-all border-2 ${activeThumb === idx ? "border-white opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                >
                  <Image src={getImageUrl(img.url)} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
