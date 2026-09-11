"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "./auth-context";
import { fetchApi } from "./utils";
import {
    getGuestCart,
    addToGuestCart,
    updateGuestCartItem,
    removeFromGuestCart,
    clearGuestCart,
    mergeGuestCartWithUserCart,
    hasGuestCartItems,
    getGuestCartItemCount,
} from "./guest-cart-utils";

const CartContext = createContext();

export function CartProvider({ children }) {
    const { isAuthenticated, openAuthModal } = useAuth();
    const [cart, setCart] = useState({
        items: [],
        subtotal: 0,
        itemCount: 0,
        totalQuantity: 0,
    });
    const [loading, setLoading] = useState(false);
    const [cartItemsLoading, setCartItemsLoading] = useState({}); // Track loading state for individual items
    const [error, setError] = useState(null);
    const [coupon, setCoupon] = useState(null);
    const [couponLoading, setCouponLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [mergeProgress, setMergeProgress] = useState(null); // Track merge progress
    const [hidePricesForGuests, setHidePricesForGuests] = useState(false); // New state for price visibility
    const mergeCompletedRef = useRef(false);

    // Set mounted state to prevent hydration issues
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch price visibility settings
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetchApi("/public/price-visibility-settings");
                if (response.success && response.data) {
                    setHidePricesForGuests(response.data.hidePricesForGuests);
                }
            } catch (error) {
                console.error("Failed to fetch price visibility settings:", error);
            }
        };
        fetchSettings();
    }, []);

    // Initialize cart based on authentication status
    useEffect(() => {
        if (!mounted) return;
        fetchCart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, mounted]);

    // Clear cart when user logs out
    useEffect(() => {
        if (mounted && !isAuthenticated) {
            mergeCompletedRef.current = false;
        }
    }, [isAuthenticated, mounted]);

    // Merge guest cart when user logs in
    useEffect(() => {
        if (
            mounted &&
            isAuthenticated &&
            hasGuestCartItems() &&
            !mergeCompletedRef.current
        ) {
            mergeCompletedRef.current = true;
            setLoading(true); // Show loading during merge
            setMergeProgress("Merging your cart items...");

            // Reduced delay for faster merge process
            setTimeout(async () => {
                try {
                    // First, fetch the current user cart to ensure we have the latest state
                    setMergeProgress("Loading your existing cart...");
                    await fetchCart();

                    // Then merge guest cart items
                    setMergeProgress("Adding guest items to your cart...");
                    const result = await mergeGuestCartWithUserCart();
                    if (result.success) {
                        toast.success(result.message);
                        // Fetch updated cart from server to show the merged result
                        setMergeProgress("Updating cart display...");
                        await fetchCart();
                    } else {
                        toast.error(result.message);
                    }
                } catch (error) {
                    console.error("Error merging cart:", error);
                    toast.error("Failed to merge cart items");
                    // Reset merge flag so user can try again
                    mergeCompletedRef.current = false;
                } finally {
                    setLoading(false); // Hide loading after merge
                    setMergeProgress(null); // Clear progress message
                }
            }, 100); // Reduced to 100ms for even faster response
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, mounted]);

    // Re-verify coupon when cart changes
    useEffect(() => {
        const reVerifyCoupon = async () => {
            if (!coupon || !isAuthenticated || !cart.items || cart.items.length === 0) {
                // If no coupon applied or cart is empty, clear coupon
                if (coupon && cart.items.length === 0) {
                    setCoupon(null);
                }
                return;
            }

            try {
                const cartTotal = parseFloat(cart.subtotal || 0).toFixed(2);
                const cartItemsPayload = (cart.items || []).map((item) => ({
                    productId: item?.product?.id,
                    productVariantId: item?.variant?.id,
                    brandId: item?.product?.brandId || item?.product?.brand?.id || null,
                    categoryIds: Array.isArray(item?.product?.categories)
                        ? item.product.categories
                            .map((category) => category?.id)
                            .filter(Boolean)
                        : [],
                    price: item?.price,
                    quantity: item?.quantity,
                }));

                const verifyResponse = await fetchApi("/coupons/verify", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        code: coupon.code,
                        cartTotal,
                        cartItems: cartItemsPayload
                    }),
                });

                // Update coupon with new discount amount
                const discountAmount = verifyResponse.data.coupon.discountAmount;
                const finalAmount = verifyResponse.data.coupon.finalAmount;
                const applicableSubtotal = verifyResponse.data.coupon.applicableSubtotal;
                const matchedItems = verifyResponse.data.coupon.matchedItems ?? 0;
                const originalCartTotal = parseFloat(cartTotal);

                const discountPercentage = (discountAmount / originalCartTotal) * 100;
                const isDiscountCapped =
                    verifyResponse.data.coupon.discountType === "FIXED_AMOUNT" &&
                    discountPercentage >= 95;

                setCoupon({
                    id: verifyResponse.data.coupon.id,
                    code: verifyResponse.data.coupon.code,
                    discountType: verifyResponse.data.coupon.discountType,
                    discountValue: verifyResponse.data.coupon.discountValue,
                    discountAmount,
                    finalAmount,
                    applicableSubtotal,
                    matchedItems,
                    isDiscountCapped,
                });
            } catch (error) {
                // If coupon is no longer valid, remove it
                console.error("Coupon re-verification failed:", error);
                setCoupon(null);
                toast.error("Coupon is no longer valid for your cart");
            }
        };

        // Debounce the re-verification to avoid too many API calls
        const timeoutId = setTimeout(() => {
            reVerifyCoupon();
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cart.subtotal, cart.items?.length, isAuthenticated]);

    // Get cart from server (for authenticated users) or local guest cart
    const fetchCart = async () => {
        setLoading(true);
        try {
            let serverItems = [];
            let serverShippingTotal = 0;
            let serverFreeShippingThreshold = 0;
            let serverShippingMessage = "";

            if (isAuthenticated) {
                try {
                    const res = await fetchApi("/cart", { credentials: "include" });
                    serverItems = res.data?.items || [];
                    // Capture shipping info from server response
                    if (res.data?.shippingTotal !== undefined) {
                        serverShippingTotal = parseFloat(res.data.shippingTotal) || 0;
                        serverFreeShippingThreshold = parseFloat(res.data.freeShippingThreshold) || 0;
                        serverShippingMessage = res.data.shippingMessage || "";
                    }
                } catch (e) {
                    console.warn("Server cart fetch warning, utilizing local guest cart:", e);
                }
            }

            const guestCart = getGuestCart();
            let mergedItems = [...serverItems];

            if (isAuthenticated) {
                // When authenticated, if server cart has items, clear local guest storage so it doesn't linger and duplicate
                if (serverItems.length > 0 && guestCart.items && guestCart.items.length > 0) {
                    clearGuestCart();
                }
            } else if (guestCart.items && guestCart.items.length > 0) {
                // For non-authenticated users, use guestCart items cleanly
                mergedItems = [...guestCart.items];
            }

            const subtotal = mergedItems
                .reduce((sum, item) => sum + parseFloat(item.subtotal || (parseFloat(item.price) * (item.quantity || 1)) || 0), 0)
                .toFixed(2);
            const itemCount = mergedItems.length;
            const totalQuantity = mergedItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

            const finalCart = {
                items: mergedItems,
                subtotal,
                shippingTotal: serverShippingTotal,
                freeShippingThreshold: serverFreeShippingThreshold,
                shippingMessage: serverShippingMessage,
                itemCount,
                totalQuantity,
            };

            setCart(finalCart);
            return finalCart;
        } catch (err) {
            setError(err.message);
            const guestCart = getGuestCart();
            setCart(guestCart);
            return guestCart;
        } finally {
            setLoading(false);
        }
    };

    // Universal add to cart function
    const addToCart = async (productVariantId, quantity = 1) => {
        if (!mounted) return;

        setLoading(true);
        try {
            if (isAuthenticated && typeof productVariantId !== "object") {
                // Authenticated: the server cart is the source of truth.
                // If the server rejects the add (out of stock, MOQ, inactive variant, etc.)
                // we must surface that error instead of silently writing to the guest cart,
                // which would never be shown for a logged-in user and makes the cart look empty.
                await fetchApi("/cart/add", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({ productVariantId, quantity }),
                });
                // Clear local guest cart on successful server add so localStorage does not duplicate server cart
                clearGuestCart();
            } else {
                await addToGuestCart(productVariantId, quantity);
            }

            const updatedCart = await fetchCart();
            return updatedCart;
        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to add item to cart");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Add bundle to cart
    const addBundleToCart = async (bundleCampaignId, selectedProductIds, bundleMeta = {}) => {
        if (!mounted) return;

        setLoading(true);
        try {
            if (isAuthenticated) {
                const res = await fetchApi("/cart/add-bundle", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        bundleCampaignId,
                        selectedProductIds,
                    }),
                });

                await fetchCart();
                return res.data;
            } else {
                // Support guest bundle adding to local cart
                const bPrice = Number(bundleMeta.price) || 0;
                const aPrice = Number(bundleMeta.actualPrice) || bPrice;
                const updatedGuestCart = await addToGuestCart({
                    id: `bundle_${bundleCampaignId}_${Date.now()}`,
                    cartItemType: "BUNDLE",
                    productVariantId: `bundle_${bundleCampaignId}`,
                    productName: bundleMeta.title || "Curated Bundle",
                    productSlug: bundleMeta.slug ? `/bundles/${bundleMeta.slug}` : "#",
                    price: bPrice,
                    subtotal: bPrice.toFixed(2),
                    quantity: 1,
                    image: bundleMeta.banner || "/logo.png",
                    isBundle: true,
                    bundleCampaignId,
                    selectedProductIds,
                    bundleCampaign: {
                        id: bundleCampaignId,
                        title: bundleMeta.title || "Curated Bundle",
                        slug: bundleMeta.slug,
                        banner: bundleMeta.banner,
                    },
                    bundleData: {
                        bundlePrice: bPrice,
                        actualPrice: aPrice,
                        savings: Math.max(0, aPrice - bPrice),
                        selectedProducts: bundleMeta.selectedProductDetails || [],
                    },
                });
                await fetchCart();
                return updatedGuestCart;
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Universal update cart item function
    const updateCartItem = async (cartItemId, quantity) => {
        setCartItemsLoading((prev) => ({ ...prev, [cartItemId]: true }));
        try {
            if (isAuthenticated) {
                // User is logged in, update server cart
                const res = await fetchApi(`/cart/update/${cartItemId}`, {
                    method: "PATCH",
                    credentials: "include",
                    body: JSON.stringify({ quantity }),
                });

                // Note: Price might change based on quantity (pricing slabs)
                // So we need to fetch updated cart to get correct prices
                // The local update is just for immediate UI feedback
                setCart((prevCart) => ({
                    ...prevCart,
                    items: prevCart.items.map((item) =>
                        item.id === cartItemId
                            ? {
                                ...item,
                                quantity,
                                // Price will be updated from server response
                                subtotal: (parseFloat(item.price) * quantity).toFixed(2),
                            }
                            : item
                    ),
                    // Recalculate the cart totals
                    subtotal: prevCart.items
                        .reduce((sum, item) => {
                            const itemPrice = parseFloat(item.price);
                            const itemQuantity =
                                item.id === cartItemId ? quantity : item.quantity;
                            return sum + itemPrice * itemQuantity;
                        }, 0)
                        .toFixed(2),
                    totalQuantity: prevCart.items.reduce((sum, item) => {
                        return sum + (item.id === cartItemId ? quantity : item.quantity);
                    }, 0),
                }));

                // Fetch the updated cart in the background to ensure consistency
                fetchCart();
                return res.data;
            } else {
                // User is not logged in, update guest cart
                const updatedCart = updateGuestCartItem(cartItemId, quantity);
                setCart(updatedCart);
                return updatedCart;
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setCartItemsLoading((prev) => ({ ...prev, [cartItemId]: false }));
        }
    };

    // Universal remove from cart function
    const removeFromCart = async (cartItemId) => {
        setCartItemsLoading((prev) => ({ ...prev, [cartItemId]: true }));
        try {
            const isLocalItem = typeof cartItemId === "string" && (cartItemId.startsWith("custom") || cartItemId.startsWith("guest"));
            
            if (isAuthenticated && !isLocalItem) {
                // User is logged in, remove from server cart
                const res = await fetchApi(`/cart/remove/${cartItemId}`, {
                    method: "DELETE",
                    credentials: "include",
                });
                await fetchCart();
                return res.data;
            } else {
                // Remove from local/guest cart
                const updatedCart = removeFromGuestCart(cartItemId);
                if (isAuthenticated) {
                    await fetchCart();
                } else {
                    setCart(updatedCart);
                }
                return updatedCart;
            }
        } catch (err) {
            const updatedCart = removeFromGuestCart(cartItemId);
            setCart(updatedCart);
            return updatedCart;
        } finally {
            setCartItemsLoading((prev) => ({ ...prev, [cartItemId]: false }));
        }
    };

    // Universal clear cart function
    const clearCart = async () => {
        setLoading(true);
        try {
            // Always clear guest cart storage so items don't leak into new sessions
            clearGuestCart();
            if (isAuthenticated) {
                // User is logged in, clear server cart
                try {
                    await fetchApi("/cart/clear", {
                        method: "DELETE",
                        credentials: "include",
                    });
                } catch (e) {
                    console.warn("Server cart clear warning:", e);
                }
            }
            const emptyCart = { items: [], subtotal: 0, itemCount: 0, totalQuantity: 0 };
            setCart(emptyCart);
            setCoupon(null);
            return emptyCart;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Apply coupon (only for authenticated users)
    const applyCoupon = async (code) => {
        if (!isAuthenticated) {
            toast.error("Please log in to apply coupons");
            return;
        }

        setCouponLoading(true);
        setError(null);
        try {
            // First verify if the coupon is valid with our cart total
            const cartTotal = parseFloat(cart.subtotal || 0).toFixed(2);
            const cartItemsPayload = (cart.items || []).map((item) => ({
                productId: item?.product?.id,
                productVariantId: item?.variant?.id,
                brandId: item?.product?.brandId || item?.product?.brand?.id || null,
                categoryIds: Array.isArray(item?.product?.categories)
                    ? item.product.categories
                        .map((category) => category?.id)
                        .filter(Boolean)
                    : [],
                price: item?.price,
                quantity: item?.quantity,
            }));

            try {

                const verifyResponse = await fetchApi("/coupons/verify", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({ code, cartTotal, cartItems: cartItemsPayload }),
                });

                // If we got here, coupon is valid - extract discount info
                const discountAmount = verifyResponse.data.coupon.discountAmount;
                const finalAmount = verifyResponse.data.coupon.finalAmount;
                const applicableSubtotal = verifyResponse.data.coupon.applicableSubtotal;
                const matchedItems = verifyResponse.data.coupon.matchedItems ?? 0;
                const originalCartTotal = parseFloat(cartTotal);

                // Check if discount is capped (for fixed amount discounts)
                const discountPercentage = (discountAmount / originalCartTotal) * 100;
                const isDiscountCapped =
                    verifyResponse.data.coupon.discountType === "FIXED_AMOUNT" &&
                    discountPercentage >= 95;

                if (isDiscountCapped) {
                    toast.info("The discount has been capped at 95% of your cart value", {
                        duration: 5000,
                    });
                }

                // Set coupon data right away for immediate UI update
                setCoupon({
                    id: verifyResponse.data.coupon.id,
                    code: verifyResponse.data.coupon.code,
                    discountType: verifyResponse.data.coupon.discountType,
                    discountValue: verifyResponse.data.coupon.discountValue,
                    discountAmount,
                    finalAmount,
                    applicableSubtotal,
                    matchedItems,
                    isDiscountCapped,
                });

                // Apply the coupon to the server in the background, but don't wait for it
                // This prevents full page reload while waiting for the server
                fetchApi("/coupons/apply", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({ code }),
                }).catch((error) => {
                    console.warn("Background coupon application error:", error);
                    // If background apply fails, we don't need to show an error
                    // since the coupon verification already succeeded
                });

                return verifyResponse.data;
            } catch (apiError) {
                console.error("API Error applying coupon:", apiError);
                // Extract error message from response or use a default message
                const errorMessage = apiError.message || "Failed to apply coupon";
                throw new Error(errorMessage);
            }
        } catch (err) {
            console.error("Coupon error:", err);
            setError(err.message || "An error occurred while applying the coupon");
            throw err;
        } finally {
            setCouponLoading(false);
        }
    };

    // Remove coupon
    const removeCoupon = () => {
        setCoupon(null);
        // Clear any coupon-related or general cart errors so UI banners disappear
        setError(null);
        // Refresh cart totals to ensure UI updates immediately
        fetchCart().catch(() => { });
    };

    // Calculate totals
    const getCartTotals = () => {
        const subtotal = parseFloat(cart.subtotal || 0);
        const discount = coupon ? parseFloat(coupon.discountAmount || 0) : 0;
        const shipping = parseFloat(cart.shippingTotal || 0);
        const tax = 0; // No tax

        return {
            subtotal,
            discount,
            shipping,
            tax,
            total: subtotal - discount + shipping + tax,
        };
    };

    // Get cart item count for navbar display
    const getCartItemCount = () => {
        if (!mounted) return 0; // Return 0 during SSR to prevent hydration mismatch
        return cart.totalQuantity || cart.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
    };

    const value = {
        cart,
        loading,
        cartItemsLoading,
        error,
        coupon,
        couponLoading,
        mergeProgress,
        isAuthenticated,
        fetchCart,
        addToCart,
        addBundleToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        applyCoupon,
        removeCoupon,
        getCartTotals,
        getCartItemCount,
        hidePricesForGuests,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    return useContext(CartContext);
}
