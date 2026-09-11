import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";
import { formatVariantWithAttributes } from "../utils/variant-attributes.js";

// Get user's cart
export const getUserCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get cart items with product and variant details
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      productVariant: {
        include: {
          product: {
            include: {
              images: true,
              brand: true,
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
          attributes: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
          images: true,
        },
      },
      bundleCampaign: {
        include: {
          pricingSlabs: {
            orderBy: { itemCount: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Separate normal and bundle items
  const normalItems = cartItems.filter(
    (item) => item.cartItemType === "NORMAL" || !item.cartItemType
  );
  const bundleItems = cartItems.filter(
    (item) => item.cartItemType === "BUNDLE"
  );

  // Calculate cart totals for normal items
  let subtotal = 0;
  const formattedNormalItems = await Promise.all(
    normalItems.map(async (item) => {
      const variant = item.productVariant;

      // Get effective MOQ for this variant
      let effectiveMOQ = 1;
      let moqSource = "DEFAULT";

      // Check variant MOQ
      const variantMOQ = await prisma.mOQSetting.findFirst({
        where: {
          scope: "VARIANT",
          variantId: variant.id,
          isActive: true,
        },
      });

      if (variantMOQ) {
        effectiveMOQ = variantMOQ.minQuantity;
        moqSource = "VARIANT";
      } else {
        // Check product MOQ
        const productMOQ = await prisma.mOQSetting.findFirst({
          where: {
            scope: "PRODUCT",
            productId: variant.productId,
            isActive: true,
          },
        });

        if (productMOQ) {
          effectiveMOQ = productMOQ.minQuantity;
          moqSource = "PRODUCT";
        } else {
          // Check global MOQ
          const globalMOQ = await prisma.mOQSetting.findFirst({
            where: {
              scope: "GLOBAL",
              isActive: true,
            },
          });

          if (globalMOQ) {
            effectiveMOQ = globalMOQ.minQuantity;
            moqSource = "GLOBAL";
          }
        }
      }

      // Get pricing slabs for this variant
      const variantSlabs = await prisma.pricingSlab.findMany({
        where: {
          variantId: variant.id,
        },
        orderBy: {
          minQty: "asc",
        },
      });

      // Get product-level pricing slabs
      const productSlabs = await prisma.pricingSlab.findMany({
        where: {
          productId: variant.productId,
          variantId: null,
        },
        orderBy: {
          minQty: "asc",
        },
      });

      // Combine slabs (variant slabs override product slabs)
      const allSlabs = [...variantSlabs, ...productSlabs].sort((a, b) => a.minQty - b.minQty);

      // Get effective price based on quantity
      let effectivePrice = parseFloat(variant.salePrice || variant.price);
      let priceSource = "DEFAULT";
      let appliedSlab = null;

      // Find matching pricing slab
      for (const slab of allSlabs) {
        if (item.quantity >= slab.minQty && (slab.maxQty === null || item.quantity <= slab.maxQty)) {
          effectivePrice = parseFloat(slab.price);
          priceSource = slab.variantId ? "VARIANT_SLAB" : "PRODUCT_SLAB";
          appliedSlab = {
            id: slab.id,
            minQty: slab.minQty,
            maxQty: slab.maxQty,
            price: parseFloat(slab.price),
          };
          break; // Use first matching slab (highest priority)
        }
      }

      // Check for active flash sale for this product
      const now = new Date();
      const flashSaleProduct = await prisma.flashSaleProduct.findFirst({
        where: {
          productId: variant.productId,
          flashSale: {
            isActive: true,
            startTime: { lte: now },
            endTime: { gte: now },
          },
        },
        include: {
          flashSale: {
            select: {
              id: true,
              name: true,
              discountPercentage: true,
              endTime: true,
            },
          },
        },
      });

      // Apply flash sale discount if applicable
      let flashSaleInfo = null;
      let priceBeforeFlashSale = effectivePrice;

      if (flashSaleProduct) {
        const discountAmount = (effectivePrice * flashSaleProduct.flashSale.discountPercentage) / 100;
        effectivePrice = Math.round((effectivePrice - discountAmount) * 100) / 100;
        priceSource = "FLASH_SALE";
        flashSaleInfo = {
          flashSaleId: flashSaleProduct.flashSale.id,
          name: flashSaleProduct.flashSale.name,
          discountPercentage: flashSaleProduct.flashSale.discountPercentage,
          endTime: flashSaleProduct.flashSale.endTime,
          originalPrice: priceBeforeFlashSale,
        };
      }

      const itemTotal = effectivePrice * item.quantity;
      subtotal += itemTotal;

      // Enhanced image handling with fallback logic
      let imageUrl = null;

      // Priority 1: Variant images
      if (variant.images && variant.images.length > 0) {
        const primaryImage = variant.images.find((img) => img.isPrimary);
        imageUrl = primaryImage ? primaryImage.url : variant.images[0].url;
      }
      // Priority 2: Product images
      else if (variant.product.images && variant.product.images.length > 0) {
        const primaryImage = variant.product.images.find((img) => img.isPrimary);
        imageUrl = primaryImage
          ? primaryImage.url
          : variant.product.images[0].url;
      }

      // Format the response
      return {
        id: item.id,
        quantity: item.quantity,
        price: effectivePrice, // Use effective price (from slab if applicable)
        originalPrice: parseFloat(variant.salePrice || variant.price), // Original price before slab
        subtotal: itemTotal,
        moq: effectiveMOQ,
        moqSource,
        pricingSlabs: allSlabs.map((slab) => ({
          id: slab.id,
          minQty: slab.minQty,
          maxQty: slab.maxQty,
          price: parseFloat(slab.price),
        })),
        appliedSlab,
        priceSource,
        variant: {
          id: variant.id,
          sku: variant.sku,
          attributes: formatVariantWithAttributes(variant).attributes,
          // Include shipping dimensions
          shippingLength: variant.shippingLength,
          shippingBreadth: variant.shippingBreadth,
          shippingHeight: variant.shippingHeight,
          shippingWeight: variant.shippingWeight,
        },
        product: {
          id: variant.product.id,
          name: variant.product.name,
          slug: variant.product.slug,
          image: imageUrl ? getFileUrl(imageUrl) : null,
          brand: variant.product.brand
            ? {
              id: variant.product.brand.id,
              name: variant.product.brand.name,
            }
            : null,
          brandId: variant.product.brandId,
          categories: (variant.product.categories || []).map((pc) => ({
            id: pc.categoryId,
            name: pc.category?.name,
          })),
        },
        flashSale: flashSaleInfo,
      };
    })
  );

  // Calculate shipping
  let shippingTotal = 0;
  let freeShippingThreshold = 0;
  let shippingMessage = "";

  const shiprocketSettings = await prisma.shiprocketSettings.findFirst();

  if (shiprocketSettings) {
    const charge = parseFloat(shiprocketSettings.shippingCharge) || 0;
    // Only set threshold if there is a charge, otherwise it's always free (threshold irrelevant)
    freeShippingThreshold = charge > 0 ? (parseFloat(shiprocketSettings.freeShippingThreshold) || 0) : 0;

    if (charge > 0) {
      if (freeShippingThreshold > 0) {
        if (subtotal >= freeShippingThreshold) {
          shippingTotal = 0;
          shippingMessage = "Eligible for Free Shipping";
        } else {
          shippingTotal = charge;
          // Format message in frontend usually, but providing data here helps
          shippingMessage = "Add more for free shipping";
        }
      } else {
        shippingTotal = charge;
      }
    } else {
      shippingTotal = 0;
      shippingMessage = "Free Shipping";
    }
  }

  // Format bundle items with re-validation
  let bundleSubtotal = 0;
  const now = new Date();
  const formattedBundleItems = await Promise.all(bundleItems.map(async (item) => {
    const bundleData = item.bundleData || {};
    const bundlePrice = parseFloat(bundleData.bundlePrice || 0);
    const actualPrice = parseFloat(bundleData.actualPrice || 0);
    const savings = parseFloat(bundleData.savings || 0);

    // Re-validate bundle campaign status
    let isValid = true;
    let validationMessage = "";
    const campaign = item.bundleCampaign;

    if (!campaign || !campaign.isActive) {
      isValid = false;
      validationMessage = "This bundle is no longer available";
    } else if (campaign.startDate && campaign.startDate > now) {
      isValid = false;
      validationMessage = "This bundle has not started yet";
    } else if (campaign.endDate && campaign.endDate < now) {
      isValid = false;
      validationMessage = "This bundle has expired";
    }

    // Fetch product details for selected products
    const selectedProductIds = bundleData.selectedProductIds || [];
    let selectedProducts = [];
    if (selectedProductIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: selectedProductIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
          variants: {
            take: 1,
            select: {
              price: true,
              salePrice: true,
              images: {
                where: { isPrimary: true },
                take: 1,
                select: { url: true },
              },
            },
          },
        },
      });
      selectedProducts = selectedProductIds.map((pid) => {
        const product = products.find((p) => p.id === pid);
        if (!product) return null;
        const variant = product.variants[0];
        const price = parseFloat(variant?.salePrice || variant?.price || 0);
        const imageUrl = variant?.images?.[0]?.url || product.image;
        return {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price,
          image: imageUrl ? getFileUrl(imageUrl) : null,
        };
      }).filter(Boolean);
    }

    if (isValid) {
      bundleSubtotal += bundlePrice;
    }

    return {
      id: item.id,
      cartItemType: "BUNDLE",
      quantity: item.quantity,
      isValid,
      validationMessage,
      bundleCampaign: campaign
        ? {
            id: campaign.id,
            title: campaign.title,
            slug: campaign.slug,
            banner: campaign.banner
              ? getFileUrl(campaign.banner)
              : null,
            bundleType: campaign.bundleType,
            discountType: campaign.discountType,
            pricingSlabs: campaign.pricingSlabs.map((s) => ({
              itemCount: s.itemCount,
              price: parseFloat(s.price),
              label: s.label,
            })),
          }
        : null,
      bundleData: {
        selectedProductIds: bundleData.selectedProductIds || [],
        selectedProducts,
        bundlePrice,
        actualPrice,
        savings,
      },
      subtotal: isValid ? bundlePrice : 0,
    };
  }));

  const allItems = [...formattedNormalItems, ...formattedBundleItems];
  const combinedSubtotal = subtotal + bundleSubtotal;

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        items: allItems,
        normalItems: formattedNormalItems,
        bundleItems: formattedBundleItems,
        subtotal: combinedSubtotal,
        shippingTotal,
        freeShippingThreshold,
        shippingMessage,
        grandTotal: combinedSubtotal + shippingTotal,
        itemCount: allItems.length,
        totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      },
      "Cart fetched successfully"
    )
  );
});

