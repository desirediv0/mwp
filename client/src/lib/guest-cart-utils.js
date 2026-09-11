// Guest Cart Utilities
// This file handles cart functionality for non-logged-in users

const GUEST_CART_KEY = "mwp_guest_cart";

// Get guest cart from localStorage
export const getGuestCart = () => {
    if (typeof window === "undefined") {
        return { items: [], subtotal: 0, itemCount: 0, totalQuantity: 0 };
    }

    try {
        const cartData = localStorage.getItem(GUEST_CART_KEY) || localStorage.getItem("mwpsupplements_guest_cart");
        const cart = cartData
            ? JSON.parse(cartData)
            : { items: [], subtotal: 0, itemCount: 0, totalQuantity: 0 };
        return cart;
    } catch (error) {
        console.error("Error reading guest cart:", error);
        return { items: [], subtotal: 0, itemCount: 0, totalQuantity: 0 };
    }
};

// Save guest cart to localStorage
export const saveGuestCart = (cart) => {
    if (typeof window === "undefined") return;

    try {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    } catch (error) {
        console.error("Error saving guest cart:", error);
    }
};

// Add item to guest cart
export const addToGuestCart = async (productVariantId, quantity = 1) => {
    try {
        let newItem;

        // Handle product objects (from Fragrance Finder, custom builder, or quick view)
        if (typeof productVariantId === "object" && productVariantId !== null) {
            const customObj = productVariantId;
            const vId = customObj.variantId || customObj.productVariantId || customObj.variants?.[0]?.id || customObj.id || `item_${Date.now()}`;
            const itemPrice = parseFloat(customObj.salePrice || customObj.price || customObj.variants?.[0]?.salePrice || customObj.variants?.[0]?.price || 0);

            newItem = {
                id: customObj.id || `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                cartItemType: customObj.cartItemType || (customObj.isBundle ? "BUNDLE" : "STANDARD"),
                productVariantId: vId,
                productId: customObj.productId || customObj.id || vId,
                productName: customObj.name || customObj.productName || customObj.title || "MWP Supplement",
                productSlug: customObj.slug || customObj.productSlug || "product",
                variantName: customObj.variantName || (customObj.customDetails
                    ? `Formula: ${customObj.customDetails?.actives || ""}`
                    : customObj.variants?.[0]?.name || "Standard Container"),
                price: itemPrice,
                quantity: quantity,
                subtotal: (itemPrice * quantity).toFixed(2),
                image: customObj.image || customObj.images?.[0]?.url || customObj.images?.[0] || "/logo.png",
                isCustom: customObj.isCustom || false,
                isBundle: customObj.isBundle || false,
                bundleCampaignId: customObj.bundleCampaignId || null,
                selectedProductIds: customObj.selectedProductIds || null,
                bundleCampaign: customObj.bundleCampaign || null,
                bundleData: customObj.bundleData || null,
                customDetails: customObj.customDetails || null
            };
        } else {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "https://api.mwpsupplements.com/api");

            let response = await fetch(
                `${apiBase}/public/products/variants/${productVariantId}`,
                { credentials: "include" }
            );

            if (!response.ok) {
                response = await fetch(
                    `${apiBase}/products/variants/${productVariantId}`,
                    { credentials: "include" }
                );
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error("Failed to fetch product variant");
            }

            const variantData = await response.json();
            const variant = variantData.data?.variant || variantData.variant || variantData.data;

            // Block adding out-of-stock / inactive variants to the guest cart,
            // mirroring the server-side check for logged-in users.
            const variantStock =
                variant?.stock ?? variant?.quantity ?? null;
            if (variant?.isActive === false) {
                throw new Error("This product is currently unavailable");
            }
            if (variantStock !== null && variantStock < quantity) {
                throw new Error(
                    variantStock <= 0
                        ? "This product is out of stock"
                        : `Only ${variantStock} left in stock`
                );
            }

            newItem = {
                id: `guest_${Date.now()}_${Math.random()}`,
                productVariantId: variant.id || productVariantId,
                productId: variant.productId || variant.product?.id,
                productName: variant.product?.name || variant.name || "MWP Supplement",
                productSlug: variant.product?.slug || "product",
                variantName: `${variant.flavor?.name || ""} ${variant.weight?.display || ""}`.trim(),
                price: variant.salePrice || variant.price,
                quantity: quantity,
                subtotal: ((variant.salePrice || variant.price || 0) * quantity).toFixed(2),
                image: variant.images?.[0]?.url || variant.product?.image || "/logo.png",
                sku: variant.sku,
                flavor: variant.flavor,
                weight: variant.weight,
            };
        }

        const currentCart = getGuestCart();

        // Check if item already exists in cart
        const existingItemIndex = currentCart.items.findIndex(
            (item) => item.productVariantId === newItem.productVariantId
        );

        if (existingItemIndex !== -1) {
            currentCart.items[existingItemIndex].quantity += quantity;
            currentCart.items[existingItemIndex].subtotal = (
                parseFloat(currentCart.items[existingItemIndex].price) *
                currentCart.items[existingItemIndex].quantity
            ).toFixed(2);
        } else {
            currentCart.items.push(newItem);
        }

        // Recalculate cart totals
        currentCart.subtotal = currentCart.items
            .reduce((sum, item) => sum + (parseFloat(item.subtotal) || parseFloat(item.price || 0) * (item.quantity || 1) || 0), 0)
            .toFixed(2);
        currentCart.itemCount = currentCart.items.length;
        currentCart.totalQuantity = currentCart.items.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        saveGuestCart(currentCart);
        return currentCart;
    } catch (error) {
        console.error("Error adding to guest cart:", error);
        throw error;
    }
};

// Update guest cart item quantity
export const updateGuestCartItem = (cartItemId, quantity) => {
    const currentCart = getGuestCart();
    const itemIndex = currentCart.items.findIndex(
        (item) => item.id === cartItemId
    );

    if (itemIndex === -1) throw new Error("Item not found in cart");

    if (quantity <= 0) {
        // Remove item if quantity is 0 or negative
        currentCart.items.splice(itemIndex, 1);
    } else {
        // Update quantity
        currentCart.items[itemIndex].quantity = quantity;
        currentCart.items[itemIndex].subtotal = (
            parseFloat(currentCart.items[itemIndex].price) * quantity
        ).toFixed(2);
    }

    // Recalculate cart totals
    currentCart.subtotal = currentCart.items
        .reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
        .toFixed(2);
    currentCart.itemCount = currentCart.items.length;
    currentCart.totalQuantity = currentCart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    saveGuestCart(currentCart);
    return currentCart;
};

// Remove item from guest cart
export const removeFromGuestCart = (cartItemId) => {
    const currentCart = getGuestCart();
    const itemIndex = currentCart.items.findIndex(
        (item) => item.id === cartItemId
    );

    if (itemIndex === -1) throw new Error("Item not found in cart");

    currentCart.items.splice(itemIndex, 1);

    // Recalculate cart totals
    currentCart.subtotal = currentCart.items
        .reduce((sum, item) => sum + parseFloat(item.subtotal), 0)
        .toFixed(2);
    currentCart.itemCount = currentCart.items.length;
    currentCart.totalQuantity = currentCart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    saveGuestCart(currentCart);
    return currentCart;
};

// Clear guest cart
export const clearGuestCart = () => {
    const emptyCart = { items: [], subtotal: 0, itemCount: 0, totalQuantity: 0 };
    saveGuestCart(emptyCart);
    return emptyCart;
};

// Merge guest cart with user cart after login
export const mergeGuestCartWithUserCart = async () => {
    const guestCart = getGuestCart();

    if (guestCart.items.length === 0) {
        return { success: true, message: "No guest cart items to merge" };
    }

    try {
        // Store guest cart items before clearing
        const guestItemsToMerge = [...guestCart.items];

        // Clear guest cart first to prevent any race conditions
        clearGuestCart();

        // Process all items in parallel for faster merging
        const mergePromises = guestItemsToMerge.map(async (guestItem) => {
            try {
                const quantity = Math.max(1, parseInt(guestItem.quantity) || 1);
                const apiBase = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "https://api.mwpsupplements.com/api");

                let endpoint = `${apiBase}/cart/add`;
                let payload = {
                    productVariantId: guestItem.productVariantId,
                    quantity: quantity,
                };

                if (guestItem.isBundle && guestItem.bundleCampaignId) {
                    endpoint = `${apiBase}/cart/add-bundle`;
                    payload = {
                        bundleCampaignId: guestItem.bundleCampaignId,
                        selectedProductIds: guestItem.selectedProductIds || [],
                    };
                }

                const addResponse = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify(payload),
                    signal: AbortSignal.timeout(10000),
                });

                if (addResponse.ok) {
                    return { success: true, item: guestItem };
                } else {
                    console.warn(
                        `Failed to merge item ${guestItem.productVariantId}: ${addResponse.statusText}`
                    );
                    return {
                        success: false,
                        item: guestItem,
                        error: addResponse.statusText,
                    };
                }
            } catch (error) {
                console.error(
                    `Error merging item ${guestItem.productVariantId}:`,
                    error
                );
                return { success: false, item: guestItem, error: error.message };
            }
        });

        // Wait for all merge operations to complete
        const results = await Promise.all(mergePromises);

        // Count successful and failed merges
        const mergedCount = results.filter((result) => result.success).length;
        const skippedCount = results.filter((result) => !result.success).length;

        let message = `Successfully merged ${mergedCount} items from guest cart`;
        if (skippedCount > 0) {
            message += `. ${skippedCount} items could not be merged.`;
        }

        if (mergedCount > 0) {
            message += " Your existing cart items have been preserved.";
        }

        return {
            success: true,
            message,
            mergedItems: mergedCount,
            skippedItems: skippedCount,
        };
    } catch (error) {
        console.error("Error merging guest cart:", error);

        return {
            success: false,
            message: "Failed to merge cart items. Please try again.",
        };
    }
};

// Check if guest cart has items
export const hasGuestCartItems = () => {
    const cart = getGuestCart();
    return cart.items.length > 0;
};

// Get guest cart item count for navbar display
export const getGuestCartItemCount = () => {
    const cart = getGuestCart();
    return cart.totalQuantity || 0;
};
