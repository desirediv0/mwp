import jwt from "jsonwebtoken";
import { prisma } from "../config/db.js";
import { ApiError } from "./ApiError.js";
import { getStripeContext, refundStripePayment } from "./stripe.js";
import { quoteRates, autoBookLabel } from "./shipping.js";
import { autoSyncOrder } from "./quickbooks.js";
import { sendMetaPurchase } from "./metaCapi.js";
import { emailUser, notifyAdmin } from "./notify.js";
import { validateUsAddress } from "./usValidation.js";
import { getFileUrl } from "./deleteFromS3.js";
import { getPrimaryProductImage } from "./product-image.js";

// -----------------------------------------------------------------------------
// Subscribe & save: one product, billed every month.
//  - The first payment is a normal Stripe Checkout that also saves the card for later.
//  - Every month a job charges the saved card off-session and creates a normal order, so labels,
//    QuickBooks, stock and emails all work like any other order.
// -----------------------------------------------------------------------------

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const money = (n) => `$${Number(n).toFixed(2)}`;
const DAY = 24 * 60 * 60 * 1000;

const siteUrl = () => (process.env.FRONTEND_URL || "").split(",")[0].trim().replace(/\/$/, "");
export const manageUrl = () => `${siteUrl()}/account/subscriptions`;

const linkSecret = () => process.env.SUBSCRIPTION_LINK_SECRET || process.env.ACCESS_JWT_SECRET;

// Signed link for the email "Cancel subscription" button. Opening it only shows a confirm page;
// nothing is cancelled until the customer presses the button there.
export const manageToken = (subId) => jwt.sign({ sid: subId, purpose: "sub-manage" }, linkSecret(), { expiresIn: "90d" });
export const cancelLink = (sub) => `${siteUrl()}/subscription/manage?token=${encodeURIComponent(manageToken(sub.id))}`;
export function readManageToken(token) {
  try {
    const d = jwt.verify(token, linkSecret());
    return d.purpose === "sub-manage" ? d.sid : null;
  } catch {
    return null;
  }
}
const mailLinks = (sub) => [
  { text: "Cancel subscription", url: cancelLink(sub) },
  { text: "Manage in my account", url: manageUrl() },
];

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

// same day next month; Jan 31 -> Feb 28/29
export function addMonth(date) {
  const d = new Date(date);
  const day = d.getUTCDate();
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
  const lastDay = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate();
  next.setUTCDate(Math.min(day, lastDay));
  return next;
}

export async function getSubscriptionSettings() {
  let s = await prisma.subscriptionSettings.findFirst();
  if (!s) s = await prisma.subscriptionSettings.create({ data: {} });
  return s;
}

// What a subscriber pays per unit:
//  1. a price locked when they subscribed (fixed-price variants), else
//  2. the variant's fixed subscriber price, else
//  3. the regular price minus the global subscriber discount %
export const unitPriceFor = (variant, discountPercent, lockedUnitPrice = null) => {
  if (lockedUnitPrice != null) return round2(Number(lockedUnitPrice));
  if (variant.subscriptionPrice != null) return round2(Number(variant.subscriptionPrice));
  const base = parseFloat(variant.salePrice || variant.price);
  return round2(base * (1 - Number(discountPercent || 0) / 100));
};

const parcelFor = (variant, qty) => [
  {
    qty,
    weightLb: variant.shippingWeight || null,
    lengthIn: variant.shippingLength || null,
    widthIn: variant.shippingBreadth || null,
    heightIn: variant.shippingHeight || null,
  },
];

// Cheapest carrier option for one subscription shipment
export async function quoteShipping({ address, variant, qty, subTotal }) {
  const quote = await quoteRates({ address, subTotal, parcelItems: parcelFor(variant, qty) });
  const rate = [...quote.rates].sort((a, b) => a.price - b.price)[0];
  if (!rate) throw new ApiError(400, "No shipping option is available for this address");
  return {
    shipmentId: quote.shipmentId || null,
    rateId: rate.id,
    carrier: rate.carrier,
    service: rate.service,
    rateCost: rate.cost,
    customerPrice: rate.price,
  };
}

export async function loadSellable(variantId) {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } }, images: true },
  });
  if (!variant || !variant.product) throw new ApiError(404, "Product not found");
  if (variant.product.isDeleted || !variant.product.isActive) throw new ApiError(400, "This product is not available");
  return variant;
}

const snapshotFor = (variant) => {
  const img = getPrimaryProductImage(variant);
  return { name: variant.product.name, slug: variant.product.slug, sku: variant.sku, image: img ? getFileUrl(img) : null };
};

/* ------------------------------ emails ------------------------------ */

const describe = (sub, variant) => {
  const name = sub.productSnapshot?.name || variant?.product?.name || "your product";
  return `${name}${sub.quantity > 1 ? ` x ${sub.quantity}` : ""}`;
};

