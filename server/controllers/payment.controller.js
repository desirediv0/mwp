import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";
import { notifyAdmin } from "../utils/notify.js";
import { autoSyncOrder, autoRefundOrder } from "../utils/quickbooks.js";
import { sendMetaPurchase } from "../utils/metaCapi.js";
import { getOrderConfirmationTemplate, getAdminNewOrderTemplate, getOrderCancelledTemplate, getAdminOrderCancelledTemplate } from "../email/temp/EmailTemplate.js";
import { getFileUrl } from "../utils/deleteFromS3.js";
import { getPrimaryProductImage } from "../utils/product-image.js";
import { processReferralReward } from "./referral.controller.js";
import { resolveSelectedRate, autoBookLabel, voidLabelForOrder } from "../utils/shipping.js";
import { getStripeContext, mapStripeCardMethod, refundStripePayment } from "../utils/stripe.js";
import { validateUsAddress } from "../utils/usValidation.js";
import { fulfillSubscriptionSession } from "../utils/subscriptions.js";

// -----------------------------------------------------------------------------
// Payments run on Stripe (Checkout Sessions, USD only). Keys are saved by the admin
// in Payment Gateway Settings.
// -----------------------------------------------------------------------------

// Public: what the checkout page may offer
export const getPaymentSettings = asyncHandler(async (req, res) => {
  let paymentSettings = await prisma.paymentSettings.findFirst();

  if (!paymentSettings) {
    paymentSettings = await prisma.paymentSettings.create({
      data: { cashEnabled: false, razorpayEnabled: false, stripeEnabled: false, codCharge: 0 },
    });
  }

  const stripeSettings = await prisma.paymentGatewaySetting.findFirst({
    where: { gateway: "STRIPE", isActive: true, stripeSecretKey: { not: null } },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        stripeEnabled: paymentSettings.stripeEnabled && !!stripeSettings,
        currency: "USD",
      },
      "Payment settings fetched successfully"
    )
  );
});

// Validates the user's cart and prices it on the server (also used for shipping quotes).
export async function priceCart(userId, couponId = null) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      productVariant: {
        include: { product: true },
      },
      bundleCampaign: {
        include: { pricingSlabs: { orderBy: { itemCount: "asc" } } },
      },
    },
  });

  if (!cartItems.length) {
    throw new ApiError(400, "Cart is empty");
  }

  const normalItems = cartItems.filter((item) => item.cartItemType === "NORMAL" || !item.cartItemType);
  const bundleItems = cartItems.filter((item) => item.cartItemType === "BUNDLE");

  let subTotal = 0;

  // Validate and recalculate normal items
  for (const item of normalItems) {
    const product = item.productVariant?.product;
    if (!product) throw new ApiError(400, "A product in your cart no longer exists");
    if (product.isDeleted) throw new ApiError(400, `"${product.name}" has been removed from the store`);
    if (!product.isActive) throw new ApiError(400, `"${product.name}" is currently unavailable`);
    if (item.productVariant.quantity < item.quantity) {
      throw new ApiError(400, `Not enough stock for "${product.name}"`);
    }
    const price = parseFloat(item.productVariant.salePrice || item.productVariant.price);
    subTotal += price * item.quantity;
  }

  // Validate and recalculate bundle items
  for (const item of bundleItems) {
    const campaign = item.bundleCampaign;
    if (!campaign || campaign.isDeleted) throw new ApiError(400, "A bundle in your cart is no longer available");
    if (!campaign.isActive) throw new ApiError(400, `Bundle "${campaign.title}" is no longer active`);

    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      throw new ApiError(400, `Bundle "${campaign.title}" has not started yet`);
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      throw new ApiError(400, `Bundle "${campaign.title}" has expired`);
    }

    const bundleData = item.bundleData || {};
    const selectedProductIds = bundleData.selectedProductIds || [];
    const itemCount = selectedProductIds.length;

    const bundleProducts = await prisma.product.findMany({ where: { id: { in: selectedProductIds } } });
    for (const pid of selectedProductIds) {
      const p = bundleProducts.find((bp) => bp.id === pid);
      if (!p) throw new ApiError(400, "A product in a bundle no longer exists");
      if (p.isDeleted) throw new ApiError(400, `"${p.name}" in a bundle has been removed`);
      if (!p.isActive) throw new ApiError(400, `"${p.name}" in a bundle is unavailable`);
    }

    const matchingSlab = campaign.pricingSlabs.find((s) => s.itemCount === itemCount);
    if (matchingSlab) {
      subTotal += parseFloat(matchingSlab.price);
    } else if (campaign.bundlePrice) {
      subTotal += parseFloat(campaign.bundlePrice);
    } else {
      throw new ApiError(400, `No pricing for ${itemCount} items in bundle "${campaign.title}"`);
    }
  }

  // Validate coupon
  let discountAmount = 0;
  if (couponId) {
    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
    if (!coupon || coupon.isDeleted || !coupon.isActive) {
      throw new ApiError(400, "The applied coupon is no longer valid");
    }
    if (coupon.discountType === "PERCENTAGE") {
      let pct = parseFloat(coupon.discountValue);
      if (pct > 90 || coupon.isDiscountCapped) pct = Math.min(pct, 90);
      discountAmount = (subTotal * pct) / 100;
    } else {
      discountAmount = Math.min(parseFloat(coupon.discountValue), subTotal);
    }
  }

  // Items as the carrier needs them: weight (lb) and size (in), per variant
  const parcelItems = [
    ...normalItems.map((item) => ({
      qty: item.quantity,
      weightLb: item.productVariant?.shippingWeight || null,
      lengthIn: item.productVariant?.shippingLength || null,
      widthIn: item.productVariant?.shippingBreadth || null,
      heightIn: item.productVariant?.shippingHeight || null,
    })),
    ...bundleItems.map((item) => ({ qty: Math.max((item.bundleData?.selectedProductIds || []).length, 1) })),
  ];

  return { cartItems, normalItems, bundleItems, subTotal, discountAmount, parcelItems };
}

