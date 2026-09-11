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
  IconBolt,
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
import { useAddVariantToCart } from "@/lib/cart-utils";
import { useCart } from "@/lib/cart-context";
import { useCompare } from "@/lib/compare-context";
import { ProductCard } from "@/components/products/ProductCard";

const getImageUrl = (img) => {
  if (!img) return "/placeholder.jpg";
  let urlStr = typeof img === "object" ? (img.url || img.image || "") : img;
  if (!urlStr || typeof urlStr !== "string") return "/placeholder.jpg";
  if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) return urlStr;
  const cleanPath = urlStr.startsWith("/") ? urlStr.slice(1) : urlStr;
  return `https://desirediv-storage.blr1.digitaloceanspaces.com/${cleanPath}`;
};

// Toggle to bring reviews back in the future — set to true to show ratings + review section.
const SHOW_REVIEWS = false;

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
      if (e.key === "ArrowLeft") setActiveThumb((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      if (e.key === "ArrowRight") setActiveThumb((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isZoomModalOpen]);

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
    setLoading(true); setInitialLoading(true);
    fetchApi(`/public/products/${slug}`)
      .then((res) => {
        const pd = res.data.product;
        setProduct(pd);
        setRelatedProducts(res.data.relatedProducts || []);
        if (pd.images?.length) { setMainImage(pd.images[0]); setActiveThumb(0); }
        if (pd.variants?.length) {
          const combos = pd.variants.filter((v) => v.isActive).map((v) => ({ attributeValueIds: v.attributes?.map((a) => a.attributeValueId) || [], variant: v }));
          setAvailableCombinations(combos);
          if (pd.attributeOptions?.length) {
            const defaults = {};
            pd.attributeOptions.forEach((a) => { if (a.values?.length) defaults[a.id] = a.values[0].id; });
            setSelectedAttributes(defaults);
            const match = combos.find((c) => c.attributeValueIds.sort().join(",") === Object.values(defaults).sort().join(","));
            const v = match?.variant || pd.variants[0];
            setSelectedVariant(v);
            setQuantity(v.moq || 1);
            setEffectivePriceInfo(getEffectivePrice(v, v.moq || 1));
          } else {
            const v = pd.variants[0];
            setSelectedVariant(v);
            setQuantity(v.moq || 1);
            setEffectivePriceInfo(getEffectivePrice(v, v.moq || 1));
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
      if (quantity < moq) setQuantity(moq);
      setEffectivePriceInfo(getEffectivePrice(match.variant, quantity < moq ? moq : quantity));
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
    const stock = selectedVariant?.stock || selectedVariant?.quantity || 0;
    const next = quantity + delta;
    if (next < moq || (stock > 0 && next > stock)) return;
    setQuantity(next);
    if (selectedVariant) setEffectivePriceInfo(getEffectivePrice(selectedVariant, next));
  };

  const handleAddToCart = async () => {
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
      if (result.success) { setCartSuccess(true); setTimeout(() => setCartSuccess(false), 3000); }
    } catch (err) { console.error(err); }
    finally { setIsAddingToCart(false); }
  };

  const handleAddBundleToCart = async () => {
    setIsAddingBundle(true);
    try {
      const mainV = selectedVariant || product?.variants?.[0];
      if (mainV && bundleSelected[product.id]) await addToCart(mainV.id, quantity);
      for (const p of relatedProducts.slice(0, 3)) {
        if (bundleSelected[p.id]) { const v = p.variants?.[0]; if (v) await addToCart(v.id, 1); }
      }
      setCartSuccess(true); setTimeout(() => setCartSuccess(false), 3000);
    } catch (err) { console.error(err); }
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
    return product?.variants?.find((v) => v.images?.length)?.images || [];
  };

  const PriceDisplay = () => {
    if (initialLoading) return <div className="h-12 w-40 bg-gray-100 animate-pulse" style={{ borderRadius: "4px" }} />;
    const hidePrices = priceSettings?.hidePricesForGuests && !isAuthenticated;
    if (hidePrices || priceSettings === null)
      return (
        <div>
          <p className="text-2xl" style={{ color: "#666666" }}>Sign in to view price</p>
          <Link href={`/auth?redirect=/products/${slug}`} className="mt-2 inline-block text-[11px] uppercase tracking-[0.18em] font-medium hover:underline" style={{ color: "#dc2626" }}>Sign in →</Link>
        </div>
      );
    if (product?.flashSale?.isActive) {
      const fp = parseFloat(product.flashSale.flashSalePrice);
      const rp = parseFloat(product.basePrice);
      return (
        <div className="flex items-baseline gap-4 flex-wrap">
          <span className="text-4xl md:text-[2.8rem] font-extrabold text-gray-900">{formatCurrency(fp)}</span>
          <span className="text-lg line-through font-light" style={{ color: "#666666" }}>{formatCurrency(rp)}</span>
          <span className="px-3 py-1.5 text-[9px] uppercase tracking-[0.18em] font-bold" style={{ backgroundColor: "#dc2626", color: "#fff", borderRadius: "4px" }}>−{product.flashSale.discountPercentage}% Flash</span>
        </div>
      );
    }
    if (selectedVariant) {
      const info = effectivePriceInfo || getEffectivePrice(selectedVariant, quantity);
      if (!info) return <p className="text-2xl" style={{ color: "#666666" }}>Price unavailable</p>;
      const mrp = info.originalPrice ? parseFloat(info.originalPrice) : null;
      const sp = parseFloat(info.price);
      const hasDiff = mrp && mrp > sp;
      const disc = hasDiff ? Math.round(((mrp - sp) / mrp) * 100) : 0;
      return (
        <div className="flex items-baseline gap-4 flex-wrap">
          <span className="text-4xl md:text-[2.8rem] font-extrabold text-gray-900">{formatCurrency(sp)}</span>
          {hasDiff && <><span className="text-lg line-through font-light" style={{ color: "#666666" }}>{formatCurrency(mrp)}</span><span className="px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] font-extrabold rounded-md bg-red-600 text-white">{disc}% Off</span></>}
        </div>
      );
    }
    const bp = parseFloat(product?.basePrice) || 0;
    const rp = parseFloat(product?.regularPrice) || 0;
    const cp = (product?.hasSale && rp > bp) ? bp : (bp || rp);
    const op = (product?.hasSale && rp > bp) ? rp : null;
    const disc = op ? Math.round(((op - cp) / op) * 100) : 0;
    return (
      <div className="flex items-baseline gap-4 flex-wrap">
        <span className="text-4xl md:text-[2.8rem] font-extrabold text-gray-900">{formatCurrency(cp)}</span>
        {op && <><span className="text-lg line-through font-light" style={{ color: "#666666" }}>{formatCurrency(op)}</span><span className="px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] font-extrabold rounded-md bg-red-600 text-white">{disc}% Off</span></>}
      </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-white">
      <span className="italic text-2xl" style={{ color: "rgba(17,17,17,0.3)" }}>MWP SUPPLEMENTS</span>
      <span className="block h-px w-32 overflow-hidden relative" style={{ backgroundColor: "#EAEAEA" }}>
        <span className="absolute inset-y-0 left-0 w-1/3 bg-red-600 animate-marquee-x" />
      </span>
    </div>
  );

  if (error || !product) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-white">
      <div className="w-20 h-20 flex items-center justify-center mb-8" style={{ border: "1px solid #EAEAEA", borderRadius: "8px" }}>
        <IconAlertCircle className="h-8 w-8" style={{ color: "#666666" }} stroke={1.2} />
      </div>
      <h2 className="text-3xl font-extrabold mb-3 text-gray-900">Product Not Found</h2>
      <p className="mb-10 font-light" style={{ color: "#666666" }}>{error || "This product is no longer available."}</p>
      <Link href="/products" className="inline-flex items-center gap-2 px-7 py-3.5 text-[11px] uppercase tracking-[0.15em] font-medium transition-colors duration-300" style={{ backgroundColor: "#111111", color: "#fff", borderRadius: "8px" }}>
        Back to Shop
      </Link>
    </div>
  );

  const images = getImages();
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
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pt-7 pb-2">
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] flex-wrap" style={{ color: "#666666" }}>
          <Link href="/" className="hover:text-red-600 transition-colors">Home</Link>
          <span style={{ color: "#dc2626" }}>·</span>
          <Link href="/products" className="hover:text-red-600 transition-colors">Shop</Link>
          {product.category && <><span style={{ color: "#dc2626" }}>·</span><Link href={`/category/${product.category.slug}`} className="hover:text-red-600 transition-colors">{product.category.name}</Link></>}
          <span style={{ color: "#dc2626" }}>·</span>
          <span className="font-medium truncate max-w-[200px]" style={{ color: "#111111" }}>{product.name}</span>
        </nav>
      </div>

      {/* Product Hero */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

          {/* Left: Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[640px] no-scrollbar pb-2 lg:pb-0">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setMainImage(img); setActiveThumb(idx); }}
                    className="relative flex-shrink-0 w-[72px] h-[92px] overflow-hidden transition-all duration-300"
                    style={{
                      borderRadius: "8px",
                      border: activeThumb === idx ? "2px solid #dc2626" : "1px solid #EAEAEA",
                      opacity: activeThumb === idx ? 1 : 0.7,
                    }}
                  >
                    <Image src={getImageUrl(img.url)} alt="" fill className="object-cover" sizes="72px" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div
              className="relative flex-1 aspect-[3/4] overflow-hidden bg-gray-50 group cursor-zoom-in select-none"
              style={{ borderRadius: "8px" }}
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
                  className="object-cover transition-transform duration-200 ease-out pointer-events-none"
                  style={{
                    transformOrigin: isHovered ? `${zoomPos.x}% ${zoomPos.y}%` : "center center",
                    transform: isHovered ? "scale(2.2)" : "scale(1)",
                  }}
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <Image src="/placeholder.jpg" alt={product.name} fill className="object-cover" />
              )}

              {/* Hover Zoom Hint */}
              <div className="absolute bottom-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gray-900/80 backdrop-blur-md text-white text-[9px] tracking-widest uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/10">
                <IconZoomIn className="h-3.5 w-3.5 text-red-600" />
                <span>Click to Expand</span>
              </div>

              {/* Badges */}
              <div className="absolute top-5 left-5 z-20 flex flex-col gap-2 pointer-events-none">
                {product.flashSale?.isActive && (
                  <span className="px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1.5" style={{ backgroundColor: "#dc2626", color: "#fff", borderRadius: "4px" }}>
                    <IconBolt className="h-3 w-3" stroke={2} /> Flash Sale
                  </span>
                )}
                {outOfStock && (
                  <span className="px-4 py-2 text-[9px] font-bold uppercase tracking-[0.2em]" style={{ backgroundColor: "#111111", color: "#fff", borderRadius: "4px" }}>Sold Out</span>
                )}
              </div>

              {/* Wishlist quick toggle */}
              <button
                onClick={(e) => { e.stopPropagation(); handleWishlist(); }}
                disabled={isAddingToWishlist}
                className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-white/95 shadow-md backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95"
                aria-label="Wishlist"
              >
                <IconHeart className={`h-5 w-5 transition-colors ${isInWishlist ? "text-red-600" : "text-gray-400 hover:text-red-500"}`} stroke={1.8} fill={isInWishlist ? "currentColor" : "none"} />
              </button>

              {/* Image count */}
              {images.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 px-4 py-1.5 backdrop-blur-md text-[10px] tracking-[0.15em] z-20 pointer-events-none" style={{ backgroundColor: "rgba(17,17,17,0.5)", color: "#fff", borderRadius: "6px" }}>
                  {activeThumb + 1} / {images.length}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col lg:sticky lg:top-28 lg:self-start">

            {/* Brand */}
            {product.brand && (
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium mb-4" style={{ color: "#dc2626" }}>{product.brand.name}</span>
            )}

            {/* Category eyebrow + Title */}
            {product.category?.name && (
              <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-red-600 mb-2.5">
                {product.category.name}
              </span>
            )}
            <div className="flex items-start gap-3 mb-4 flex-wrap">
              <h1 className="text-3xl md:text-[2.4rem] font-extrabold leading-[1.1] tracking-tight text-gray-900">{product.name}</h1>
              {product.gender && (
                <Link
                  href={`/products?gender=${product.gender}`}
                  className="mt-1.5 inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  {product.gender}
                </Link>
              )}
            </div>

            {/* Rating — hidden for now, see SHOW_REVIEWS */}
            {SHOW_REVIEWS && (
              <div className="flex items-center gap-2.5 mb-6">
                <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <IconStar key={i} className="h-3.5 w-3.5" style={{ color: "#dc2626" }} fill="#dc2626" stroke={0} />)}</div>
                <span className="text-[11px] tracking-[0.12em] uppercase" style={{ color: "#666666" }}>({product.reviewCount || 0} reviews)</span>
              </div>
            )}

            {/* Product Notes */}
            {product.notes && product.notes.length > 0 && (
              <div className="mb-7">
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] mb-4" style={{ color: "#111111" }}>Notes</p>
                <div className="flex flex-wrap gap-4">
                  {product.notes.map((note) => (
                    <div key={note.id} className="flex flex-col items-center gap-2">
                      <div className="relative w-16 h-16 overflow-hidden" style={{ borderRadius: "18px" }}>
                        <Image
                          src={getImageUrl(note.image)}
                          alt={note.title || "Note"}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <span className="text-[11px] font-light tracking-wide" style={{ color: "#666666" }}>{note.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            <div className="mb-7 pb-7" style={{ borderBottom: "1px solid #EAEAEA" }}><PriceDisplay /></div>

            {/* Short Description */}
            {product.shortDescription && (
              <p className="text-[14px] leading-relaxed mb-7 font-light tracking-wide" style={{ color: "#666666" }}>{product.shortDescription}</p>
            )}

            {/* Promise */}
            <div className="mb-7 flex items-center gap-4 p-4" style={{ border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "#FAFAFA", borderRadius: "8px" }}>
              <IconShieldCheck className="h-5 w-5 flex-shrink-0 text-red-500" stroke={1.5} />
              <p className="text-[12px] leading-relaxed tracking-wide" style={{ color: "rgba(17,17,17,0.7)" }}>
                <strong className="font-semibold text-neutral-900">MWP Performance Guarantee</strong> — 100% authentic clinical nutrition, GMP certified &amp; third-party lab verified.
              </p>
            </div>

            {/* Attributes */}
            {product.attributeOptions?.map((attr) => {
              const values = getAvailableValues(attr.id);
              const selId = selectedAttributes[attr.id];
              const selVal = values.find((v) => v.id === selId);
              return (
                <div key={attr.id} className="mb-6">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 text-gray-900">
                    {attr.name} {selVal && <span className="font-semibold normal-case tracking-normal text-[12px] text-gray-500">— {selVal.value}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {values.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => handleAttributeChange(attr.id, v.id)}
                        className={`min-w-[52px] px-5 py-2.5 text-[12.5px] font-bold rounded-lg border-2 transition-all ${
                          selId === v.id
                            ? "border-red-600 bg-red-600 text-white shadow-md shadow-red-600/20"
                            : "border-gray-200 text-gray-700 hover:border-red-300"
                        }`}
                      >
                        {v.value}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Success */}
            {cartSuccess && (
              <div className="flex items-center gap-3 p-4 text-[13px] font-medium tracking-wide mb-6" style={{ backgroundColor: "#FAFAFA", border: "1px solid rgba(61,124,79,0.3)", color: "#3D7C4F", borderRadius: "8px" }}>
                <IconCircleCheck className="h-5 w-5 flex-shrink-0" stroke={1.5} /> Added to your bag
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex gap-3 mb-3" id="main-add-to-cart-btn">
              <div className="flex items-center overflow-hidden h-14 bg-white rounded-xl border border-gray-200">
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= (selectedVariant?.moq || 1) || isAddingToCart} className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors" aria-label="Decrease quantity">
                  <IconMinus className="h-4 w-4" stroke={2} />
                </button>
                <span className="w-12 text-center text-lg font-bold text-gray-900">{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= stock || isAddingToCart} className="w-12 h-full flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 transition-colors" aria-label="Increase quantity">
                  <IconPlus className="h-4 w-4" stroke={2} />
                </button>
              </div>
              <button onClick={handleAddToCart} disabled={isAddingToCart || outOfStock}
                className="flex-1 h-14 rounded-xl text-[12px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2.5 transition-all disabled:opacity-40 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/25 active:scale-[0.99]">
                {isAddingToCart ? <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : outOfStock ? "Sold Out" : <><IconBolt className="h-4 w-4" stroke={2} /> Add to Cart</>}
              </button>
            </div>

            {/* Wishlist + Compare row */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleWishlist}
                disabled={isAddingToWishlist}
                className={`flex-1 h-12 rounded-xl border text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors ${
                  isInWishlist
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600"
                }`}
              >
                <IconHeart className="h-4 w-4" stroke={2} fill={isInWishlist ? "currentColor" : "none"} />
                {isInWishlist ? "Wishlisted" : "Wishlist"}
              </button>
              <button
                onClick={() => toggleCompare(product)}
                className={`flex-1 h-12 rounded-xl border text-[11px] font-bold uppercase tracking-[0.12em] flex items-center justify-center gap-2 transition-colors ${
                  isInCompare(product?.id)
                    ? "border-red-300 bg-red-50 text-red-600"
                    : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-600"
                }`}
              >
                <IconGitCompare className="h-4 w-4" stroke={2} />
                {isInCompare(product?.id) ? "In Compare" : "Compare"}
              </button>
            </div>

            {/* Delivery */}
            <div className="mb-7">
              <div className="flex items-center gap-3 p-4" style={{ border: "1px solid #EAEAEA", borderRadius: "8px" }}>
                <IconTruck className="h-5 w-5 flex-shrink-0" style={{ color: "#dc2626" }} stroke={1.5} />
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.18em]" style={{ color: "#111111" }}>Delivery</p>
                  <p className="text-[10px] mt-0.5 font-light" style={{ color: "#666666" }}>5–7 business days</p>
                </div>
              </div>
            </div>

            {/* Delivery Date */}
            <div className="flex items-center gap-2 text-[12px] mb-6 tracking-wide" style={{ color: "#666666" }}>
              <span className="font-semibold uppercase text-[10px] tracking-[0.18em]" style={{ color: "#111111" }}>Est. delivery</span>
              <span className="font-semibold">{getDeliveryDates()}</span>
            </div>

            {/* Meta */}
            <div className="pt-6 space-y-3" style={{ borderTop: "1px solid #EAEAEA" }}>
              {product.category && (
                <div className="flex text-[12px] items-baseline">
                  <span className="w-24 text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#666666" }}>Category</span>
                  <Link
                    href={`/category/${product.category.slug}`}
                    className="tracking-wide text-gray-900 hover:text-red-600 transition-colors font-medium hover:underline underline-offset-4"
                  >
                    {product.category.name}
                  </Link>
                </div>
              )}
              {product.brand && (
                <div className="flex text-[12px] items-baseline">
                  <span className="w-24 text-[9px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#666666" }}>Brand</span>
                  <Link
                    href={`/brand/${product.brand.slug}`}
                    className="tracking-wide text-gray-900 hover:text-red-600 transition-colors font-medium hover:underline underline-offset-4"
                  >
                    {product.brand.name}
                  </Link>
                </div>
              )}
            </div>

            {/* Share */}
            <div className="flex items-center gap-4 mt-6 pt-6" style={{ borderTop: "1px solid #EAEAEA" }}>
              <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: "#666666" }}>
                <IconShare className="h-4 w-4 text-red-600" stroke={1.5} /> Share
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSocialShare("whatsapp")}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-emerald-600 hover:bg-emerald-600 hover:text-white text-gray-500 transition-all duration-300 shadow-sm"
                  title="Share on WhatsApp"
                  aria-label="Share on WhatsApp"
                >
                  <IconBrandWhatsapp className="w-4 h-4" stroke={1.8} />
                </button>
                <button
                  onClick={() => handleSocialShare("facebook")}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-600 hover:text-white text-gray-500 transition-all duration-300 shadow-sm"
                  title="Share on Facebook"
                  aria-label="Share on Facebook"
                >
                  <IconBrandFacebook className="w-4 h-4" stroke={1.8} />
                </button>
                <button
                  onClick={() => handleSocialShare("twitter")}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-500 transition-all duration-300 shadow-sm"
                  title="Share on X"
                  aria-label="Share on X"
                >
                  <IconBrandX className="w-4 h-4" stroke={1.8} />
                </button>
                <button
                  onClick={() => handleSocialShare("copy")}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-500 transition-all duration-300 shadow-sm relative"
                  title="Copy Link"
                  aria-label="Copy Link"
                >
                  {copied ? <IconCheck className="w-4 h-4 text-emerald-500" stroke={2} /> : <IconLink className="w-4 h-4" stroke={1.8} />}
                  {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[9px] px-2 py-0.5 rounded shadow whitespace-nowrap animate-fadeIn">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bundle */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 mb-16">
          <div className="p-6 md:p-10" style={{ border: "1px solid #EAEAEA", borderRadius: "8px", backgroundColor: "#FAFAFA" }}>
            <div className="mb-8">
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium block mb-2" style={{ color: "#dc2626" }}>Complete the Look</span>
              <h3 className="text-2xl md:text-3xl" style={{ color: "#111111" }}>Frequently Bought <em className="italic" style={{ color: "#dc2626" }}>Together</em></h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-2">
                {bundleItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-white transition-colors" style={{ border: "1px solid #EAEAEA", borderRadius: "8px" }}>
                    <input type="checkbox" checked={!!bundleSelected[item.id]} disabled={item.isMain} onChange={(e) => setBundleSelected({ ...bundleSelected, [item.id]: e.target.checked })} className="w-4 h-4 cursor-pointer disabled:opacity-50" style={{ accentColor: "#dc2626" }} />
                    <div className="relative w-14 h-16 overflow-hidden flex-shrink-0" style={{ borderRadius: "6px" }}>
                      <Image src={getImageUrl(item.image)} alt="" fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] truncate tracking-wide" style={{ color: "#111111" }}>{item.isMain && <span className="text-[9px] uppercase tracking-[0.18em] mr-2" style={{ color: "#dc2626" }}>This piece</span>}{item.name}</p>
                    </div>
                    <span className="text-[13px] font-semibold" style={{ color: "#111111" }}>{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
              <div className="lg:col-span-4 p-8 text-center" style={{ backgroundColor: "#111111", borderRadius: "8px" }}>
                <span className="text-[9px] uppercase tracking-[0.3em] block mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>Bundle Total</span>
                <span className="text-4xl block mb-5" style={{ color: "#dc2626" }}>{formatCurrency(bundleTotal)}</span>
                <button onClick={handleAddBundleToCart} disabled={isAddingBundle || !Object.values(bundleSelected).some(Boolean)} className="w-full h-12 text-[10px] font-semibold uppercase tracking-[0.25em] transition-all duration-300 disabled:opacity-40" style={{ backgroundColor: "#dc2626", color: "#fff", borderRadius: "8px" }}>
                  {isAddingBundle ? "Adding…" : "Add Bundle to Bag"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Accordion Sections */}
      <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 mb-16">
        {/* Description - always visible */}
        {product.description && (
          <div className="mb-10 max-w-4xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] mb-4" style={{ color: "#111111" }}>Description</p>
            <div className="text-[14px] leading-relaxed font-light tracking-wide" style={{ color: "#666666" }} dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        )}

        {/* Collapsible sections */}
        <div className="max-w-4xl space-y-0" style={{ borderTop: "1px solid #EAEAEA" }}>
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
              <div key={key} style={{ borderBottom: "1px solid #EAEAEA" }}>
                <button
                  onClick={() => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="flex items-center justify-between w-full py-5 text-left transition-colors"
                >
                  <span className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#111111" }}>{label}</span>
                  <IconChevronRight
                    className="h-4 w-4 transition-transform duration-300"
                    style={{ color: "#666666", transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}
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
                          <div key={note.id || note.title} className="flex flex-col items-center p-3 rounded-xl border border-gray-200/60 bg-gray-50/40 hover:border-red-500/50 transition-all text-center group">
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 overflow-hidden mb-2 rounded-xl shadow-sm">
                              <Image
                                src={getImageUrl(note.image)}
                                alt={note.title || "Key Active"}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                sizes="80px"
                              />
                            </div>
                            <span className="text-[11px] font-medium tracking-wider uppercase text-gray-900">{note.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {content && (
                    <div className="text-[14px] leading-relaxed font-light tracking-wide" style={{ color: "#666666" }} dangerouslySetInnerHTML={{ __html: content }} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Ingredients in this product */}
          {product.ingredients && product.ingredients.length > 0 && (
            <div style={{ borderBottom: "1px solid #EAEAEA" }}>
              <button
                onClick={() => setOpenSections((prev) => ({ ...prev, ingredients: !prev.ingredients }))}
                className="flex items-center justify-between w-full py-5 text-left transition-colors"
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-gray-900">
                  Ingredients ({product.ingredients.length})
                </span>
                <IconChevronRight
                  className="h-4 w-4 transition-transform duration-300 text-gray-500"
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
                    <div key={ing.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                      {ing.image ? (
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-100 shrink-0">
                          <Image src={ing.image} alt={ing.name} fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-100 shrink-0 flex items-center justify-center text-[9px] uppercase tracking-wide text-gray-300 text-center px-1">
                          Image soon
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-gray-900 leading-snug">{ing.name}</p>
                        <p className="text-[12px] text-gray-500 leading-relaxed mt-0.5">{ing.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/ingredients"
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] font-bold text-red-600 hover:text-red-700"
                >
                  See all MWP ingredients
                  <IconChevronRight className="h-3.5 w-3.5" stroke={2} />
                </Link>
              </div>
            </div>
          )}

          {/* Product Videos Section */}
          {product.videos && product.videos.length > 0 && (
            <div style={{ borderBottom: "1px solid #EAEAEA" }}>
              <button
                onClick={() => setOpenSections((prev) => ({ ...prev, videos: !prev.videos }))}
                className="flex items-center justify-between w-full py-5 text-left transition-colors"
              >
                <span className="text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#111111" }}>Videos</span>
                <IconChevronRight
                  className="h-4 w-4 transition-transform duration-300"
                  style={{ color: "#666666", transform: openSections.videos ? "rotate(90deg)" : "rotate(0deg)" }}
                  stroke={1.5}
                />
              </button>
              <div
                className="overflow-hidden transition-all duration-500"
                style={{ maxHeight: openSections.videos ? "2000px" : "0", opacity: openSections.videos ? 1 : 0, marginBottom: openSections.videos ? "24px" : "0" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.videos.map((video, i) => (
                    <div key={video.id || i} className="rounded-lg overflow-hidden" style={{ border: "1px solid #EAEAEA" }}>
                      <div className="aspect-video w-full bg-black">
                        <video
                          src={video.videoUrl}
                          controls
                          preload="metadata"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {video.title && (
                        <div className="px-3 py-2">
                          <p className="text-[13px] font-medium" style={{ color: "#111111" }}>{video.title}</p>
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
          <div className="mt-16 max-w-4xl">
            <ReviewSection product={product} />
          </div>
        )}
      </div>

      {/* Lifestyle Section */}
      {(product.lifestyleImage || product.lifestyleDescription) && (
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14 items-center">
            {product.lifestyleImage && (
              <div className="relative aspect-[4/3] overflow-hidden" style={{ borderRadius: "8px" }}>
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
                  className="text-[14px] leading-relaxed font-light tracking-wide"
                  style={{ color: "#666666" }}
                  dangerouslySetInnerHTML={{ __html: product.lifestyleDescription }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related */}
      {relatedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 pb-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] font-medium block mb-3" style={{ color: "#dc2626" }}>Keep Exploring</span>
              <h2 className="text-3xl md:text-4xl tracking-tight" style={{ color: "#111111" }}>You May Also <em className="italic" style={{ color: "#dc2626" }}>Like</em></h2>
            </div>
            <Link href="/products" className="text-[11px] uppercase tracking-[0.15em] font-medium shrink-0 hover:text-red-600 transition-colors" style={{ color: "#111111" }}>View All →</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {relatedProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {/* Sticky Bar */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] py-3">
          <div className="max-w-7xl mx-auto px-5 md:px-8 lg:px-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
                <Image src={getImageUrl(primary?.url)} alt="" fill className="object-cover" sizes="48px" />
              </div>
              <div className="min-w-0">
                <h4 className="text-[13px] font-bold text-gray-900 truncate">{product.name}</h4>
                <p className="text-[14px] font-extrabold text-red-600 mt-0.5">
                  {formatCurrency(selectedVariant ? (effectivePriceInfo?.price || selectedVariant.price) : (product.basePrice || product.regularPrice))}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => toggleCompare(product)}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-colors ${
                  isInCompare(product?.id) ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
                }`}
                aria-label="Compare"
                title={isInCompare(product?.id) ? "In compare" : "Add to compare"}
              >
                <IconGitCompare className="h-5 w-5" stroke={2} />
              </button>
              <button
                onClick={handleWishlist}
                className={`h-12 w-12 rounded-xl border flex items-center justify-center transition-colors ${
                  isInWishlist ? "border-red-300 bg-red-50 text-red-600" : "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600"
                }`}
                aria-label="Wishlist"
              >
                <IconHeart className="h-5 w-5" stroke={2} fill={isInWishlist ? "currentColor" : "none"} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || outOfStock}
                className="px-5 sm:px-8 h-12 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-600/20 disabled:opacity-40 transition-all"
              >
                {isAddingToCart ? "Adding…" : outOfStock ? "Sold Out" : <><IconBolt className="h-4 w-4" stroke={2} /> Add to Cart</>}
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
              <span className="text-xs uppercase tracking-[0.2em] font-medium text-red-600">{product.name}</span>
              {images.length > 1 && (
                <span className="text-xs text-white/50 tracking-wider">
                  ({activeThumb + 1} of {images.length})
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 bg-white/10 p-1 rounded-lg">
                <button
                  onClick={() => setLightboxScale((prev) => Math.max(1, prev - 0.5))}
                  disabled={lightboxScale <= 1}
                  className="p-2 rounded hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
                  title="Zoom Out"
                >
                  <IconZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setLightboxScale(1)}
                  className="px-2 py-1 text-xs font-mono font-medium text-red-600 hover:bg-white/10 rounded transition-colors"
                  title="Reset Zoom"
                >
                  {Math.round(lightboxScale * 100)}%
                </button>
                <button
                  onClick={() => setLightboxScale((prev) => Math.min(4, prev + 0.5))}
                  disabled={lightboxScale >= 4}
                  className="p-2 rounded hover:bg-white/10 text-white disabled:opacity-30 transition-colors"
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
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-red-700 hover:text-gray-900 text-white backdrop-blur-md transition-all"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 hover:bg-red-700 hover:text-gray-900 text-white backdrop-blur-md transition-all"
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
                  className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all border-2 ${activeThumb === idx ? "border-red-500 opacity-100 scale-105" : "border-transparent opacity-50 hover:opacity-80"
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