export const sendSubscriptionStarted = (sub, user, { price, shipping, total }) =>
  emailUser(user.email, "Your MWP Supplements subscription is active", {
    title: "Subscription active",
    accent: "Subscribe & save",
    greeting: `Hi ${user.name || "there"},`,
    paragraphs: [
      "Thank you for subscribing. Your first order is on its way. After that we ship and charge your card once a month until you cancel.",
      "You can skip a month or cancel any time from your account. No fees, no questions.",
    ],
    rows: [
      ["Product", describe(sub)],
      ["Price per shipment", `${money(price)} + ${money(shipping)} shipping`],
      ["First charge today", money(total)],
      ["Next charge", fmtDate(sub.nextBillingDate)],
    ],
    buttonText: "Manage subscription",
    buttonUrl: manageUrl(),
    links: mailLinks(sub),
  });

export const sendReminder = (sub, user, amount) =>
  emailUser(user.email, `Your subscription renews on ${fmtDate(sub.nextBillingDate)}`, {
    title: "Renewal reminder",
    accent: "Subscribe & save",
    greeting: `Hi ${user.name || "there"},`,
    paragraphs: [
      `Your monthly shipment of ${describe(sub)} renews on ${fmtDate(sub.nextBillingDate)}. We will charge your saved card then.`,
      "Need a break? You can skip this shipment or cancel before that date from your account.",
    ],
    rows: [
      ["Product", describe(sub)],
      ["Estimated charge", amount ? money(amount) : null],
      ["Charge date", fmtDate(sub.nextBillingDate)],
    ],
    buttonText: "Skip or cancel",
    buttonUrl: manageUrl(),
    links: mailLinks(sub),
  });

const sendRenewed = (sub, user, order, ctx = {}) =>
  emailUser(user.email, `Payment received: subscription order #${order.orderNumber}`, {
    title: "Payment received",
    accent: "Subscribe & save",
    greeting: `Hi ${user.name || "there"},`,
    paragraphs: [
      `We charged your saved card for this month's ${describe(sub)} and your order is being prepared.`,
      "You do not need to do anything. We will email you when it ships.",
    ],
    rows: [
      ["Order", `#${order.orderNumber}`],
      ["Product", describe(sub)],
      ["Items", ctx.subTotal != null ? money(ctx.subTotal) : null],
      ["Shipping", ctx.shipping != null ? (ctx.shipping > 0 ? money(ctx.shipping) : "Free") : null],
      ["Total charged", money(order.total)],
      ["Shipping to", ctx.address ? `${ctx.address.street}, ${ctx.address.city}, ${ctx.address.state} ${ctx.address.postalCode}` : null],
      ["Next charge", fmtDate(sub.nextBillingDate)],
    ],
    buttonText: "View subscription",
    buttonUrl: manageUrl(),
    links: mailLinks(sub),
  });

const sendFailed = (sub, user, reason, { willRetry, retryOn }) =>
  emailUser(user.email, "We could not renew your subscription", {
    title: "Payment problem",
    accent: "Subscribe & save",
    danger: true,
    greeting: `Hi ${user.name || "there"},`,
    paragraphs: willRetry
      ? [`We could not process the renewal for ${describe(sub)}. ${reason}`, `We will try again on ${fmtDate(retryOn)}. If your card has changed, cancel here and subscribe again with the new card.`]
      : [`We could not process the renewal for ${describe(sub)} after several tries, so your subscription has been cancelled. You were not charged.`, "You can subscribe again at any time."],
    rows: [["Product", describe(sub)]],
    buttonText: "Open my subscriptions",
    buttonUrl: manageUrl(),
    links: willRetry ? mailLinks(sub) : [],
  });

const sendUnavailable = (sub, user, reason) =>
  emailUser(user.email, "Your subscription was cancelled", {
    title: "Subscription cancelled",
    accent: "Subscribe & save",
    danger: true,
    greeting: `Hi ${user.name || "there"},`,
    paragraphs: [`We had to cancel your subscription for ${describe(sub)}. ${reason} You were not charged.`, "We are sorry for the trouble. You can pick another formula any time."],
    buttonText: "Shop formulas",
    buttonUrl: `${siteUrl()}/products`,
  });

const sendPostponed = (sub, user, until) =>
  emailUser(user.email, "Your subscription shipment is delayed", {
    title: "Shipment delayed",
    accent: "Subscribe & save",
    greeting: `Hi ${user.name || "there"},`,
    paragraphs: [`${describe(sub)} is temporarily out of stock, so we have not charged you yet. We will try again on ${fmtDate(until)}.`, "You can skip or cancel from your account if you prefer."],
    buttonText: "Manage subscription",
    buttonUrl: manageUrl(),
    links: mailLinks(sub),
  });

const sendCancelled = (sub, user, by) =>
  emailUser(user.email, "Your subscription was cancelled", {
    title: "Subscription cancelled",
    accent: "Subscribe & save",
    greeting: `Hi ${user.name || "there"},`,
    paragraphs: [
      by === "USER" ? `As requested, your subscription for ${describe(sub)} is cancelled. You will not be charged again.` : `Your subscription for ${describe(sub)} was cancelled. You will not be charged again.`,
      "Orders already placed are not affected.",
    ],
    buttonText: "Shop again",
    buttonUrl: `${siteUrl()}/products`,
  });