// Start a Stripe Checkout Session for the user's cart and return the hosted payment URL
export const checkout = asyncHandler(async (req, res) => {
  const currency = "USD";
  if (req.body.currency && String(req.body.currency).toUpperCase() !== currency) {
    throw new ApiError(400, "Checkout currency must be USD");
  }
  const {
    couponCode,
    couponId,
    shippingAddressId,
    billingAddressSameAsShipping = true,
    billingAddress,
    notes,
    shipmentId,
    rateId,
  } = req.body;
  const userId = req.user.id;

  if (!shippingAddressId) throw new ApiError(400, "Shipping address is required");
  const address = await prisma.address.findFirst({ where: { id: shippingAddressId, userId } });
  if (!address) throw new ApiError(404, "Shipping address not found");
  const usAddress = validateUsAddress(address);
  if (usAddress.errors) {
    throw new ApiError(400, `Please update your shipping address: ${Object.values(usAddress.errors)[0]}`);
  }

  const { stripe, settings } = await getStripeContext();

  const { cartItems, normalItems, subTotal, discountAmount } = await priceCart(userId, couponId);

  // Shipping: the option the customer picked, re-checked with the carrier
  const chosen = await resolveSelectedRate({ shipmentId, rateId, address, subTotal });
  const shippingCost = chosen.customerPrice;

  const finalAmount = Math.max(subTotal + shippingCost - discountAmount, 1);
  const amountInCents = Math.round(parseFloat(finalAmount.toFixed(2)) * 100);

  const itemCountTotal = cartItems.reduce((n, i) => n + (i.quantity || 1), 0);
  const names = normalItems.map((i) => i.productVariant?.product?.name).filter(Boolean);
  const description =
    [[...new Set(names)].join(", "), `Shipping: ${chosen.carrier} ${chosen.service}`].filter(Boolean).join(" | ").slice(0, 400) || undefined;

  const base = (req.headers.origin || process.env.FRONTEND_URL || "").split(",")[0].replace(/\/$/, "");
  if (!base) throw new ApiError(500, "Site URL is not configured");

  // Only one open payment page per customer: close any earlier unpaid ones so the same cart
  // can never be paid twice (e.g. checkout opened in two tabs).
  const openSessions = await prisma.stripePayment.findMany({
    where: { userId, orderId: null, status: "PENDING", createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    select: { id: true, sessionId: true },
  });
  for (const old of openSessions) {
    try {
      await stripe.checkout.sessions.expire(old.sessionId);
      await prisma.stripePayment.update({ where: { id: old.id }, data: { status: "FAILED", failureReason: "Replaced by a newer checkout" } });
    } catch {
      // already paid or already closed: leave it, the webhook / success page will settle it
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    customer_email: req.user.email || undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: amountInCents,
          product_data: {
            name: `MWP Supplements order (${itemCountTotal} ${itemCountTotal === 1 ? "item" : "items"})`,
            description,
          },
        },
      },
    ],
    metadata: { userId },
    payment_intent_data: { metadata: { userId } },
    success_url: `${base}/checkout?stripe_session={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/checkout?canceled=1`,
  });

  await prisma.stripePayment.create({
    data: {
      sessionId: session.id,
      userId,
      amount: finalAmount.toFixed(2),
      currency,
      status: "PENDING",
      checkoutPayload: {
        shippingAddressId,
        billingAddressSameAsShipping,
        billingAddress: billingAddress || null,
        couponCode: couponCode || null,
        couponId: couponId || null,
        discountAmount,
        shippingCost,
        shipment: {
          shipmentId: chosen.shipmentId,
          rateId: chosen.rateId,
          carrier: chosen.carrier,
          service: chosen.service,
          rateCost: chosen.rateCost,
        },
        subTotal,
        notes: notes || null,
        paymentMode: settings.mode,
        paymentOwnerId: settings.userId,
      },
    },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      { url: session.url, sessionId: session.id, serverCalculatedAmount: finalAmount, shippingCost },
      "Checkout session created"
    )
  );
});

// The success page calls this with the session id Stripe sent the customer back with
export const confirmStripePayment = asyncHandler(async (req, res) => {
  const sessionId = req.body.sessionId || req.body.session_id;
  if (!sessionId) throw new ApiError(400, "Missing checkout session");

  const { stripe } = await getStripeContext();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const result = await fulfillStripeSession(session, req.user.id);

  // Numbers the browser needs for its purchase tracking event
  const full = await prisma.order.findUnique({
    where: { id: result.order.id },
    include: { items: { include: { variant: { select: { sku: true } }, product: { select: { name: true } } } } },
  });
  const analytics = full
    ? {
        value: parseFloat(full.total),
        tax: parseFloat(full.tax),
        shipping: parseFloat(full.shippingCost),
        coupon: full.couponCode || undefined,
        items: full.items.map((i) => ({
          item_id: i.variant?.sku || i.variantId,
          item_name: i.productSnapshot?.name || i.product?.name,
          price: parseFloat(i.price),
          quantity: i.quantity,
        })),
      }
    : null;

  res.status(200).json(
    new ApiResponsive(
      200,
      { orderId: result.order.id, orderNumber: result.order.orderNumber, paymentId: result.payment.id, analytics },
      "Payment confirmed and order created successfully"
    )
  );
});

