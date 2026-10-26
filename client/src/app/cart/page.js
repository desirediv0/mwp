"use client";
import CheckoutSteps from "@/components/shop/CheckoutSteps";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import CheckoutRecommendations from "@/components/sections/CheckoutRecommendations";

import {
    Trash2,
    Plus,
    Minus,
    ShoppingBag,
    AlertCircle,
    Loader2,

    ArrowLeft,
    Tag,
    X,
    Package,
    Gift,
    Lock,
    Truck,
    ShieldCheck,
    RotateCcw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

const getImageUrl = (image) => {
    if (!image) return "/mwp-logo-3.png";
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

const CartItem = React.memo(
    ({ item, onUpdateQuantity, onRemove, isLoading }) => {
        const isBundle = item.cartItemType === "BUNDLE";

        const getProductImage = () => {
            if (isBundle) {
                if (item.bundleData?.selectedProducts?.[0]?.image) {
                    return getImageUrl(item.bundleData.selectedProducts[0].image);
                }
                if (item.bundleCampaign?.banner) {
                    return getImageUrl(item.bundleCampaign.banner);
                }
                return "/mwp-logo-3.png";
            }
            if (item.variant?.images && Array.isArray(item.variant.images) && item.variant.images.length > 0) {
                const primaryImage = item.variant.images.find((img) => img.isPrimary);
                const imageUrl = primaryImage?.url || item.variant.images[0]?.url;
                if (imageUrl) return getImageUrl(imageUrl);
            }
            if (item.product?.image) return getImageUrl(item.product.image);
            if (item.image) return getImageUrl(item.image);
            return "/mwp-logo-3.png";
        };

        const getVariantName = () => {
            if (item.variantName && item.variantName.trim() !== "") return item.variantName;
            if (item.variant?.attributes && item.variant.attributes.length > 0) {
                return item.variant.attributes.map((attr) => `${attr.attribute}: ${attr.value}`).join(", ");
            }
            let color = item.variant?.color?.name || item.color?.name;
            let size = item.variant?.size?.name || item.size?.name;
            if (color && size) return `${color} • ${size}`;
            return color || size || null;
        };

        const variantName = getVariantName();
        const productImage = getProductImage();
        const productName = isBundle
            ? item.bundleCampaign?.title || "Bundle"
            : item.productName || item.product?.name || "Product";
        const slug = item.product?.slug || item.productSlug;
        const productHref = isBundle
            ? (item.bundleCampaign?.slug ? `/bundles/${item.bundleCampaign.slug}` : "/bundles")
            : !slug || slug === "product"
                ? "/products"
                : slug.startsWith("/products/")
                    ? slug
                    : `/products/${encodeURIComponent(slug.replace(/^\/+/, ""))}`;
        const sku = item.variant?.sku;

        return (
            <div className={`p-4 sm:p-6 transition-all duration-200 border-b border-black/5 last:border-0 ${!item.isValid ? "bg-neutral-100/50" : "hover:bg-black/[0.01]"}`}>
                <div className="flex gap-4 sm:gap-5">
                    {/* Image */}
                    <Link href={productHref} className="flex-shrink-0">
                        <div className="relative h-28 w-24 sm:h-36 sm:w-32 bg-gradient-to-br from-[#FBF5E6] via-white to-[#EEF1F8] rounded-2xl overflow-hidden border border-[#E6DFC9] group">
                            <Image
                                src={productImage}
                                alt={productName}
                                fill
                                className="object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                                sizes="120px"
                            />
                            {isBundle && (
                                <div className="absolute top-1.5 left-1.5 bg-neutral-900 text-white text-[7px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-sm flex items-center gap-1">
                                    <Gift className="h-2.5 w-2.5" />
                                    BUNDLE
                                </div>
                            )}
                                                    </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                            <Link href={productHref} className="group">
                                <h3 className="text-[15px] sm:text-[17px] font-semibold text-[#12213F] leading-snug group-hover:text-[#A8741F] transition-colors line-clamp-1">
                                    {productName}
                                </h3>
                            </Link>

                            {isBundle && item.bundleData?.selectedProducts?.length > 0 && (
                                <div className="mt-2 space-y-1 p-2.5 bg-black/[0.02] border border-black/5 rounded-lg">
                                    <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-semibold">
                                        Included formulas ({item.bundleData.selectedProducts.length}):
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {item.bundleData.selectedProducts.map((product) => (
                                            <span
                                                key={product.id}
                                                className="inline-flex items-center text-[11px] font-medium text-black/70 bg-white border border-black/10 px-2 py-0.5 rounded"
                                            >
                                                {product.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isBundle && item.isValid === false && item.validationMessage && (
                                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-sm">
                                    <AlertCircle className="h-3 w-3" />
                                    {item.validationMessage}
                                </div>
                            )}

                            {!isBundle && variantName && (
                                <div className="mt-1 flex items-center gap-2">
                                    {(item.variant?.color?.hexCode || item.color?.hexCode) && (
                                        <div
                                            className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                                            style={{ backgroundColor: item.variant?.color?.hexCode || item.color?.hexCode }}
                                        />
                                    )}
                                    <p className="text-[11px] text-neutral-600 font-medium">{variantName}</p>
                                </div>
                            )}

                            {!isBundle && sku && (
                                <p className="text-[11px] text-neutral-600 font-medium mt-0.5 font-mono">SKU: {sku}</p>
                            )}

                            {!isBundle && item.moq && item.moq > 1 && (
                                <p className="text-[11px] text-neutral-600 font-medium mt-1">
                                    Min. order: {item.moq} units
                                </p>
                            )}
                        </div>

                        {/* Mobile price row */}
                        <div className="flex items-center justify-between mt-3 sm:hidden">
                            <div>
                                {isBundle ? (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold text-black">
                                            {formatCurrency(item.bundleData?.bundlePrice || item.price || item.subtotal)}
                                        </span>
                                        {item.bundleData?.actualPrice > (item.bundleData?.bundlePrice || item.price) && (
                                            <span className="text-[11px] text-neutral-600 line-through">
                                                {formatCurrency(item.bundleData.actualPrice)}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold text-black">{formatCurrency(item.price)}</span>
                                        {item.originalPrice && item.originalPrice !== item.price && (
                                            <span className="text-[11px] text-neutral-600 line-through">{formatCurrency(item.originalPrice)}</span>
                                        )}
                                    </div>
                                )}
                                {isBundle && item.bundleData?.savings > 0 && (
                                    <p className="text-[11px] text-green-700 font-medium">Save {formatCurrency(item.bundleData.savings)}</p>
                                )}
                            </div>
                            <span className="text-sm font-semibold text-black">{formatCurrency(item.subtotal)}</span>
                        </div>
                    </div>

                    {/* Desktop right column */}
                    <div className="hidden sm:flex items-start gap-6 lg:gap-8">
                        {/* Price */}
                        <div className="flex flex-col items-end min-w-[80px]">
                            {!isLoading && !item.isAuthenticated && item.hidePricesForGuests ? (
                                <span className="text-[11px] text-neutral-600">Login to view</span>
                            ) : isBundle ? (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold text-black">
                                            {formatCurrency(item.bundleData?.bundlePrice || item.price || item.subtotal)}
                                        </span>
                                        {item.bundleData?.actualPrice > (item.bundleData?.bundlePrice || item.price) && (
                                            <span className="text-[11px] text-neutral-600 line-through">
                                                {formatCurrency(item.bundleData.actualPrice)}
                                            </span>
                                        )}
                                    </div>
                                    {item.bundleData?.savings > 0 && (
                                        <p className="text-[11px] text-green-700 font-medium mt-0.5">Save {formatCurrency(item.bundleData.savings)}</p>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-semibold text-black">{formatCurrency(item.price)}</span>
                                        {item.originalPrice && item.originalPrice !== item.price && (
                                            <span className="text-[11px] text-neutral-600 line-through">{formatCurrency(item.originalPrice)}</span>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Quantity */}
                        {isBundle ? (
                            <div className="flex flex-col items-center min-w-[60px]">
                                <span className="text-[11px] text-neutral-600 uppercase tracking-widest font-medium mb-1">Qty</span>
                                <span className="text-sm font-semibold text-black h-9 flex items-center">1</span>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center min-w-[60px]">
                                <span className="text-[11px] text-neutral-600 uppercase tracking-widest font-medium mb-1">Qty</span>
                                <div className="flex items-center border border-[#E6DFC9] bg-white rounded-full overflow-hidden h-10 shadow-sm">
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.quantity, -1)}
                                        className="w-9 h-full flex items-center justify-center hover:bg-[#FBF5E6] transition-colors disabled:opacity-30"
                                        disabled={isLoading || item.quantity <= (item.moq || 1)}
                                    >
                                        <Minus className="h-3 w-3 text-neutral-600" />
                                    </button>
                                    <span className="w-8 text-center text-xs font-semibold text-black">
                                        {isLoading ? (
                                            <Loader2 className="h-3 w-3 animate-spin inline" />
                                        ) : (
                                            item.quantity
                                        )}
                                    </span>
                                    <button
                                        onClick={() => onUpdateQuantity(item.id, item.quantity, 1)}
                                        className="w-9 h-full flex items-center justify-center hover:bg-[#FBF5E6] transition-colors disabled:opacity-30"
                                        disabled={isLoading}
                                    >
                                        <Plus className="h-3 w-3 text-neutral-600" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Subtotal */}
                        <div className="flex flex-col items-end min-w-[90px]">
                            <span className="text-[11px] text-neutral-600 uppercase tracking-widest font-medium mb-1">Total</span>
                            <span className="text-sm font-semibold text-black">
                                {!isLoading && !item.isAuthenticated && item.hidePricesForGuests ? "-" : formatCurrency(item.subtotal)}
                            </span>
                        </div>

                        {/* Remove */}
                        <button
                            onClick={() => onRemove(item.id)}
                            className="text-neutral-600 hover:text-neutral-600 p-2 rounded-md hover:bg-neutral-100 transition-all disabled:opacity-30 ml-2"
                            aria-label="Remove item"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile remove button */}
                <div className="flex sm:hidden justify-end mt-2">
                    <button
                        onClick={() => onRemove(item.id)}
                        className="text-[11px] text-neutral-600 hover:text-neutral-600 font-medium uppercase tracking-wider flex items-center gap-1 transition-colors"
                        disabled={isLoading}
                    >
                        <Trash2 className="h-3 w-3" />
                        Remove
                    </button>
                </div>
            </div>
        );
    }
);
CartItem.displayName = "CartItem";

export default function CartPage() {
    const {
        cart,
        loading,
        cartItemsLoading,
        error,
        removeFromCart,
        updateCartItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        coupon,
        couponLoading,
        getCartTotals,
        isAuthenticated,
        mergeProgress,
        hidePricesForGuests,
    } = useCart();
    const [couponCode, setCouponCode] = useState("");
    const [couponError, setCouponError] = useState("");
    const router = useRouter();

    const { openAuthModal } = useAuth();

    const handleQuantityChange = useCallback(
        async (cartItemId, currentQuantity, change) => {
            const newQuantity = currentQuantity + change;
            const cartItem = cart.items.find(item => item.id === cartItemId);
            const effectiveMOQ = cartItem?.moq || 1;

            if (newQuantity < effectiveMOQ) {
                toast.error(`Minimum order quantity is ${effectiveMOQ} units`);
                return;
            }
            if (newQuantity < 1) return;

            try {
                await updateCartItem(cartItemId, newQuantity);
            } catch (err) {
                console.error("Error updating quantity:", err);
                toast.error(err.message || "Failed to update quantity");
            }
        },
        [updateCartItem, cart.items]
    );

    const handleRemoveItem = useCallback(
        async (cartItemId) => {
            try {
                await removeFromCart(cartItemId);
            } catch (err) {
                console.error("Error removing item:", err);
                toast.error("Failed to remove item");
            }
        },
        [removeFromCart]
    );

    const handleClearCart = useCallback(async () => {
        if (window.confirm("Are you sure you want to clear your cart?")) {
            try {
                await clearCart();
                toast.success("Cart has been cleared");
            } catch (err) {
                console.error("Error clearing cart:", err);
                toast.error("Failed to clear cart");
            }
        }
    }, [clearCart]);

    const handleApplyCoupon = useCallback(
        async (e) => {
            e.preventDefault();
            if (!couponCode.trim()) {
                setCouponError("Please enter a coupon code");
                return;
            }
            setCouponError("");
            try {
                await applyCoupon(couponCode);
                setCouponCode("");
            } catch (err) {
                setCouponError(err.message || "Invalid coupon code");
                toast.error(err.message || "Invalid coupon code");
            }
        },
        [couponCode, applyCoupon]
    );

    const handleRemoveCoupon = useCallback(() => {
        removeCoupon();
        setCouponCode("");
        setCouponError("");
        toast.success("Coupon removed");
    }, [removeCoupon]);

    const totals = useMemo(() => getCartTotals(), [getCartTotals]);

    const handleCheckout = useCallback(() => {
        const calculatedAmount = totals.subtotal - totals.discount;
        if (calculatedAmount < 1) {
            toast.info("Minimum order amount is $1");
            return;
        }
        router.push("/checkout");
    }, [router, totals]);

    const itemCount = cart.items?.length || 0;
    const bundleCount = cart.items?.filter(i => i.cartItemType === "BUNDLE").length || 0;
    const normalCount = itemCount - bundleCount;

    if (loading && (!cart.items || cart.items.length === 0)) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border border-black/10 border-t-black rounded-full animate-spin" />
                <p className="text-[11px] text-neutral-600 uppercase tracking-[0.2em] font-medium">Loading</p>
            </div>
        );
    }

    if ((!cart.items || cart.items.length === 0) && !error) {
        return (
            <div className="mwp-cart min-h-screen bg-white flex flex-col items-center justify-center py-20 px-4">
                <div className="text-center max-w-md mx-auto rounded-3xl bg-white border border-[#E6DFC9] px-8 py-12">
                    <div className="w-16 h-16 mx-auto mb-6 border border-[#E6DFC9] rounded-full flex items-center justify-center bg-white">
                        <ShoppingBag className="h-7 w-7 text-neutral-600" strokeWidth={1} />
                    </div>
                    <h2 className="text-2xl font-semibold text-black mb-2 tracking-tight">Your bag is empty</h2>
                    <span className="block w-8 h-px bg-black/10 mx-auto my-4" />
                    <p className="text-[13px] text-neutral-600 font-light leading-relaxed mb-8">
                        Explore the MWP formulas and find what fits your routine.
                    </p>
                    <Link href="/products">
                        <button className="bg-neutral-900 text-white text-[12px] font-semibold px-8 py-3.5 rounded-full hover:bg-neutral-800 transition-colors">
                            Browse Collection
                        </button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="mwp-cart min-h-screen bg-white pb-28 lg:pb-24">
            <section className="mwp-cart-hero">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-16 sm:pb-20">
                    <CheckoutSteps current={1} tone="light" />
                    <div className="flex flex-wrap items-end justify-between gap-6">
                        <div>
                            <Link href="/products" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#CDD4E6] hover:text-white transition-colors mb-3">
                                <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
                                Continue shopping
                            </Link>
                            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">Your bag</h1>
                            <p className="mt-2 text-sm text-[#CDD4E6]">
                                {itemCount} {itemCount === 1 ? "item" : "items"}
                                {bundleCount > 0 && ` · ${bundleCount} bundle${bundleCount > 1 ? "s" : ""}`}
                            </p>
                        </div>
                        <div className="mwp-ship-meter w-full sm:w-[340px]">
                            {cart.freeShippingThreshold > 0 ? (
                                totals.subtotal >= cart.freeShippingThreshold ? (
                                    <p className="text-sm"><strong className="text-[#E6C26A]">You unlocked free shipping.</strong> Nice choice.</p>
                                ) : (
                                    <p className="text-sm">Add <strong className="text-[#E6C26A]">{formatCurrency(cart.freeShippingThreshold - totals.subtotal)}</strong> more for free shipping</p>
                                )
                            ) : (
                                <p className="text-sm">Live <strong className="text-[#E6C26A]">USPS, UPS and FedEx</strong> rates at checkout</p>
                            )}
                            {cart.freeShippingThreshold > 0 && (
                                <div className="mwp-ship-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round((totals.subtotal / cart.freeShippingThreshold) * 100))}>
                                    <span style={{ width: `${Math.min(100, (totals.subtotal / cart.freeShippingThreshold) * 100)}%` }} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-9 sm:-mt-11 relative z-10">
                {/* Guest notice */}
                {!isAuthenticated && cart.items.length > 0 && (
                    <div className="bg-white border border-[#E6DFC9] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 rounded-2xl">
                        <div>
                            <p className="text-xs text-neutral-600 font-medium">Sign in to save your cart and access express checkout</p>
                        </div>
                        <Link href="/auth?redirect=cart">
                            <button className="bg-neutral-900 text-white text-[11px] uppercase tracking-[0.15em] font-bold px-5 py-2.5 rounded-xl hover:bg-neutral-900 transition-all whitespace-nowrap">
                                Sign In
                            </button>
                        </Link>
                    </div>
                )}

                {/* Merge progress */}
                {mergeProgress && (
                    <div className="bg-neutral-900 text-white p-3 rounded-lg flex items-center gap-3 mb-6 sm:mb-8">
                        <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                        <span className="text-[11px] uppercase tracking-widest font-medium">{mergeProgress}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Cart Items */}
                    <div className="lg:col-span-8 space-y-5">
                        <div className="bg-white border border-[#E6DFC9] rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-[#EEE8D6] bg-[#FAF8F2]">
                                <h2 className="text-[12px] uppercase tracking-[0.18em] font-semibold text-[#12213F]">Items in your bag</h2>
                                <button onClick={handleClearCart} disabled={loading} className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest font-medium text-neutral-600 hover:text-[#B3001B] transition-colors">
                                    <Trash2 className="h-3 w-3" /> Clear
                                </button>
                            </div>
                            <div className="divide-y divide-black/[0.03]">
                                {cart.items.map((item) => (
                                    <CartItem
                                        key={item.id}
                                        item={{ ...item, isAuthenticated, hidePricesForGuests }}
                                        onUpdateQuantity={handleQuantityChange}
                                        onRemove={handleRemoveItem}
                                        isLoading={cartItemsLoading[item.id]}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Recommended products */}
                        <CheckoutRecommendations title="You May Also Like" />
                    </div>

                    {/* Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-[#E6DFC9] rounded-2xl p-5 sm:p-6 sticky top-24 mwp-summary-card">
                            <h2 className="text-[13px] uppercase tracking-[0.18em] text-[#12213F] font-semibold mb-5 pb-4 border-b border-[#EEE8D6]">
                                Order summary
                            </h2>

                            {/* Coupon */}
                            {(!hidePricesForGuests || isAuthenticated) && (
                                <div className="mb-5 pb-5 border-b border-black/5">
                                    {coupon ? (
                                        <div className="flex items-center justify-between bg-[#FBF5E6] border border-[#EADFC4] p-3 rounded-md">
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-3.5 w-3.5 text-green-700" />
                                                <div>
                                                    <p className="text-[11px] font-semibold text-green-700 uppercase tracking-wider">{coupon.code}</p>
                                                    <p className="text-[11px] text-green-700 mt-0.5">
                                                        {coupon.discountType === "PERCENTAGE"
                                                            ? `${coupon.discountValue}% off`
                                                            : `$${coupon.discountValue} off`}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={handleRemoveCoupon}
                                                className="text-green-700 hover:text-neutral-600 p-1 rounded transition-colors"
                                                disabled={couponLoading}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <form onSubmit={handleApplyCoupon} className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Coupon code"
                                                    value={couponCode}
                                                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                    className="flex-1 border border-black/10 text-[11px] font-medium tracking-wider px-3 py-2.5 rounded-md bg-black/[0.01] focus:outline-none focus:border-black/30 transition-colors placeholder:text-neutral-600"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={couponLoading}
                                                    className="bg-neutral-900 text-white text-[11px] uppercase tracking-wider font-bold px-4 py-2.5 rounded-lg hover:bg-neutral-900 transition-all disabled:opacity-40"
                                                >
                                                    {couponLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                                                </button>
                                            </form>
                                            {couponError && (
                                                <div className="mt-2 flex items-start gap-1.5 text-neutral-600 text-[11px] font-medium">
                                                    <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                                    <p>{couponError}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Breakdown */}
                            <div className="space-y-3 text-xs mb-5 pb-5 border-b border-black/5">
                                <div className="flex justify-between">
                                    <span className="text-neutral-600 uppercase tracking-wider">Subtotal</span>
                                    <span className="font-medium text-black">
                                        {!isAuthenticated && hidePricesForGuests ? (
                                            <Link href="/auth?redirect=cart" className="underline text-neutral-600">Login</Link>
                                        ) : formatCurrency(totals.subtotal)}
                                    </span>
                                </div>

                                {coupon && (
                                    <div className="flex justify-between text-green-700">
                                        <span className="uppercase tracking-wider">Discount</span>
                                        <span className="font-medium">-{formatCurrency(totals.discount)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between">
                                    <span className="text-neutral-600 uppercase tracking-wider">Shipping</span>
                                    <span className="font-medium text-neutral-600 text-[11px] uppercase tracking-widest">Calculated at checkout</span>
                                </div>

                                {totals.subtotal < cart.freeShippingThreshold && cart.freeShippingThreshold > 0 && (
                                    <div className="text-[11px] text-neutral-600 bg-black/[0.02] p-2.5 rounded-md text-center">
                                        Add <strong className="text-black/70">{formatCurrency(cart.freeShippingThreshold - totals.subtotal)}</strong> more for free shipping
                                    </div>
                                )}
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-baseline mb-5">
                                <span className="text-[11px] uppercase tracking-[0.15em] text-neutral-600 font-medium">Total</span>
                                <span className="text-xl font-light text-black">
                                    {!isAuthenticated && hidePricesForGuests ? (
                                        <Link href="/auth?redirect=cart" className="underline text-neutral-600 text-sm">Login to view</Link>
                                    ) : formatCurrency(totals.total)}
                                </span>
                            </div>

                            {/* Checkout */}
                            <button
                                className="w-full bg-neutral-900 text-white text-[13px] font-semibold py-4 rounded-full hover:bg-neutral-800 transition-colors active:scale-[0.99]"
                                onClick={handleCheckout}
                            >
                                {!isAuthenticated && hidePricesForGuests ? (
                                    "Sign In to Checkout"
                                ) : (
                                    <span className="flex items-center justify-center gap-2">
                                        Checkout
                                        <span className="w-px h-3 bg-white/20" />
                                        {formatCurrency(totals.total)}
                                    </span>
                                )}
                            </button>

                            <p className="text-[11px] text-neutral-600 text-center mt-3">
                                Shipping is calculated at checkout from live carrier rates
                            </p>

                            <ul className="mwp-trust-list">
                                <li><Lock className="h-4 w-4" /> <span>Secure checkout with Stripe</span></li>
                                <li><Truck className="h-4 w-4" /> <span>Ships across the USA with USPS, UPS and FedEx</span></li>
                                <li><ShieldCheck className="h-4 w-4" /> <span>Lab tested, made in the USA</span></li>
                                <li><RotateCcw className="h-4 w-4" /> <span>Damaged item? We make it right within 7 days</span></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mwp-mobile-bar lg:hidden">
                <div>
                    <p className="text-[11px] uppercase tracking-widest text-neutral-600">Total</p>
                    <p className="text-lg font-semibold text-[#12213F]">{!isAuthenticated && hidePricesForGuests ? "Login" : formatCurrency(totals.total)}</p>
                </div>
                <button onClick={handleCheckout} className="mwp-mobile-bar-btn">
                    {!isAuthenticated && hidePricesForGuests ? "Sign in" : "Checkout"}
                </button>
            </div>
        </div>
    );
}