/* ------------------------------ order creation ------------------------------ */

// One shipment of a subscription: creates the order, items, stock movement and the payment record.
// `pay` is { sessionId, paymentIntentId, amountCents, paymentMethodLabel, mode, ownerId }.
async function createOrderForShipment({ sub, user, address, variant, qty, price, shipping, total, pay, isRenewal }) {
  const subTotal = round2(price * qty);
  const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const snapshot = snapshotFor(variant);

  return prisma.$transaction(async (tx) => {
    const fresh = await tx.productVariant.findUnique({ where: { id: variant.id }, select: { quantity: true } });
    if (!fresh || fresh.quantity < qty) throw new ApiError(400, `Not enough stock for ${variant.product.name}`);

    const order = await tx.order.create({
      data: {
        orderNumber,
        currency: "USD",
        userId: user.id,
        subTotal: subTotal.toFixed(2),
        tax: "0.00",
        shippingCost: shipping.customerPrice.toFixed(2),
        discount: 0,
        total: total.toFixed(2),
        status: "PAID",
        paymentMethod: "STRIPE",
        paymentGateway: "STRIPE",
        paymentMode: pay.mode,
        paymentOwnerId: pay.ownerId,
        shippingAddressId: address.id,
        shippingProvider: shipping.shipmentId ? "EASYPOST" : null,
        shipmentId: shipping.shipmentId,
        shipmentRateId: shipping.shipmentId ? shipping.rateId : null,
        shippingCarrier: shipping.carrier,
        shippingService: shipping.service,
        shippingRateCost: shipping.rateCost ?? null,
        shippingStatus: shipping.shipmentId ? "awaiting_label" : null,
        shippingAddressSnapshot: {
          name: address.name,
          street: address.street,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: "US",
          phone: address.phone,
        },
        notes: isRenewal ? "Monthly subscription renewal" : "Subscription (first order)",
        subscriptionId: sub.id,
        isSubscriptionRenewal: !!isRenewal,
      },
    });

    await tx.orderItem.create({
      data: {
        orderId: order.id,
        productId: variant.product.id,
        variantId: variant.id,
        price,
        quantity: qty,
        subtotal: subTotal,
        productSnapshot: { ...snapshot, originalPrice: parseFloat(variant.price), paidPrice: price, subscription: true },
      },
    });

    await tx.productVariant.update({ where: { id: variant.id }, data: { quantity: { decrement: qty } } });
    await tx.inventoryLog.create({
      data: {
        variantId: variant.id,
        quantityChange: -qty,
        reason: "subscription_sale",
        referenceId: order.id,
        previousQuantity: fresh.quantity,
        newQuantity: fresh.quantity - qty,
        createdBy: user.id,
      },
    });

    // the checkout session row already exists for the first order; renewals get their own record
    if (pay.stripePaymentId) {
      await tx.stripePayment.update({
        where: { id: pay.stripePaymentId },
        data: { orderId: order.id, status: "CAPTURED", paymentIntentId: pay.paymentIntentId || null, paymentMethod: pay.paymentMethodLabel },
      });
    } else {
      await tx.stripePayment.create({
        data: {
          sessionId: pay.sessionId,
          paymentIntentId: pay.paymentIntentId || null,
          orderId: order.id,
          userId: user.id,
          amount: total.toFixed(2),
          currency: "USD",
          status: "CAPTURED",
          paymentMethod: pay.paymentMethodLabel,
          notes: { subscriptionId: sub.id, renewal: true },
        },
      });
    }
    return order;
  });
}

const afterOrder = (orderId) => {
  autoBookLabel(orderId);
  autoSyncOrder(orderId);
  sendMetaPurchase(orderId);
};

async function adminNotice(subject, notice) {
  try {
    await notifyAdmin(subject, notice);
  } catch {
    // never block billing on an alert email
  }
}

/* ------------------------------ first payment ------------------------------ */

export async function buildFirstCharge({ user, variantId, quantity, shippingAddressId }) {
  const settings = await getSubscriptionSettings();
  if (!settings.isEnabled) throw new ApiError(400, "Subscriptions are not available right now");
  const qty = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 10);

  const address = await prisma.address.findFirst({ where: { id: shippingAddressId, userId: user.id } });
  if (!address) throw new ApiError(404, "Shipping address not found");
  const checked = validateUsAddress(address);
  if (checked.errors) throw new ApiError(400, `Please update your shipping address: ${Object.values(checked.errors)[0]}`);

  const variant = await loadSellable(variantId);
  if (variant.quantity < qty) throw new ApiError(400, `Only ${variant.quantity} left in stock`);

  const price = unitPriceFor(variant, settings.discountPercent);
  const subTotal = round2(price * qty);
  const shipping = await quoteShipping({ address, variant, qty, subTotal });
  const total = round2(subTotal + shipping.customerPrice);
  return { settings, qty, address, variant, price, subTotal, shipping, total };
}