// Stripe -> server webhook (raw body, signature verified). Creates the order even if the
// customer closes the browser right after paying.
export const stripeWebhook = async (req, res) => {
  let event;
  try {
    const { stripe, webhookSecret, settings } = await getStripeContext();
    if (!webhookSecret) return res.status(400).send("Stripe webhook secret is not configured");
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], webhookSecret);
    // A test-mode event must never create a live order (or the other way round)
    if (typeof event.livemode === "boolean" && settings?.mode && event.livemode !== (settings.mode === "LIVE")) {
      return res.status(200).send("Ignored: event mode does not match the saved Stripe mode");
    }
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (event.data.object.metadata?.kind === "subscription") await fulfillSubscriptionSession(event.data.object);
      else await fulfillStripeSession(event.data.object);
    } else if (event.type === "checkout.session.expired") {
      await prisma.stripePayment.updateMany({
        where: { sessionId: event.data.object.id, orderId: null, status: "PENDING" },
        data: { status: "FAILED", failureReason: "Checkout session expired" },
      });
    }
  } catch (err) {
    console.error("Stripe webhook handling error:", err.message);
    if (!err.cartChanged) return res.status(500).send("Webhook handler failed");
  }

  res.json({ received: true });
};

// Turns a PAID Stripe Checkout Session into an order. Safe to call more than once: the
// success page and the webhook both call it, the first call creates the order and any later
// call just returns it.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function loadFulfilled(stripePayment) {
  const order = await prisma.order.findUnique({ where: { id: stripePayment.orderId } });
  return { order, payment: stripePayment, alreadyProcessed: true };
}