// Add item to cart
export const addToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { productVariantId, quantity = 1 } = req.body;

  if (!productVariantId) {
    throw new ApiError(400, "Product variant ID is required");
  }

  // Validate quantity
  if (quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Check if product variant exists and is active
  const productVariant = await prisma.productVariant.findFirst({
    where: {
      id: productVariantId,
      isActive: true,
      product: {
        isActive: true,
      },
    },
    include: {
      product: true,
    },
  });

  if (!productVariant) {
    throw new ApiError(404, "Product variant not found or inactive");
  }

  // Check stock availability
  if (productVariant.quantity < quantity) {
    throw new ApiError(400, "Not enough stock available");
  }

  // Check MOQ (Minimum Order Quantity)
  let effectiveMOQ = 1;

  // Check variant MOQ
  const variantMOQ = await prisma.mOQSetting.findFirst({
    where: {
      scope: "VARIANT",
      variantId: productVariantId,
      isActive: true,
    },
  });

  if (variantMOQ) {
    effectiveMOQ = variantMOQ.minQuantity;
  } else {
    // Check product MOQ
    const productMOQ = await prisma.mOQSetting.findFirst({
      where: {
        scope: "PRODUCT",
        productId: productVariant.productId,
        isActive: true,
      },
    });

    if (productMOQ) {
      effectiveMOQ = productMOQ.minQuantity;
    } else {
      // Check global MOQ
      const globalMOQ = await prisma.mOQSetting.findFirst({
        where: {
          scope: "GLOBAL",
          isActive: true,
        },
      });

      if (globalMOQ) {
        effectiveMOQ = globalMOQ.minQuantity;
      }
    }
  }

  // Validate quantity meets MOQ
  if (quantity < effectiveMOQ) {
    throw new ApiError(400, `Minimum order quantity is ${effectiveMOQ} units`);
  }

  // Check if item already exists in cart
  const existingCartItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productVariantId,
      cartItemType: "NORMAL",
    },
  });

  let cartItem;

  if (existingCartItem) {
    // Update quantity if item already exists
    const newQuantity = existingCartItem.quantity + parseInt(quantity);

    // Recheck stock with new quantity
    if (productVariant.quantity < newQuantity) {
      throw new ApiError(400, "Not enough stock available");
    }

    // Recheck MOQ with new quantity
    let effectiveMOQ = 1;
    const variantMOQ = await prisma.mOQSetting.findFirst({
      where: {
        scope: "VARIANT",
        variantId: productVariantId,
        isActive: true,
      },
    });

    if (variantMOQ) {
      effectiveMOQ = variantMOQ.minQuantity;
    } else {
      const productMOQ = await prisma.mOQSetting.findFirst({
        where: {
          scope: "PRODUCT",
          productId: productVariant.productId,
          isActive: true,
        },
      });

      if (productMOQ) {
        effectiveMOQ = productMOQ.minQuantity;
      } else {
        const globalMOQ = await prisma.mOQSetting.findFirst({
          where: {
            scope: "GLOBAL",
            isActive: true,
          },
        });

        if (globalMOQ) {
          effectiveMOQ = globalMOQ.minQuantity;
        }
      }
    }

    if (newQuantity < effectiveMOQ) {
      throw new ApiError(400, `Minimum order quantity is ${effectiveMOQ} units`);
    }

    cartItem = await prisma.cartItem.update({
      where: {
        id: existingCartItem.id,
      },
      data: {
        quantity: newQuantity,
      },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
            images: true,
          },
        },
      },
    });
  } else {
    // Create new cart item
    cartItem = await prisma.cartItem.create({
      data: {
        userId,
        productVariantId,
        quantity: parseInt(quantity),
        // Set explicitly so getUserCart's `cartItemType === "NORMAL"` filter always matches,
        // instead of relying on the schema default being applied.
        cartItemType: "NORMAL",
      },
      include: {
        productVariant: {
          include: {
            product: {
              include: {
                images: true,
              },
            },
            attributes: {
              include: {
                attributeValue: {
                  include: {
                    attribute: true,
                  },
                },
              },
            },
            images: true,
          },
        },
      },
    });
  }

  return res
    .status(200)
    .json(new ApiResponsive(200, cartItem, "Item added to cart successfully"));
});