// Called by the success page and by the Stripe webhook; safe to call twice.
export async function fulfillSubscriptionSession(session, expectedUserId = null, { stripeFactory = getStripeContext } = {}) {
  const payment = await prisma.stripePayment.findUnique({ where: { sessionId: session.id } });
  if (!payment || payment.checkoutPayload?.kind !== "subscription") throw new ApiError(404, "Subscription checkout not found");
  if (expectedUserId && expectedUserId !== payment.userId) throw new ApiError(403, "This payment belongs to another account");

  const existing = async (p) => {
    const order = await prisma.order.findUnique({ where: { id: p.orderId } });
    return { order, subscriptionId: order?.subscriptionId || null, alreadyProcessed: true };
  };
  if (payment.orderId) return existing(payment);
  if (session.payment_status !== "paid") throw new ApiError(400, "Payment has not been completed");

  const payload = payment.checkoutPayload;
  if (typeof session.livemode === "boolean" && payload.paymentMode && session.livemode !== (payload.paymentMode === "LIVE")) {
    throw new ApiError(409, "This payment was made in a different Stripe mode than the one it was started in");
  }
  if (Math.round(parseFloat(payment.amount) * 100) !== session.amount_total) {
    throw new ApiError(409, "The paid amount does not match this subscription");
  }

  const claim = await prisma.stripePayment.updateMany({
    where: { id: payment.id, orderId: null, status: { in: ["PENDING", "FAILED"] } },
    data: { status: "AUTHORIZED" },
  });
  if (claim.count === 0) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const again = await prisma.stripePayment.findUnique({ where: { id: payment.id } });
      if (again?.orderId) return existing(again);
    }
    throw new ApiError(409, "Your payment is being processed. Please refresh in a moment.");
  }

  const { stripe } = await stripeFactory();
  const user = await prisma.user.findUnique({ where: { id: payment.userId } });
  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  try {
    const address = await prisma.address.findFirst({ where: { id: payload.shippingAddressId, userId: user.id } });
    if (!address) throw new ApiError(404, "Shipping address not found");
    const variant = await loadSellable(payload.variantId);

    let paymentMethodId = null;
    let customerId = typeof session.customer === "string" ? session.customer : session.customer?.id || null;
    if (paymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentMethodId = typeof pi.payment_method === "string" ? pi.payment_method : pi.payment_method?.id || null;
      customerId = customerId || (typeof pi.customer === "string" ? pi.customer : pi.customer?.id) || null;
    }
    if (!paymentMethodId || !customerId) throw new ApiError(400, "Your card could not be saved for monthly billing");

    const now = new Date();
    const sub = await prisma.subscription.create({
      data: {
        userId: user.id,
        productId: variant.product.id,
        variantId: variant.id,
        quantity: payload.quantity,
        discountPercent: payload.discountPercent,
        lockedUnitPrice: variant.subscriptionPrice != null ? payload.unitPrice : null,
        shippingAddressId: address.id,
        stripeCustomerId: customerId,
        stripePaymentMethodId: paymentMethodId,
        stripeMode: payload.paymentMode,
        nextBillingDate: addMonth(now),
        lastBilledAt: now,
        billingCount: 1,
        productSnapshot: snapshotFor(variant),
      },
    });

    const total = parseFloat(payment.amount);
    const order = await createOrderForShipment({
      sub,
      user,
      address,
      variant,
      qty: payload.quantity,
      price: payload.unitPrice,
      shipping: payload.shipment,
      total,
      pay: { stripePaymentId: payment.id, paymentIntentId, paymentMethodLabel: "CARD", mode: payload.paymentMode, ownerId: payload.paymentOwnerId || user.id },
      isRenewal: false,
    });

    afterOrder(order.id);
    sendSubscriptionStarted(sub, user, { price: payload.unitPrice * 1, shipping: payload.shipment.customerPrice, total });
    adminNotice(`New subscription: ${sub.productSnapshot?.name}`, {
      title: "New subscription",
      rows: [["Customer", `${user.name || ""} <${user.email}>`], ["Product", describe(sub)], ["First charge", money(total)], ["Next charge", fmtDate(sub.nextBillingDate)]],
    });
    return { order, subscriptionId: sub.id };
  } catch (err) {
    console.error("Subscription fulfillment error:", err.message);
    // The customer paid but we cannot start the subscription: give the money back
    if (paymentIntentId && err.statusCode >= 400 && err.statusCode <= 404) {
      try {
        const latest = await prisma.stripePayment.findUnique({ where: { id: payment.id } });
        await refundStripePayment({ ...latest, paymentIntentId }, parseFloat(latest.amount), "requested_by_customer");
        await prisma.stripePayment.update({ where: { id: payment.id }, data: { failureReason: String(err.message).slice(0, 300) } });
        throw Object.assign(new ApiError(err.statusCode, `${err.message} Your card payment was refunded automatically.`), { refunded: true });
      } catch (refundErr) {
        if (refundErr.refunded) throw refundErr;
        console.error("Automatic refund failed - refund manually in Stripe:", session.id, refundErr.message);
      }
    } else {
      await prisma.stripePayment.update({ where: { id: payment.id }, data: { status: "PENDING", failureReason: String(err.message).slice(0, 300) } }).catch(() => {});
    }
    throw err;
  }
}

