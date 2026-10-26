import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getStripeContext } from "../utils/stripe.js";
import {
  getSubscriptionSettings,
  buildFirstCharge,
  fulfillSubscriptionSession,
  cancelSubscription,
  skipNextShipment,
  changeSubscriptionAddress,
  getForecast,
  runSubscriptionJobs,
  unitPriceFor,
  manageUrl,
} from "../utils/subscriptions.js";

const ok = (res, data, message = "OK", code = 200) => res.status(code).json(new ApiResponsive(code, data, message));

const publicSettings = (s) => ({ isEnabled: s.isEnabled, discountPercent: Number(s.discountPercent) });

export const getPublicSettings = asyncHandler(async (req, res) => ok(res, publicSettings(await getSubscriptionSettings())));

// Amounts for the subscribe page before the customer pays
export const previewSubscription = asyncHandler(async (req, res) => {
  const c = await buildFirstCharge({ user: req.user, ...req.body });
  ok(res, {
    product: c.variant.product.name,
    quantity: c.qty,
    unitPrice: c.price,
    listPrice: parseFloat(c.variant.salePrice || c.variant.price),
    discountPercent: Number(c.settings.discountPercent),
    subTotal: c.subTotal,
    shipping: c.shipping.customerPrice,
    shippingLabel: `${c.shipping.carrier} ${c.shipping.service}`.trim(),
    total: c.total,
  });
});

export const startSubscriptionCheckout = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (req.body.agreed !== true) throw new ApiError(400, "Please agree to the monthly billing terms");

  const c = await buildFirstCharge({ user, ...req.body });
  const { stripe, settings: gateway } = await getStripeContext();

  const base = (req.headers.origin || process.env.FRONTEND_URL || "").split(",")[0].replace(/\/$/, "");
  if (!base) throw new ApiError(500, "Site URL is not configured");

  // one Stripe customer per user and mode, so the saved card can be charged later
  let customerId = user.stripeCustomerId && user.stripeCustomerMode === gateway.mode ? user.stripeCustomerId : null;
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: user.name || undefined, metadata: { userId: user.id } });
    customerId = customer.id;
    await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId, stripeCustomerMode: gateway.mode } });
  }

  const term = `You will be charged $${c.total.toFixed(2)} today and then every month until you cancel. Cancel any time in your account.`;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(c.total * 100),
          product_data: {
            name: `${c.variant.product.name}${c.qty > 1 ? ` x ${c.qty}` : ""} (monthly subscription)`,
            description: `Includes ${c.shipping.carrier} ${c.shipping.service} shipping. Renews monthly.`.slice(0, 400),
          },
        },
      },
    ],
    payment_intent_data: { setup_future_usage: "off_session", metadata: { userId: user.id, kind: "subscription" } },
    custom_text: { submit: { message: term.slice(0, 1200) } },
    metadata: { userId: user.id, kind: "subscription" },
    success_url: `${base}/account/subscriptions?subscribed={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/subscribe?variant=${encodeURIComponent(c.variant.id)}&qty=${c.qty}&canceled=1`,
  });

  await prisma.stripePayment.create({
    data: {
      sessionId: session.id,
      userId: user.id,
      amount: c.total.toFixed(2),
      currency: "USD",
      status: "PENDING",
      checkoutPayload: {
        kind: "subscription",
        variantId: c.variant.id,
        quantity: c.qty,
        shippingAddressId: c.address.id,
        unitPrice: c.price,
        discountPercent: Number(c.settings.discountPercent),
        shipment: c.shipping,
        paymentMode: gateway.mode,
        paymentOwnerId: gateway.userId,
        terms: term,
        termsAcceptedAt: new Date().toISOString(),
      },
    },
  });

  ok(res, { url: session.url, sessionId: session.id }, "Checkout session created");
});

export const confirmSubscription = asyncHandler(async (req, res) => {
  const sessionId = req.body.sessionId;
  if (!sessionId) throw new ApiError(400, "Missing checkout session");
  const { stripe } = await getStripeContext();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const r = await fulfillSubscriptionSession(session, req.user.id);
  ok(res, { subscriptionId: r.subscriptionId, orderNumber: r.order?.orderNumber }, "Subscription started");
});

const shape = (s) => ({
  id: s.id,
  status: s.status,
  quantity: s.quantity,
  product: { id: s.productId, name: s.productSnapshot?.name || s.product?.name, slug: s.productSnapshot?.slug || s.product?.slug, image: s.productSnapshot?.image || null },
  unitPrice: s.variant ? unitPriceFor(s.variant, s.discountPercent) : null,
  discountPercent: Number(s.discountPercent),
  nextBillingDate: s.nextBillingDate,
  lastBilledAt: s.lastBilledAt,
  billingCount: s.billingCount,
  failedAttempts: s.failedAttempts,
  shippingAddressId: s.shippingAddressId,
  lastError: s.status === "ACTIVE" ? null : s.lastError,
  cancelledAt: s.cancelledAt,
  createdAt: s.createdAt,
});