// Update cart item quantity
export const updateCartItem = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    throw new ApiError(400, "Quantity must be at least 1");
  }

  // Check if cart item exists and belongs to user
  const existingCartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      userId,
    },
    include: {
      productVariant: true,
    },
  });

  if (!existingCartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  // Check stock availability
  if (existingCartItem.productVariant.quantity < quantity) {
    throw new ApiError(400, "Not enough stock available");
  }

  // Check MOQ (Minimum Order Quantity)
  let effectiveMOQ = 1;

  // Check variant MOQ
  const variantMOQ = await prisma.mOQSetting.findFirst({
    where: {
      scope: "VARIANT",
      variantId: existingCartItem.productVariantId,
      isActive: true,
    },
  });

  if (variantMOQ) {
    effectiveMOQ = variantMOQ.minQuantity;
  } else {
    // Check product MOQ
    const productMOQ = await prisma.mOQSetting.findFirst({
      where: {
        scope: "PRODUCT",
        productId: existingCartItem.productVariant.productId,
        isActive: true,
      },
    });

    if (productMOQ) {
      effectiveMOQ = productMOQ.minQuantity;
    } else {
      // Check global MOQ
      const globalMOQ = await prisma.mOQSetting.findFirst({
        where: {
          scope: "GLOBAL",
          isActive: true,
        },
      });

      if (globalMOQ) {
        effectiveMOQ = globalMOQ.minQuantity;
      }
    }
  }

  // Validate quantity meets MOQ
  if (quantity < effectiveMOQ) {
    throw new ApiError(400, `Minimum order quantity is ${effectiveMOQ} units`);
  }

  const updatedCartItem = await prisma.cartItem.update({
    where: {
      id: cartItemId,
    },
    data: {
      quantity: parseInt(quantity),
    },
    include: {
      productVariant: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          attributes: {
            include: {
              attributeValue: {
                include: {
                  attribute: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Calculate effective price based on new quantity
  const variant = updatedCartItem.productVariant;
  let effectivePrice = parseFloat(variant.salePrice || variant.price);
  let priceSource = "DEFAULT";
  let appliedSlab = null;

  // Get pricing slabs
  const variantSlabs = await prisma.pricingSlab.findMany({
    where: {
      variantId: variant.id,
    },
    orderBy: {
      minQty: "asc",
    },
  });

  const productSlabs = await prisma.pricingSlab.findMany({
    where: {
      productId: variant.productId,
      variantId: null,
    },
    orderBy: {
      minQty: "asc",
    },
  });

  const allSlabs = [...variantSlabs, ...productSlabs].sort((a, b) => a.minQty - b.minQty);

  // Find matching pricing slab for the new quantity
  for (const slab of allSlabs) {
    if (parseInt(quantity) >= slab.minQty && (slab.maxQty === null || parseInt(quantity) <= slab.maxQty)) {
      effectivePrice = parseFloat(slab.price);
      priceSource = slab.variantId ? "VARIANT_SLAB" : "PRODUCT_SLAB";
      appliedSlab = {
        id: slab.id,
        minQty: slab.minQty,
        maxQty: slab.maxQty,
        price: parseFloat(slab.price),
      };
      break;
    }
  }

  const itemTotal = effectivePrice * parseInt(quantity);

  // Format response with effective price
  const formattedItem = {
    id: updatedCartItem.id,
    quantity: updatedCartItem.quantity,
    price: effectivePrice,
    originalPrice: parseFloat(variant.salePrice || variant.price),
    subtotal: itemTotal,
    priceSource,
    appliedSlab,
  };

  return res
    .status(200)
    .json(
      new ApiResponsive(200, formattedItem, "Cart item updated successfully")
    );
});

// Remove item from cart
export const removeFromCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { cartItemId } = req.params;

  // Check if cart item exists and belongs to user
  const existingCartItem = await prisma.cartItem.findFirst({
    where: {
      id: cartItemId,
      userId,
    },
  });

  if (!existingCartItem) {
    throw new ApiError(404, "Cart item not found");
  }

  await prisma.cartItem.delete({
    where: {
      id: cartItemId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, {}, "Item removed from cart successfully"));
});

// Add bundle to cart
export const addBundleToCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { bundleCampaignId, selectedProductIds = [] } = req.body;

  if (!bundleCampaignId) {
    throw new ApiError(400, "Bundle campaign ID is required");
  }

  if (!selectedProductIds || selectedProductIds.length === 0) {
    throw new ApiError(400, "At least one product must be selected");
  }

  // Fetch bundle campaign with rule and pricing slabs
  const campaign = await prisma.bundleCampaign.findUnique({
    where: { id: bundleCampaignId },
    include: {
      rule: true,
      pricingSlabs: { orderBy: { itemCount: "asc" } },
    },
  });

  if (!campaign) {
    throw new ApiError(404, "Bundle campaign not found");
  }

  if (!campaign.isActive) {
    throw new ApiError(400, "Bundle campaign is not active");
  }

  // Check date range
  const now = new Date();
  if (campaign.startDate && campaign.startDate > now) {
    throw new ApiError(400, "Bundle campaign has not started yet");
  }
  if (campaign.endDate && campaign.endDate < now) {
    throw new ApiError(400, "Bundle campaign has expired");
  }

  if (!campaign.rule) {
    throw new ApiError(400, "Bundle campaign has no rules configured");
  }

  // Validate min/max items
  const rule = campaign.rule;
  if (selectedProductIds.length < rule.minItems) {
    throw new ApiError(
      400,
      `Minimum ${rule.minItems} products required for this bundle`
    );
  }
  if (rule.maxItems && selectedProductIds.length > rule.maxItems) {
    throw new ApiError(
      400,
      `Maximum ${rule.maxItems} products allowed for this bundle`
    );
  }

  // Validate selected products match rules
  const where = {
    id: { in: selectedProductIds },
    isActive: true,
  };

  const conditions = [];

  if (rule.productIds && rule.productIds.length > 0) {
    conditions.push({ id: { in: rule.productIds } });
  }

  if (rule.categoryIds && rule.categoryIds.length > 0) {
    conditions.push({
      categories: { some: { categoryId: { in: rule.categoryIds } } },
    });
  }

  if (rule.subcategoryIds && rule.subcategoryIds.length > 0) {
    conditions.push({
      subCategories: {
        some: { subcategoryId: { in: rule.subcategoryIds } },
      },
    });
  }

  if (rule.brandIds && rule.brandIds.length > 0) {
    conditions.push({ brandId: { in: rule.brandIds } });
  }

  if (rule.attributeValueIds && rule.attributeValueIds.length > 0) {
    conditions.push({
      variants: {
        some: {
          attributeValues: {
            some: { attributeValueId: { in: rule.attributeValueIds } },
          },
        },
      },
    });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const validProducts = await prisma.product.findMany({
    where,
    select: { id: true },
  });

  const validProductIds = validProducts.map((p) => p.id);
  const invalidProducts = selectedProductIds.filter(
    (id) => !validProductIds.includes(id)
  );

  if (invalidProducts.length > 0) {
    throw new ApiError(
      400,
      "Some selected products do not match bundle rules"
    );
  }

  // Calculate actual price and validate stock (sum of all product prices)
  const products = await prisma.product.findMany({
    where: { id: { in: selectedProductIds } },
    include: {
      variants: {
        take: 1,
        select: { id: true, price: true, salePrice: true, quantity: true, isActive: true },
      },
    },
  });

  let actualPrice = 0;
  for (const product of products) {
    const variant = product.variants[0];
    if (variant) {
      if (!variant.isActive || variant.quantity < 1) {
        throw new ApiError(
          400,
          `"${product.name}" is currently out of stock`
        );
      }
      actualPrice += parseFloat(variant.salePrice || variant.price);
    }
  }

  // Find bundle price from pricing slabs
  const itemCount = selectedProductIds.length;
  const matchingSlab = campaign.pricingSlabs.find(
    (s) => s.itemCount === itemCount
  );

  let bundlePrice;
  if (matchingSlab) {
    bundlePrice = parseFloat(matchingSlab.price);
  } else if (campaign.bundlePrice) {
    bundlePrice = parseFloat(campaign.bundlePrice);
  } else {
    throw new ApiError(
      400,
      `No pricing configured for ${itemCount} items in this bundle`
    );
  }

  const savings = actualPrice - bundlePrice;

  // Check if user already has this bundle in cart
  const existingBundle = await prisma.cartItem.findFirst({
    where: {
      userId,
      cartItemType: "BUNDLE",
      bundleCampaignId,
    },
  });

  let cartItem;

  if (existingBundle) {
    // Update existing bundle
    cartItem = await prisma.cartItem.update({
      where: { id: existingBundle.id },
      data: {
        quantity: 1,
        bundleData: {
          selectedProductIds,
          bundlePrice,
          actualPrice,
          savings,
        },
      },
    });
  } else {
    // Create new bundle cart item
    cartItem = await prisma.cartItem.create({
      data: {
        userId,
        cartItemType: "BUNDLE",
        bundleCampaignId,
        quantity: 1,
        bundleData: {
          selectedProductIds,
          bundlePrice,
          actualPrice,
          savings,
        },
      },
    });
  }

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        id: cartItem.id,
        cartItemType: "BUNDLE",
        bundleCampaign: {
          id: campaign.id,
          title: campaign.title,
          slug: campaign.slug,
        },
        bundleData: {
          selectedProductIds,
          bundlePrice,
          actualPrice,
          savings,
        },
      },
      "Bundle added to cart successfully"
    )
  );
});

// Clear cart
export const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.cartItem.deleteMany({
    where: {
      userId,
    },
  });

  return res
    .status(200)
    .json(new ApiResponsive(200, {}, "Cart cleared successfully"));
});