/* ------------------------------ monthly renewal ------------------------------ */

async function recordFailure(sub, user, reason, settings, now) {
  const attempts = sub.failedAttempts + 1;
  const willRetry = attempts < settings.maxRetries;
  const retryOn = new Date(now.getTime() + 2 * DAY);
  await prisma.subscription.update({
    where: { id: sub.id },
    data: willRetry
      ? { status: "PAST_DUE", failedAttempts: attempts, lastError: reason.slice(0, 300), nextBillingDate: retryOn }
      : { status: "CANCELLED", failedAttempts: attempts, lastError: reason.slice(0, 300), cancelledAt: now, cancelledBy: "SYSTEM", cancelReason: "Payment failed after repeated attempts" },
  });
  if (user?.email) await sendFailed(sub, user, reason, { willRetry, retryOn });
  if (!willRetry) adminNotice(`Subscription cancelled after failed payments: ${sub.productSnapshot?.name || sub.id}`, {
    title: "Subscription renewal failed",
    danger: true,
    rows: [["Customer", user?.email], ["Product", describe(sub)], ["Reason", reason], ["Attempt", `${attempts} of ${settings.maxRetries}`], ["Result", willRetry ? `Retry ${fmtDate(retryOn)}` : "Cancelled"]],
  });
  return { ok: false, reason, cancelled: !willRetry };
}

// Charges one due subscription. `now` and `stripeFactory` can be passed in for tests.
export async function renewSubscription(subscriptionId, { now = new Date(), stripeFactory = getStripeContext } = {}) {
  const settings = await getSubscriptionSettings();
  const due = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
  if (!due || !["ACTIVE", "PAST_DUE"].includes(due.status) || due.nextBillingDate > now) return { skipped: true };

  // Claim it: move the date an hour ahead so a second worker (or a crash retry) cannot charge it twice.
  const claim = await prisma.subscription.updateMany({
    where: { id: due.id, status: { in: ["ACTIVE", "PAST_DUE"] }, nextBillingDate: due.nextBillingDate },
    data: { nextBillingDate: new Date(now.getTime() + 60 * 60 * 1000) },
  });
  if (claim.count === 0) return { skipped: true };
  const dueDate = due.nextBillingDate;
  const sub = due;

  const user = await prisma.user.findUnique({ where: { id: sub.userId } });
  try {
    if (!user || !user.isActive) throw Object.assign(new Error("The account is no longer active"), { final: true });
    // the saved address may have been deleted: use the customer's default address instead
    let address = sub.shippingAddressId ? await prisma.address.findFirst({ where: { id: sub.shippingAddressId, userId: user.id } }) : null;
    if (!address) {
      address = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: { isDefault: "desc" } });
      if (address) await prisma.subscription.update({ where: { id: sub.id }, data: { shippingAddressId: address.id } });
    }
    if (!address) throw new Error("There is no delivery address on your account. Add one in your account.");
    const variant = await loadSellable(sub.variantId).catch(() => {
      throw Object.assign(new Error("This product is no longer available."), { final: true, tell: true });
    });
    if (variant.quantity < sub.quantity) throw Object.assign(new Error("The product is temporarily out of stock"), { postpone: true });

    const price = unitPriceFor(variant, sub.discountPercent, sub.lockedUnitPrice);
    const subTotal = round2(price * sub.quantity);
    const shipping = await quoteShipping({ address, variant, qty: sub.quantity, subTotal });
    const total = round2(subTotal + shipping.customerPrice);

    const { stripe, settings: gateway } = await stripeFactory();
    if (sub.stripeMode && gateway?.mode && sub.stripeMode !== gateway.mode) {
      throw Object.assign(new Error("Stripe is in a different mode than this subscription was created in"), { final: false });
    }

    let intent;
    try {
      intent = await stripe.paymentIntents.create(
        {
          amount: Math.round(total * 100),
          currency: "usd",
          customer: sub.stripeCustomerId,
          payment_method: sub.stripePaymentMethodId,
          off_session: true,
          confirm: true,
          description: `MWP Supplements subscription: ${describe(sub)}`,
          metadata: { kind: "subscription_renewal", subscriptionId: sub.id, userId: user.id },
        },
        { idempotencyKey: `sub-${sub.id}-cycle-${sub.billingCount}-try-${sub.failedAttempts}` }
      );
    } catch (err) {
      const reason = err?.raw?.message || err.message || "The card was declined";
      throw new Error(reason);
    }
    if (intent.status !== "succeeded") throw new Error("The bank needs you to confirm this payment");

    let order = null;
    const already = await prisma.stripePayment.findUnique({ where: { sessionId: `renewal_${intent.id}` } });
    if (already?.orderId) order = await prisma.order.findUnique({ where: { id: already.orderId } });
    try {
      if (order) throw Object.assign(new Error("exists"), { exists: true });
      order = await createOrderForShipment({
        sub,
        user,
        address,
        variant,
        qty: sub.quantity,
        price,
        shipping,
        total,
        pay: { sessionId: `renewal_${intent.id}`, paymentIntentId: intent.id, paymentMethodLabel: "CARD", mode: gateway?.mode || sub.stripeMode, ownerId: gateway?.userId || user.id },
        isRenewal: true,
      });
    } catch (orderErr) {
      if (orderErr.exists) {
        // the earlier run already made this order: just carry on
      } else {
      // charged but no order: refund so the customer is never billed for nothing
      try {
        await stripe.refunds.create({ payment_intent: intent.id });
      } catch (refundErr) {
        console.error("Renewal refund failed - refund manually in Stripe:", intent.id, refundErr.message);
      }
      throw new Error(`${orderErr.message}. You were not charged.`);
      }
    }

    const next = addMonth(dueDate);
    const updated = await prisma.subscription.update({
      where: { id: sub.id },
      data: { status: "ACTIVE", nextBillingDate: next < now ? addMonth(now) : next, lastBilledAt: now, billingCount: { increment: 1 }, failedAttempts: 0, lastError: null, reminderSentFor: null },
    });
    afterOrder(order.id);
    sendRenewed(updated, user, order, { subTotal, shipping: shipping.customerPrice, address });
    return { ok: true, orderId: order.id };
  } catch (err) {
    if (err.postpone) {
      // our stock problem, not the customer's: wait, do not count it as a failed payment
      const stale = sub.lastBilledAt && now.getTime() - new Date(sub.lastBilledAt).getTime() > 75 * DAY;
      if (!stale) {
        const until = new Date(now.getTime() + 3 * DAY);
        await prisma.subscription.update({ where: { id: sub.id }, data: { nextBillingDate: until, lastError: err.message } });
        if (user?.email && sub.lastError !== err.message) sendPostponed(sub, user, until);
        return { ok: false, postponed: true };
      }
      err.final = true;
      err.tell = true;
    }
    if (err.final) {
      await prisma.subscription.update({ where: { id: sub.id }, data: { status: "CANCELLED", cancelledAt: now, cancelledBy: "SYSTEM", cancelReason: err.message, nextBillingDate: dueDate } });
      if (err.tell && user?.email) sendUnavailable(sub, user, err.message);
      return { ok: false, reason: err.message, cancelled: true };
    }
    return recordFailure({ ...sub, nextBillingDate: dueDate }, user, err.message || "Payment failed", settings, now);
  }
}