export async function fulfillStripeSession(session, expectedUserId = null) {
  const stripePayment = await prisma.stripePayment.findUnique({ where: { sessionId: session.id } });
  if (!stripePayment) throw new ApiError(404, "Checkout session not found");

  const userId = stripePayment.userId;
  if (expectedUserId && expectedUserId !== userId) {
    throw new ApiError(403, "This payment belongs to another account");
  }

  if (stripePayment.orderId) return loadFulfilled(stripePayment);
  if (session.payment_status !== "paid") throw new ApiError(400, "Payment has not been completed");
  if (session.currency && String(session.currency).toLowerCase() !== "usd") {
    throw new ApiError(400, "Payment currency must be USD");
  }
  const savedMode = stripePayment.checkoutPayload?.paymentMode;
  if (typeof session.livemode === "boolean" && savedMode && session.livemode !== (savedMode === "LIVE")) {
    throw new ApiError(409, "This payment was made in a different Stripe mode than the one it was started in");
  }

  // Claim the session so the webhook and the success page can never create two orders.
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;
  const claim = await prisma.stripePayment.updateMany({
    where: {
      id: stripePayment.id,
      orderId: null,
      OR: [
        { status: { in: ["PENDING", "FAILED"] } },
        // a previous attempt that died half-way (server restart) can be retried after 2 minutes
        { status: "AUTHORIZED", updatedAt: { lt: new Date(Date.now() - 2 * 60 * 1000) } },
      ],
    },
    data: { status: "AUTHORIZED", paymentIntentId },
  });
  if (claim.count === 0) {
    for (let i = 0; i < 20; i++) {
      await wait(500);
      const again = await prisma.stripePayment.findUnique({ where: { id: stripePayment.id } });
      if (again?.orderId) return loadFulfilled(again);
    }
    throw new ApiError(409, "Your payment is being processed. Please refresh in a moment.");
  }
  session.payment_intent = paymentIntentId;

  const payload = stripePayment.checkoutPayload || {};
  const {
    shippingAddressId,
    billingAddressSameAsShipping = true,
    billingAddress,
    couponCode: requestCouponCode,
    couponId: requestCouponId,
    discountAmount: requestDiscount,
    notes,
  } = payload;
  const paymentGateway = "STRIPE";
  const paymentMode = payload.paymentMode || "TEST";
  const paymentOwnerId = payload.paymentOwnerId || userId;
  const paymentMethod = mapStripeCardMethod(session);

  try {
    if (!shippingAddressId) throw new ApiError(400, "Shipping address is required");

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        productVariant: {
          include: {
            images: true,
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                pricingSlabs: {
                  orderBy: { minQty: 'desc' }
                }
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
            pricingSlabs: {
              orderBy: { minQty: 'desc' }
            }
          },
        },
        bundleCampaign: {
          include: {
            pricingSlabs: {
              orderBy: { itemCount: 'asc' }
            }
          }
        },
      },
    });

    // Separate normal and bundle items
    const normalCartItems = cartItems.filter(
      (item) => item.cartItemType === "NORMAL" || !item.cartItemType
    );
    const bundleCartItems = cartItems.filter(
      (item) => item.cartItemType === "BUNDLE"
    );

    if (!cartItems.length) {
      throw new ApiError(400, "No items in cart");
    }

    // Check if user has an active coupon
    const userCoupon = await prisma.userCoupon.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        coupon: true,
      },
    });

    // Verify shipping address
    const shippingAddress = await prisma.address.findFirst({
      where: {
        id: shippingAddressId,
        userId,
      },
    });

    if (!shippingAddress) {
      throw new ApiError(404, "Shipping address not found");
    }

    // Calculate order totals
    let subTotal = 0;
    let tax = 0; // Tax is now set to 0
    let shippingCost = 0;
    let discount = 0;
    let couponCode = null;
    let couponId = null;

    // Helper to calculate effective price based on quantity (Slab Pricing)
    const calculateSlabPrice = (variant, quantity) => {
      const qty = parseInt(quantity);

      // 1. Check variant specific slabs
      if (variant.pricingSlabs && variant.pricingSlabs.length > 0) {
        // Since we ordered by desc in query, we can find the first match
        const match = variant.pricingSlabs.find(slab =>
          qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)
        );
        if (match) return parseFloat(match.price);
      }

      // 2. Check product specific slabs
      if (variant.product.pricingSlabs && variant.product.pricingSlabs.length > 0) {
        const match = variant.product.pricingSlabs.find(slab =>
          qty >= slab.minQty && (slab.maxQty === null || qty <= slab.maxQty)
        );
        if (match) return parseFloat(match.price);
      }

      // 3. Fallback to default price
      return parseFloat(variant.salePrice || variant.price);
    };

    // Check inventory and calculate totals
    for (const item of normalCartItems) {
      const variant = item.productVariant;
      const price = calculateSlabPrice(variant, item.quantity);
      const itemTotal = price * item.quantity;
      subTotal += itemTotal;

      // Check stock availability
      if (variant.quantity < item.quantity) {
        throw new ApiError(400, `Not enough stock for ${variant.product.name}`);
      }
    }

    // Process bundle items - recalculate price server-side
    const processedBundles = [];
    for (const item of bundleCartItems) {
      const bundleData = item.bundleData || {};
      const campaign = item.bundleCampaign;

      if (!campaign || !campaign.isActive) {
        throw new ApiError(400, `Bundle campaign is not active`);
      }

      const selectedProductIds = bundleData.selectedProductIds || [];
      const itemCount = selectedProductIds.length;

      // Find matching slab
      const matchingSlab = campaign.pricingSlabs.find(
        (s) => s.itemCount === itemCount
      );

      let bundlePrice;
      if (matchingSlab) {
        bundlePrice = parseFloat(matchingSlab.price);
      } else if (campaign.bundlePrice) {
        bundlePrice = parseFloat(campaign.bundlePrice);
      } else {
        throw new ApiError(400, `No pricing configured for ${itemCount} items in bundle`);
      }

      // Calculate actual price from products
      const products = await prisma.product.findMany({
        where: { id: { in: selectedProductIds } },
        include: {
          variants: { take: 1, select: { price: true, salePrice: true, id: true } },
        },
      });

      let actualPrice = 0;
      for (const product of products) {
        const variant = product.variants[0];
        if (variant) {
          actualPrice += parseFloat(variant.salePrice || variant.price);
        }
      }

      subTotal += bundlePrice;
      processedBundles.push({
        item,
        campaign,
        selectedProductIds,
        bundlePrice,
        actualPrice,
        savings: actualPrice - bundlePrice,
        products,
      });
    }

    // Shipping was priced at checkout; the amount the customer was charged is applied below

    // Apply coupon discount if available
    if (userCoupon && userCoupon.coupon) {
      couponCode = userCoupon.coupon.code;
      couponId = userCoupon.coupon.id;

      // Calculate discount based on coupon type
      if (userCoupon.coupon.discountType === "PERCENTAGE") {
        // Calculate percentage discount with cap if needed
        let discountPercentage = parseFloat(userCoupon.coupon.discountValue);

        if (discountPercentage > 90 || userCoupon.coupon.isDiscountCapped) {
          discountPercentage = Math.min(discountPercentage, 90);
        }

        discount = (subTotal * discountPercentage) / 100;
      } else {
        // Fixed amount discount, not exceeding subtotal
        discount = Math.min(
          parseFloat(userCoupon.coupon.discountValue),
          subTotal
        );
      }

      // After successful order, deactivate the coupon for this user
      // We'll do this in the transaction to ensure it only happens if order is created
    }
    // No active user coupon: fall back to the coupon info saved when checkout started
    else {
      try {
        if (requestCouponCode || requestCouponId || requestDiscount) {
          if (requestCouponCode) couponCode = requestCouponCode;
          if (requestCouponId) couponId = requestCouponId;
          if (requestDiscount) discount = parseFloat(requestDiscount);
        }

        // If we have couponId but no couponCode or vice versa, try to get the missing information
        if (couponId && !couponCode) {
          const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
          if (coupon) couponCode = coupon.code;
        } else if (couponCode && !couponId) {
          const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
          if (coupon) couponId = coupon.id;
        }
      } catch (err) {
        console.log("Error processing coupon information:", err);
      }
    }

    // Use the exact shipping amount the customer was charged at checkout
    if (payload.shippingCost !== undefined && payload.shippingCost !== null) {
      shippingCost = parseFloat(payload.shippingCost || 0);
    }

    // Tax is 0% now
    tax = 0;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // The customer already paid in Stripe: make sure the cart still matches what they paid for.
    const expectedTotal = Math.max(subTotal + shippingCost - discount, 1);
    if (Math.abs(Math.round(expectedTotal * 100) - session.amount_total) > 1) {
      const changed = new ApiError(409, "Your cart changed while you were paying.");
      changed.cartChanged = true;
      throw changed;
    }

    // Create order and process payment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          orderNumber,
          currency: "USD",
          userId,
          subTotal: subTotal.toFixed(2),
          tax: tax.toFixed(2),
          shippingCost: shippingCost.toFixed(2),
          discount,
          paymentGateway,
          paymentMode,
          paymentOwnerId,
          total: (subTotal + shippingCost - discount).toFixed(2),
          shippingAddressId,
          shippingProvider: payload.shipment?.shipmentId ? "EASYPOST" : null,
          shipmentId: payload.shipment?.shipmentId || null,
          shipmentRateId: payload.shipment?.rateId || null,
          shippingCarrier: payload.shipment?.carrier || null,
          shippingService: payload.shipment?.service || null,
          shippingRateCost: payload.shipment?.rateCost ?? null,
          shippingStatus: payload.shipment?.shipmentId ? "awaiting_label" : null,
          shippingAddressSnapshot: {
            name: shippingAddress.name,
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: "US",
            phone: shippingAddress.phone,
          },
          billingAddressSameAsShipping,
          billingAddress: !billingAddressSameAsShipping
            ? billingAddress
            : undefined,
          notes,
          status: "PAID",
          paymentMethod: "STRIPE",
          couponCode,
          couponId: couponId,
        },
      });

      // If a coupon was used, mark it as inactive for this user
      if (userCoupon && userCoupon.coupon) {
        await tx.userCoupon.update({
          where: {
            id: userCoupon.id,
          },
          data: {
            isActive: false,
          },
        });

        // Update the coupon's used count
        await tx.coupon.update({
          where: {
            id: userCoupon.coupon.id,
          },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // 2. Complete the Stripe payment record
      const payment = await tx.stripePayment.update({
        where: { id: stripePayment.id },
        data: {
          orderId: order.id,
          status: "CAPTURED",
          paymentMethod,
          notes: {
            sessionId: session.id,
            paymentIntentId: session.payment_intent || null,
            amountTotal: session.amount_total,
            currency: session.currency,
            customerEmail: session.customer_details?.email || null,
          },
        },
      });

      // Note: Partner commissions will be created automatically when order status is updated to DELIVERED
      // This ensures partners only get paid after successful delivery, not just on payment

      // 3. Create order items and update inventory
      const orderItems = [];
      for (const item of normalCartItems) {
        const variant = item.productVariant;
        // Reuse the same helper from above
        let price = calculateSlabPrice(variant, item.quantity);
        let flashSaleInfo = null;

        // Check for active flash sale for this product
        const now = new Date();
        const flashSaleProduct = await tx.flashSaleProduct.findFirst({
          where: {
            productId: variant.product.id,
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
              },
            },
          },
        });

        // Apply flash sale discount if applicable
        if (flashSaleProduct) {
          const priceBeforeFlashSale = price;
          const discountAmount = (price * flashSaleProduct.flashSale.discountPercentage) / 100;
          price = Math.round((price - discountAmount) * 100) / 100;
          flashSaleInfo = {
            flashSaleId: flashSaleProduct.flashSale.id,
            flashSaleName: flashSaleProduct.flashSale.name,
            flashSaleDiscount: flashSaleProduct.flashSale.discountPercentage,
            originalPrice: priceBeforeFlashSale,
          };

          // Increment sold count for the flash sale
          await tx.flashSale.update({
            where: { id: flashSaleProduct.flashSale.id },
            data: { soldCount: { increment: item.quantity } },
          });
        }

        const subtotal = price * item.quantity;

        // Create immutable product snapshot
        const primaryImageUrl = getPrimaryProductImage(variant);
        const productSnapshot = {
          name: variant.product.name,
          slug: variant.product.slug,
          image: primaryImageUrl ? getFileUrl(primaryImageUrl) : null,
          sku: variant.sku,
          brand: variant.product.brand ? { id: variant.product.brand.id, name: variant.product.brand.name } : null,
          categories: (variant.product.categories || []).map(pc => ({ id: pc.categoryId, name: pc.category?.name })),
          variantAttributes: variant.attributes?.map(a => ({
            name: a.attributeValue?.attribute?.name,
            value: a.attributeValue?.value,
          })) || [],
          originalPrice: parseFloat(variant.price),
          salePrice: variant.salePrice ? parseFloat(variant.salePrice) : null,
          paidPrice: price,
        };

        // Create order item
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: variant.product.id,
            variantId: variant.id,
            price,
            quantity: item.quantity,
            subtotal,
            productSnapshot,
            ...(flashSaleInfo || {}),
          },
        });
        orderItems.push(orderItem);

        // Update inventory
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            quantity: {
              decrement: item.quantity,
            },
          },
        });

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            variantId: variant.id,
            quantityChange: -item.quantity,
            reason: "sale",
            referenceId: order.id,
            previousQuantity: variant.quantity,
            newQuantity: variant.quantity - item.quantity,
            createdBy: userId,
          },
        });
      }

      // 3b. Process bundle items
      for (const bundle of processedBundles) {
        const { item, campaign, selectedProductIds, bundlePrice, actualPrice, savings, products } = bundle;

        // Create OrderBundle record
        await tx.orderBundle.create({
          data: {
            orderId: order.id,
            bundleCampaignId: campaign.id,
            bundleName: campaign.title,
            bundlePrice,
            actualPrice,
            savings,
            selectedProducts: selectedProductIds.map((pid) => {
              const product = products.find((p) => p.id === pid);
              const variant = product?.variants[0];
              return {
                productId: pid,
                variantId: variant?.id,
                name: product?.name,
                price: parseFloat(variant?.salePrice || variant?.price || 0),
              };
            }),
          },
        });

        // Create individual OrderItems for each selected product and decrement inventory
        for (const product of products) {
          const variant = product.variants[0];
          if (!variant) continue;

          const productPrice = parseFloat(variant.salePrice || variant.price);

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: product.id,
              variantId: variant.id,
              price: productPrice,
              quantity: 1,
              subtotal: productPrice,
            },
          });

          // Decrement inventory
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { quantity: { decrement: 1 } },
          });

          // Log inventory change
          await tx.inventoryLog.create({
            data: {
              variantId: variant.id,
              quantityChange: -1,
              reason: "bundle_sale",
              referenceId: order.id,
              previousQuantity: variant.quantity,
              newQuantity: variant.quantity - 1,
              createdBy: userId,
            },
          });
        }
      }

      // 4. Clear the user's cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return { order, payment, orderItems };
    });

    // Process referral reward (outside transaction to avoid blocking)
    processReferralReward(result.order.id, userId).catch((err) => {
      console.error("Referral reward processing error:", err);
    });

    // Buy the shipping label right away when booking mode is AUTO (non-blocking; admin can retry)
    autoBookLabel(result.order.id);

    // Record the sale in QuickBooks (non-blocking; admin can retry from the order)
    autoSyncOrder(result.order.id);

    // Server-side Purchase event for Meta (deduplicated with the browser pixel by order id)
    sendMetaPurchase(result.order.id);

    // Send order confirmation email
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (user && user.email) {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: result.order.id },
          include: {
            product: true,
            variant: {
              include: {
                attributes: {
                  include: {
                    attributeValue: {
                      include: {
                        attribute: true
                      }
                    }
                  }
                },
                images: true
              },
            },
          },
        });

        // Format items for email
        const emailItems = orderItems.map((item) => ({
          name: item.product.name,
          variant: item.variant.attributes.map(attr =>
            `${attr.attributeValue.attribute.name}: ${attr.attributeValue.value}`
          ).join(", ") + (item.flashSaleName ? ` ⚡ ${item.flashSaleName}` : ""),
          quantity: item.quantity,
          price: parseFloat(item.price).toFixed(2),
          originalPrice: item.originalPrice ? parseFloat(item.originalPrice).toFixed(2) : null,
        }));

        // Send email
        await sendEmail({
          email: user.email,
          subject: `Order Confirmation - #${result.order.orderNumber}`,
          html: getOrderConfirmationTemplate({
            userName: user.name || "Valued Customer",
            orderNumber: result.order.orderNumber,
            orderDate: result.order.createdAt,
            paymentMethod: result.payment.paymentMethod || "Online",
            items: emailItems,
            subtotal: parseFloat(result.order.subTotal).toFixed(2),
            shipping: parseFloat(result.order.shippingCost || 0).toFixed(2),
            tax: parseFloat(result.order.tax || 0).toFixed(2),
            discount: parseFloat(result.order.discount || 0).toFixed(2),
            couponCode: result.order.couponCode || "",
            total: parseFloat(result.order.total).toFixed(2),
            shippingAddress: shippingAddress,
          }),
        });

        // Send admin notification email
        try {
          const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || process.env.STORE_EMAIL;
          if (adminEmail) {
            await sendEmail({
              email: adminEmail,
              subject: `🔔 New Order #${result.order.orderNumber} - $${parseFloat(result.order.total).toFixed(2)}`,
              html: getAdminNewOrderTemplate({
                orderNumber: result.order.orderNumber,
                customerName: user.name || "Guest",
                customerEmail: user.email,
                customerPhone: user.phone || "",
                orderDate: result.order.createdAt,
                paymentMethod: result.payment.paymentMethod || "Online",
                total: parseFloat(result.order.total).toFixed(2),
                items: emailItems,
                shippingAddress: shippingAddress,
              }),
            });
            console.log(`Admin notification email sent for order ${result.order.orderNumber}`);
          }
        } catch (adminEmailError) {
          console.error("Admin notification email error:", adminEmailError);
        }
      }
    } catch (emailError) {
      console.error("Order confirmation email error:", emailError);
      // Don't throw error, continue with response
    }

    return { order: result.order, payment: result.payment };
  } catch (error) {
    console.error("Stripe order fulfillment error:", error);

    let refunded = false;
    const done = await prisma.stripePayment.findFirst({ where: { id: stripePayment.id, orderId: { not: null } } });
    if (!done) {
      // The customer HAS paid. If the order cannot be created for a business reason (cart empty or
      // changed, out of stock, address removed...) give the money back; for unexpected errors keep the
      // payment open so the webhook retry / the success page can try again.
      const refundable =
        !!session.payment_intent && (error.cartChanged || (error.statusCode >= 400 && error.statusCode <= 404));
      if (refundable) {
        try {
          const latest = await prisma.stripePayment.findUnique({ where: { id: stripePayment.id } });
          await refundStripePayment(latest, parseFloat(latest.amount), "requested_by_customer");
          refunded = true;
          await prisma.stripePayment.update({
            where: { id: stripePayment.id },
            data: { failureReason: String(error.message || "Order could not be created. Payment refunded automatically.").slice(0, 300) },
          });
        } catch (refundError) {
          console.error("Automatic refund failed - refund manually in Stripe:", session.id, refundError.message);
        }
      } else {
        await prisma.stripePayment
          .update({ where: { id: stripePayment.id }, data: { status: "PENDING", failureReason: String(error.message || "").slice(0, 300) } })
          .catch(() => {});
      }
    }

    if (error.code === "P2002") {
      throw new ApiError(400, "Duplicate payment record");
    }

    const baseMessage = error.message || "Order could not be completed";
    const message = refunded ? `${baseMessage} Your card payment was refunded automatically.` : baseMessage;
    throw Object.assign(new ApiError(error.statusCode || 500, message), { cartChanged: !!error.cartChanged || refunded });
  }
}