// Validate cart before checkout - checks product availability, stock, bundle validity, coupon validity
export const validateCartForCheckout = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { couponId } = req.body;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      productVariant: {
        include: {
          product: true,
        },
      },
      bundleCampaign: {
        include: {
          pricingSlabs: { orderBy: { itemCount: "asc" } },
        },
      },
    },
  });

  if (!cartItems.length) {
    throw new ApiError(400, "Cart is empty");
  }

  const errors = [];
  let subTotal = 0;

  const normalItems = cartItems.filter(
    (item) => item.cartItemType === "NORMAL" || !item.cartItemType
  );
  const bundleItems = cartItems.filter(
    (item) => item.cartItemType === "BUNDLE"
  );

  // Validate normal items
  for (const item of normalItems) {
    const variant = item.productVariant;
    const product = variant?.product;

    if (!product) {
      errors.push(`Cart item references a product that no longer exists`);
      continue;
    }

    if (product.isDeleted) {
      errors.push(`"${product.name}" has been removed from the store`);
      continue;
    }

    if (!product.isActive) {
      errors.push(`"${product.name}" is currently unavailable`);
      continue;
    }

    if (variant.quantity < item.quantity) {
      errors.push(`Not enough stock for "${product.name}" (only ${variant.quantity} available)`);
      continue;
    }

    const price = parseFloat(variant.salePrice || variant.price);
    subTotal += price * item.quantity;
  }

  // Validate bundle items
  for (const item of bundleItems) {
    const campaign = item.bundleCampaign;

    if (!campaign) {
      errors.push("Bundle campaign no longer exists");
      continue;
    }

    if (campaign.isDeleted) {
      errors.push("This bundle has been removed from the store");
      continue;
    }

    if (!campaign.isActive) {
      errors.push(`Bundle "${campaign.title}" is no longer active`);
      continue;
    }

    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      errors.push(`Bundle "${campaign.title}" has not started yet`);
      continue;
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      errors.push(`Bundle "${campaign.title}" has expired`);
      continue;
    }

    const bundleData = item.bundleData || {};
    const selectedProductIds = bundleData.selectedProductIds || [];

    // Check bundle products exist, are active, not deleted
    const bundleProducts = await prisma.product.findMany({
      where: { id: { in: selectedProductIds } },
    });

    for (const pid of selectedProductIds) {
      const p = bundleProducts.find((bp) => bp.id === pid);
      if (!p) {
        errors.push("A product in the bundle no longer exists");
      } else if (p.isDeleted) {
        errors.push(`"${p.name}" in the bundle has been removed`);
      } else if (!p.isActive) {
        errors.push(`"${p.name}" in the bundle is currently unavailable`);
      }
    }

    // Verify pricing slab still matches
    const itemCount = selectedProductIds.length;
    const matchingSlab = campaign.pricingSlabs.find(
      (s) => s.itemCount === itemCount
    );
    if (!matchingSlab && !campaign.bundlePrice) {
      errors.push(`No pricing configured for ${itemCount} items in bundle "${campaign.title}"`);
    }

    if (matchingSlab) {
      subTotal += parseFloat(matchingSlab.price);
    } else if (campaign.bundlePrice) {
      subTotal += parseFloat(campaign.bundlePrice);
    }
  }

  // Validate coupon if provided
  if (couponId) {
    const coupon = await prisma.coupon.findUnique({
      where: { id: couponId },
    });

    if (!coupon || coupon.isDeleted) {
      errors.push("The applied coupon is no longer valid");
    } else if (!coupon.isActive) {
      errors.push("The applied coupon has been deactivated");
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, "Cart validation failed", errors);
  }

  return res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { valid: true, subTotal, itemCount: cartItems.length },
        "Cart is valid for checkout"
      )
    );
});