// Runs `fn` over `items` with at most `size` running at once
async function pool(items, size, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++];
        out.push(await fn(item).catch((e) => ({ ok: false, reason: e.message })));
      }
    })
  );
  return out;
}

export async function sendDueReminders({ now = new Date(), budgetMs = 4 * 60 * 1000 } = {}) {
  const settings = await getSubscriptionSettings();
  const horizon = new Date(now.getTime() + settings.reminderDays * DAY);
  const started = Date.now();
  let sent = 0;
  while (Date.now() - started < budgetMs) {
    const subs = await prisma.subscription.findMany({
      where: { status: "ACTIVE", nextBillingDate: { gt: now, lte: horizon }, reminderSentFor: null },
      include: { user: true, variant: true },
      orderBy: { nextBillingDate: "asc" },
      take: 200,
    });
    const todo = subs;
    if (todo.length === 0) break;
    const results = await pool(todo, 5, async (sub) => {
      if (!sub.user?.isActive) {
        await prisma.subscription.update({ where: { id: sub.id }, data: { reminderSentFor: sub.nextBillingDate } });
        return { ok: false };
      }
      const claim = await prisma.subscription.updateMany({
        where: { id: sub.id, OR: [{ reminderSentFor: null }, { reminderSentFor: { not: sub.nextBillingDate } }] },
        data: { reminderSentFor: sub.nextBillingDate },
      });
      if (claim.count === 0) return { ok: false };
      const amount = round2(unitPriceFor(sub.variant, sub.discountPercent, sub.lockedUnitPrice) * sub.quantity);
      const delivered = await sendReminder(sub, sub.user, amount);
      // mail server down: release the claim so the next run tries again (billing is never blocked by this)
      if (!delivered) await prisma.subscription.update({ where: { id: sub.id }, data: { reminderSentFor: null } }).catch(() => {});
      return { ok: !!delivered };
    });
    const ok = results.filter((r) => r.ok).length;
    sent += ok;
    if (ok === 0) break; // nothing could be sent (mail problem): stop, try again on the next run
  }
  return sent;
}