// Get order history
export const getOrderHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get total count
  const totalOrders = await prisma.order.count({
    where: { userId },
  });

  // Get orders with pagination
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            include: {
              attributes: {
                include: {
                  attributeValue: {
                    include: {
                      attribute: true,
                    },
                  },
                },
              },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          returnRequests: {
            select: {
              id: true,
              status: true,
              reason: true,
              customReason: true,
              createdAt: true,
              processedAt: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      },
      tracking: true,
      stripePayment: {
        select: {
          paymentMethod: true,
          status: true,
          paymentIntentId: true,
        },
      },
      coupon: {
        select: {
          code: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip,
    take,
  });

  // Format response
  const formattedOrders = orders.map((order) => {
    // Ensure we use the original total without modifying it
    const originalTotal = parseFloat(order.total);

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      currency: order.currency,
      date: order.createdAt,
      status: order.status,
      // Use the original stored total
      total: originalTotal,
      subTotal: parseFloat(order.subTotal),
      shippingCost: parseFloat(order.shippingCost) || 0,
      tax: parseFloat(order.tax) || 0,
      discount: parseFloat(order.discount) || 0,
      couponCode: order.couponCode || null,
      couponDetails: order.coupon
        ? {
          code: order.coupon.code,
          discountType: order.coupon.discountType,
          discountValue: parseFloat(order.coupon.discountValue),
        }
        : null,
      paymentMethod: order.stripePayment?.paymentMethod || "ONLINE",
      paymentStatus: order.stripePayment?.status || order.status,
      items: order.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        name: item.product.name,
        image: item.product.images[0]
          ? getFileUrl(item.product.images[0].url)
          : null,
        slug: item.product.slug,
        // Extract all attributes dynamically
        attributes: (() => {
          if (!item.variant?.attributes) return {};
          const attributesMap = {};
          item.variant.attributes.forEach((vav) => {
            const attrName = vav.attributeValue?.attribute?.name;
            const attrValue = vav.attributeValue?.value;
            if (attrName && attrValue) {
              attributesMap[attrName] = attrValue;
            }
          });
          return attributesMap;
        })(),
        // Backward compatibility - keep color and size for existing code
        color: (() => {
          const colorAttr = item.variant?.attributes?.find(
            (attr) => attr.attributeValue?.attribute?.name === "Color"
          );
          return colorAttr?.attributeValue?.value || null;
        })(),
        size: (() => {
          const sizeAttr = item.variant?.attributes?.find(
            (attr) => attr.attributeValue?.attribute?.name === "Size"
          );
          return sizeAttr?.attributeValue?.value || null;
        })(),
        price: parseFloat(item.price),
        quantity: item.quantity,
        subtotal: parseFloat(item.subtotal),
        // Flash sale info
        flashSale: item.flashSaleId ? {
          id: item.flashSaleId,
          name: item.flashSaleName,
          discountPercentage: item.flashSaleDiscount,
          originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : null,
        } : null,
        // Include return request information
        returnRequest: item.returnRequests && item.returnRequests.length > 0
          ? {
            id: item.returnRequests[0].id,
            status: item.returnRequests[0].status,
            reason: item.returnRequests[0].reason,
            customReason: item.returnRequests[0].customReason,
            createdAt: item.returnRequests[0].createdAt,
            processedAt: item.returnRequests[0].processedAt,
          }
          : null,
      })),
      tracking: order.tracking
        ? {
          carrier: order.tracking.carrier,
          trackingNumber: order.tracking.trackingNumber,
          status: order.tracking.status,
          estimatedDelivery: order.tracking.estimatedDelivery,
        }
        : null,
    };
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        orders: formattedOrders,
        pagination: {
          total: totalOrders,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalOrders / parseInt(limit)),
        },
      },
      "Order history fetched successfully"
    )
  );
});