export const listMySubscriptions = asyncHandler(async (req, res) => {
  const subs = await prisma.subscription.findMany({
    where: { userId: req.user.id },
    include: { variant: true, product: { select: { name: true, slug: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const settings = await getSubscriptionSettings();
  ok(res, { subscriptions: subs.map(shape), manageUrl: manageUrl(), settings: publicSettings(settings) });
});

export const cancelMySubscription = asyncHandler(async (req, res) => {
  await cancelSubscription(req.params.id, { by: "USER", userId: req.user.id, reason: req.body?.reason });
  ok(res, {}, "Subscription cancelled");
});

export const skipMyNextShipment = asyncHandler(async (req, res) => {
  const s = await skipNextShipment(req.params.id, req.user.id);
  ok(res, { nextBillingDate: s.nextBillingDate }, "Next shipment skipped");
});

export const changeMyAddress = asyncHandler(async (req, res) => {
  await changeSubscriptionAddress(req.params.id, req.user.id, req.body?.shippingAddressId);
  ok(res, {}, "Delivery address updated");
});

/* ------------------------------ admin ------------------------------ */

export const adminForecast = asyncHandler(async (req, res) => ok(res, await getForecast(Math.min(parseInt(req.query.days, 10) || 30, 90))));

export const adminListSubscriptions = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const status = ["ACTIVE", "PAST_DUE", "CANCELLED"].includes(req.query.status) ? req.query.status : undefined;
  const q = String(req.query.search || "").trim();
  const where = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { user: { email: { contains: q, mode: "insensitive" } } },
            { user: { name: { contains: q, mode: "insensitive" } } },
            { product: { name: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
  const [total, rows, counts] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        variant: true,
        product: { select: { name: true, slug: true } },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.subscription.groupBy({ by: ["status"], _count: true }),
  ]);
  ok(res, {
    subscriptions: rows.map((s) => ({ ...shape(s), user: s.user, orderCount: s._count.orders, cancelReason: s.cancelReason, cancelledBy: s.cancelledBy })),
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    counts: Object.fromEntries(counts.map((c) => [c.status, c._count])),
  });
});

export const adminGetSubscription = asyncHandler(async (req, res) => {
  const s = await prisma.subscription.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      variant: true,
      product: { select: { name: true, slug: true } },
      orders: {
        select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, isSubscriptionRenewal: true, shippingStatus: true, trackingCode: true, trackingUrl: true, labelUrl: true, shippingCarrier: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!s) throw new ApiError(404, "Subscription not found");
  ok(res, { subscription: { ...shape(s), user: s.user, orders: s.orders, cancelReason: s.cancelReason, cancelledBy: s.cancelledBy } });
});

export const adminCancelSubscription = asyncHandler(async (req, res) => {
  await cancelSubscription(req.params.id, { by: "ADMIN", reason: req.body?.reason });
  ok(res, {}, "Subscription cancelled");
});

export const adminRunJobs = asyncHandler(async (req, res) => ok(res, await runSubscriptionJobs(), "Subscription jobs finished"));

const settingsOut = (s) => ({ isEnabled: s.isEnabled, discountPercent: Number(s.discountPercent), reminderDays: s.reminderDays, maxRetries: s.maxRetries });

export const adminGetSettings = asyncHandler(async (req, res) => ok(res, { settings: settingsOut(await getSubscriptionSettings()) }));

export const adminSaveSettings = asyncHandler(async (req, res) => {
  const discount = Number(req.body.discountPercent);
  const reminderDays = parseInt(req.body.reminderDays, 10);
  const maxRetries = parseInt(req.body.maxRetries, 10);
  if (!(discount >= 0 && discount <= 50)) throw new ApiError(400, "Discount must be between 0 and 50 percent");
  if (!(reminderDays >= 1 && reminderDays <= 14)) throw new ApiError(400, "Reminder days must be between 1 and 14");
  if (!(maxRetries >= 1 && maxRetries <= 6)) throw new ApiError(400, "Retries must be between 1 and 6");
  const s = await getSubscriptionSettings();
  const saved = await prisma.subscriptionSettings.update({
    where: { id: s.id },
    data: { isEnabled: req.body.isEnabled !== false, discountPercent: discount, reminderDays, maxRetries },
  });
  ok(res, { settings: settingsOut(saved) }, "Settings saved");
});