// One run: send reminders, then charge everything that is due. 1000 subscriptions due at once
// are worked off in batches (5 at a time) until the run's time budget is used; the rest continues next run.
export async function runSubscriptionJobs({ now = new Date(), stripeFactory, budgetMs = 8 * 60 * 1000, concurrency = 5 } = {}) {
  const reminders = await sendDueReminders({ now });
  const started = Date.now();
  const results = [];
  while (Date.now() - started < budgetMs) {
    const due = await prisma.subscription.findMany({
      where: { status: { in: ["ACTIVE", "PAST_DUE"] }, nextBillingDate: { lte: now } },
      orderBy: { nextBillingDate: "asc" },
      take: 50,
      select: { id: true },
    });
    if (due.length === 0) break;
    const batch = await pool(due, concurrency, ({ id }) => renewSubscription(id, { now, stripeFactory }));
    results.push(...batch);
    // a batch where nothing moved (all skipped) would loop forever
    if (batch.every((r) => r.skipped)) break;
  }
  const summary = {
    reminders,
    renewals: results.length,
    charged: results.filter((r) => r.ok).length,
    failed: results.filter((r) => r.ok === false && !r.postponed).length,
    postponed: results.filter((r) => r.postponed).length,
    cancelled: results.filter((r) => r.cancelled).length,
  };
  if (summary.renewals > 0) {
    adminNotice("Subscription billing summary", {
      title: "Subscription billing run",
      accent: "Admin",
      rows: [
        ["Reminders sent", String(summary.reminders)],
        ["Charged and ordered", String(summary.charged)],
        ["Failed (will retry)", String(summary.failed - summary.cancelled)],
        ["Cancelled after failures", String(summary.cancelled)],
        ["Delayed (out of stock)", String(summary.postponed)],
      ],
      buttonText: "Open subscriptions",
      buttonUrl: `${(process.env.ADMIN_FRONTEND_URL || "").split(",")[0].trim().replace(/\/$/, "")}/subscriptions`,
    });
  }
  return summary;
}

let timer = null;
export const schedulerState = { running: false, lastRunAt: null, lastResult: null };
export function startSubscriptionScheduler() {
  if (timer) return;
  if (process.env.SUBSCRIPTIONS_SCHEDULER === "off") {
    console.log("Subscription billing scheduler is OFF on this server (SUBSCRIPTIONS_SCHEDULER=off)");
    return;
  }
  schedulerState.running = true;
  console.log("Subscription billing scheduler is ON: checks every 10 minutes (set SUBSCRIPTIONS_SCHEDULER=off to disable on dev machines)");
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const r = await runSubscriptionJobs();
      schedulerState.lastRunAt = new Date();
      schedulerState.lastResult = r;
      if (r.reminders || r.renewals) console.log("Subscription jobs:", r);
    } catch (e) {
      console.error("Subscription jobs failed:", e.message);
    } finally {
      running = false;
    }
  };
  setTimeout(tick, 90 * 1000);
  timer = setInterval(tick, 10 * 60 * 1000);
  timer.unref?.();
}

/* ------------------------------ cancel / skip ------------------------------ */

export async function cancelSubscription(subscriptionId, { by = "USER", reason = null, note = null, userId = null } = {}) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, ...(userId ? { userId } : {}) }, include: { user: true } });
  if (!sub) throw new ApiError(404, "Subscription not found");
  if (sub.status === "CANCELLED") return sub;
  const updated = await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledBy: by,
      cancelReason: [reason, note].filter(Boolean).join(": ").slice(0, 300) || null,
    },
  });
  if (sub.user?.email) sendCancelled(sub, sub.user, by);
  if (by === "USER") {
    adminNotice(`Subscription cancelled: ${sub.productSnapshot?.name || sub.id}`, {
      title: "Subscription cancelled by customer",
      accent: "Admin",
      rows: [
        ["Customer", `${sub.user?.name || ""} <${sub.user?.email}>`],
        ["Product", describe(sub)],
        ["Shipments received", String(sub.billingCount)],
        ["Subscribed since", fmtDate(sub.createdAt)],
        ["Reason", reason || "No reason given"],
        ["Note", note || null],
      ],
      buttonText: "Open subscriptions",
      buttonUrl: `${(process.env.ADMIN_FRONTEND_URL || "").split(",")[0].trim().replace(/\/$/, "")}/subscriptions`,
    });
  }
  return updated;
}

export async function skipNextShipment(subscriptionId, userId) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, userId } });
  if (!sub) throw new ApiError(404, "Subscription not found");
  if (sub.status !== "ACTIVE") throw new ApiError(400, "Only active subscriptions can be skipped");
  return prisma.subscription.update({ where: { id: sub.id }, data: { nextBillingDate: addMonth(sub.nextBillingDate), reminderSentFor: null } });
}

export async function changeSubscriptionAddress(subscriptionId, userId, addressId) {
  const sub = await prisma.subscription.findFirst({ where: { id: subscriptionId, userId } });
  if (!sub) throw new ApiError(404, "Subscription not found");
  if (sub.status === "CANCELLED") throw new ApiError(400, "This subscription is cancelled");
  const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
  if (!address) throw new ApiError(404, "Address not found");
  const checked = validateUsAddress(address);
  if (checked.errors) throw new ApiError(400, `Please update this address: ${Object.values(checked.errors)[0]}`);
  return prisma.subscription.update({ where: { id: sub.id }, data: { shippingAddressId: address.id } });
}