// Get order details by ID
export const getOrderDetails = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  // Get order with details
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          variant: {
            include: {
              attributes: {
                include: {
                  attributeValue: {
                    include: {
                      attribute: true,
                    },
                  },
                },
              },
              images: {
                where: { isPrimary: true },
                take: 1,
              },
            },
          },
          // Include return requests for each item
          returnRequests: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
      orderBundles: true,
      shippingAddress: true,
      tracking: {
        include: {
          updates: {
            orderBy: {
              timestamp: "desc",
            },
          },
        },
      },
      stripePayment: true,
      coupon: {
        select: {
          code: true,
          description: true,
          discountType: true,
          discountValue: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Format response - use original values to maintain historical pricing
  const formattedOrder = {
    id: order.id,
    orderNumber: order.orderNumber,
      currency: order.currency,
    date: order.createdAt,
    status: order.status,
    cancelReason: order.cancelReason || null,
    cancelledAt: order.cancelledAt || null,
    cancelledBy: order.cancelledBy || null,
    subTotal: parseFloat(order.subTotal),
    tax: parseFloat(order.tax),
    shippingCost: parseFloat(order.shippingCost),
    discount: parseFloat(order.discount) || 0,
    // Use the original total stored in the database to preserve historical pricing
    total: parseFloat(order.total),
    paymentMethod: order.stripePayment?.paymentMethod || "ONLINE",
    paymentId: order.stripePayment?.paymentIntentId,
    paymentStatus: order.stripePayment?.status || order.status,
    notes: order.notes,
    couponCode: order.couponCode,
    couponId: order.couponId,
    // Add detailed coupon information
    couponDetails: order.coupon
      ? {
        code: order.coupon.code,
        description: order.coupon.description,
        discountType: order.coupon.discountType,
        discountValue: parseFloat(order.coupon.discountValue),
      }
      : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      image: item.product.images[0]
        ? getFileUrl(item.product.images[0].url)
        : null,
      slug: item.product.slug,
      color: item.variant.color?.name,
      size: item.variant.size?.name || null,
      price: parseFloat(item.price),
      quantity: item.quantity,
      subtotal: parseFloat(item.subtotal),
      // Flash sale info
      flashSale: item.flashSaleId ? {
        id: item.flashSaleId,
        name: item.flashSaleName,
        discountPercentage: item.flashSaleDiscount,
        originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : null,
      } : null,
      // Include return request information
      returnRequest: item.returnRequests && item.returnRequests.length > 0
        ? {
          id: item.returnRequests[0].id,
          status: item.returnRequests[0].status,
          reason: item.returnRequests[0].reason,
          customReason: item.returnRequests[0].customReason,
          createdAt: item.returnRequests[0].createdAt,
          processedAt: item.returnRequests[0].processedAt,
        }
        : null,
    })),
    orderBundles: order.orderBundles ? order.orderBundles.map((bundle) => ({
      id: bundle.id,
      bundleName: bundle.bundleName,
      bundlePrice: parseFloat(bundle.bundlePrice),
      actualPrice: parseFloat(bundle.actualPrice),
      savings: parseFloat(bundle.savings),
      selectedProducts: bundle.selectedProducts || [],
    })) : [],
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddressSameAsShipping
      ? order.shippingAddress
      : order.billingAddress,
    tracking: order.tracking
      ? {
        carrier: order.tracking.carrier,
        trackingNumber: order.tracking.trackingNumber,
        status: order.tracking.status,
        estimatedDelivery: order.tracking.estimatedDelivery,
        updates: order.tracking.updates.map((update) => ({
          status: update.status,
          timestamp: update.timestamp,
          location: update.location,
          description: update.description,
        })),
      }
      : null,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        formattedOrder,
        "Order details fetched successfully"
      )
    );
});