// Cancels every open subscription of a user (account deletion / deactivation) without emailing them
export async function cancelAllForUser(userId, reason = "Account closed") {
  return prisma.subscription.updateMany({
    where: { userId, status: { in: ["ACTIVE", "PAST_DUE"] } },
    data: { status: "CANCELLED", cancelledAt: new Date(), cancelledBy: "SYSTEM", cancelReason: reason },
  });
}

// What is coming up: charges and units per product for the next N days, against current stock
export async function getForecast(days = 30) {
  const horizon = new Date(Date.now() + days * DAY);
  const subs = await prisma.subscription.findMany({
    where: { status: { in: ["ACTIVE", "PAST_DUE"] }, nextBillingDate: { lte: horizon } },
    include: { variant: { select: { id: true, sku: true, price: true, salePrice: true, quantity: true } }, product: { select: { name: true } } },
  });
  const byVariant = new Map();
  let revenue = 0;
  let dueNow = 0;
  const week = Date.now() + 7 * DAY;
  let dueWeek = 0;
  for (const s of subs) {
    const amount = round2(unitPriceFor(s.variant, s.discountPercent, s.lockedUnitPrice) * s.quantity);
    revenue += amount;
    if (s.nextBillingDate.getTime() <= Date.now()) dueNow++;
    if (s.nextBillingDate.getTime() <= week) dueWeek++;
    const row = byVariant.get(s.variantId) || { variantId: s.variantId, product: s.product?.name, sku: s.variant.sku, units: 0, subscriptions: 0, inStock: s.variant.quantity };
    row.units += s.quantity;
    row.subscriptions += 1;
    byVariant.set(s.variantId, row);
  }
  return {
    scheduler: { running: schedulerState.running, lastRunAt: schedulerState.lastRunAt, lastResult: schedulerState.lastResult },
    days,
    dueNow,
    dueWeek,
    totalSubscriptions: subs.length,
    expectedRevenue: round2(revenue),
    products: [...byVariant.values()].map((r) => ({ ...r, shortBy: Math.max(r.units - r.inStock, 0) })).sort((a, b) => b.units - a.units),
  };
}

// Admin: fixed subscriber price per variant
export async function listSubscriberPrices() {
  const settings = await getSubscriptionSettings();
  const variants = await prisma.productVariant.findMany({
    where: { product: { isDeleted: false } },
    select: {
      id: true, sku: true, price: true, salePrice: true, subscriptionPrice: true, isActive: true,
      product: { select: { name: true } },
      attributes: { select: { attributeValue: { select: { value: true, attribute: { select: { name: true } } } } } },
    },
    orderBy: [{ product: { name: "asc" } }, { sku: "asc" }],
  });
  return variants.map((v) => ({
    variantId: v.id,
    product: v.product.name,
    sku: v.sku,
    variantLabel: v.attributes.map((a) => `${a.attributeValue.attribute.name}: ${a.attributeValue.value}`).join(", ") || "Single option",
    price: parseFloat(v.price),
    salePrice: v.salePrice != null ? parseFloat(v.salePrice) : null,
    sellingPrice: parseFloat(v.salePrice || v.price),
    subscriptionPrice: v.subscriptionPrice != null ? parseFloat(v.subscriptionPrice) : null,
    effectivePrice: unitPriceFor(v, settings.discountPercent),
    isActive: v.isActive,
  }));
}

export async function setSubscriberPrice(variantId, value) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new ApiError(404, "Variant not found");
  if (value === null || value === "" || value === undefined) {
    return prisma.productVariant.update({ where: { id: variantId }, data: { subscriptionPrice: null } });
  }
  const price = round2(Number(value));
  const selling = parseFloat(variant.salePrice || variant.price);
  if (!(price >= 1)) throw new ApiError(400, "Enter a price of at least $1");
  if (price > selling) throw new ApiError(400, `The subscriber price cannot be higher than the selling price ($${selling.toFixed(2)})`);
  return prisma.productVariant.update({ where: { id: variantId }, data: { subscriptionPrice: price.toFixed(2) } });
}

export async function getCancelReasons() {
  const rows = await prisma.subscription.findMany({ where: { status: "CANCELLED", cancelledBy: "USER" }, select: { cancelReason: true } });
  const counts = new Map();
  for (const r of rows) {
    const key = (r.cancelReason || "No reason given").split(":")[0].trim() || "No reason given";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
}

export async function getManageSummary(token) {
  const id = readManageToken(token);
  if (!id) throw new ApiError(400, "This link is invalid or has expired. Sign in to manage your subscription.");
  const sub = await prisma.subscription.findUnique({ where: { id }, include: { user: { select: { name: true, email: true } } } });
  if (!sub) throw new ApiError(404, "Subscription not found");
  return {
    id: sub.id,
    status: sub.status,
    product: sub.productSnapshot?.name || "Your product",
    quantity: sub.quantity,
    nextBillingDate: sub.nextBillingDate,
    cancelledAt: sub.cancelledAt,
    customer: sub.user?.name || sub.user?.email,
  };
}