// Cancel order
export const cancelOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const { reason } = req.body;

  if (!reason) {
    throw new ApiError(400, "Cancellation reason is required");
  }

  // Find order
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      userId,
    },
    include: {
      stripePayment: true,
      items: {
        include: {
          variant: true,
        },
      },
    },
  });

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  // Only allow cancellation for certain statuses (allow PAID if not yet shipped)
  const allowedStatuses = ["PENDING", "PROCESSING", "PAID"];
  if (!allowedStatuses.includes(order.status)) {
    throw new ApiError(400, "This order cannot be cancelled");
  }

  // Process cancellation in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update order status
    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "CANCELLED",
        cancelReason: reason,
        cancelledAt: new Date(),
        cancelledBy: userId,
      },
    });

    // 2. Return items to inventory
    for (const item of order.items) {
      // Update inventory
      await tx.productVariant.update({
        where: { id: item.variantId },
        data: {
          quantity: {
            increment: item.quantity,
          },
        },
      });

      // Log inventory change
      await tx.inventoryLog.create({
        data: {
          variantId: item.variantId,
          quantityChange: item.quantity,
          reason: "cancellation",
          referenceId: order.id,
          previousQuantity: item.variant.quantity,
          newQuantity: item.variant.quantity + item.quantity,
          createdBy: userId,
        },
      });
    }

  });

  // Refund the card payment through Stripe (outside the transaction; a failure is
  // recorded on the payment so an admin can retry from the order page).
  if (order.stripePayment?.paymentIntentId && order.stripePayment.status === "CAPTURED") {
    await refundStripePayment(order.stripePayment, parseFloat(order.total), "requested_by_customer").catch(async (err) => {
      console.error(`Stripe refund failed for order ${order.orderNumber}:`, err.message);
      await notifyAdmin(`Refund FAILED for cancelled order #${order.orderNumber}`, {
        title: "Refund needs attention",
        danger: true,
        paragraphs: ["The customer cancelled but the automatic Stripe refund failed. Please refund it from the Stripe dashboard."],
        rows: [["Order", `#${order.orderNumber}`], ["Amount", `${parseFloat(order.total).toFixed(2)}`], ["Error", err.message]],
      });
    });
  }

  // Record the refund in QuickBooks
  await autoRefundOrder(orderId);

  // Cancel the shipping label (the carrier refunds the postage) if one was bought and not scanned yet
  if (order.labelUrl) {
    try {
      await voidLabelForOrder(orderId);
    } catch (error) {
      console.error("Failed to cancel the shipping label:", error.message);
    }
  }

  // Send cancellation emails
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true },
    });

    // Send cancellation email to user
    if (user && user.email) {
      await sendEmail({
        email: user.email,
        subject: `Order #${order.orderNumber} Cancelled - ${process.env.STORE_NAME || "MWP Supplements"}`,
        html: getOrderCancelledTemplate({
          userName: user.name || "Customer",
          orderNumber: order.orderNumber,
      currency: order.currency,
          reason: reason || "Cancelled",
          refundAmount: order.stripePayment ? parseFloat(order.total) : null,
        }),
      });
      console.log(`Cancellation email sent to user ${user.email}`);
    }

    // Send cancellation notification to admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || process.env.STORE_EMAIL;
    if (adminEmail) {
      await sendEmail({
        email: adminEmail,
        subject: `❌ Order #${order.orderNumber} Cancelled by Customer`,
        html: getAdminOrderCancelledTemplate({
          orderNumber: order.orderNumber,
      currency: order.currency,
          customerName: user?.name || "Guest",
          customerEmail: user?.email || "No email",
          reason: reason || "No reason provided",
          total: parseFloat(order.total).toFixed(2),
          cancelledBy: "user",
        }),
      });
      console.log(`Admin cancellation notification sent for order ${order.orderNumber}`);
    }
  } catch (emailError) {
    console.error("Cancellation email error:", emailError);
  }

  res
    .status(200)
    .json(
      new ApiResponsive(200, { success: true }, "Order cancelled successfully")
    );
});

