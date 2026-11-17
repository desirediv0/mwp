import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getFileUrl } from "../utils/deleteFromS3.js";
import { getStripeContext } from "../utils/stripe.js";
import { validateUsAddress, normalizeUsPhone } from "../utils/usValidation.js";
import sendEmail from "../utils/sendEmail.js";
import { getFromEmail } from "../utils/storeConfig.js";

// Wholesale: only store accounts the MWP team has approved as wholesale buyers can see the box prices set in Admin > Wholesale
// and order. They pay by card on Stripe. Money rules:
//  - prices and totals are always recomputed here, never taken from the browser
//  - one checkout attempt = one order (attemptId), and an open Stripe page is reused, so a double click never charges twice
//  - the order becomes "paid" only from Stripe (webhook / return page), after the amount is checked
//  - if a second payment for the same order ever arrives, it is refunded automatically

const ok = (res, data, message = "OK", code = 200) => res.status(code).json(new ApiResponsive(code, data, message));
const num = (d) => Number(d);
const cents = (n) => Math.round(num(n) * 100);
const money = (n) => `$${num(n).toFixed(2)}`;
const CTRL = new RegExp("[\\u0000-\\u001f\\u007f]", "g");
const clean = (v, max) => String(v ?? "").replace(CTRL, " ").trim().slice(0, max);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const wholesaleLink = () => `${(process.env.FRONTEND_URL || "https://www.mwpsupplements.com").split(",")[0].replace(/\/$/, "")}/wholesale`;
const adminEmail = () => process.env.WHOLESALE_ADMIN_EMAIL || getFromEmail();

// emails never block or break a request
const mail = async (to, subject, html) => {
  try {
    await sendEmail({ email: to, subject, html: `<div style="font-family:Arial,sans-serif;color:#12213F;max-width:560px">${html}<p style="color:#6B7388;font-size:12px">MWP Supplements</p></div>` });
  } catch (e) {
    console.error("wholesale email failed:", e?.message || e);
  }
};

const getSettings = () => prisma.wholesaleSettings.upsert({ where: { id: "main" }, update: {}, create: { id: "main" } });

// the signed-in customer (if any): the order then shows up in their account
async function optionalUser(req) {
  try {
    const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.ACCESS_JWT_SECRET);
    const u = await prisma.user.findUnique({ where: { id: decoded.id }, select: { id: true, name: true, email: true, isActive: true, otpVerified: true } });
    return u && u.isActive !== false ? u : null;
  } catch {
    return null;
  }
}

// Wholesale access = a store account (signed in, email verified) that the MWP team has approved as a wholesale buyer.
// Normal customers never see wholesale prices.
async function accessFor(user) {
  if (!user) return { access: "signin" };
  if (user.otpVerified === false) return { access: "verify" };
  const email = String(user.email || "").toLowerCase();
  let partner = await prisma.wholesalePartner.findFirst({ where: { OR: [{ userId: user.id }, { email }] } });
  if (!partner) return { access: "request" };
  if (partner.userId !== user.id) partner = await prisma.wholesalePartner.update({ where: { id: partner.id }, data: { userId: user.id, lastLoginAt: new Date() } });
  if (partner.status === "approved") return { access: "approved", partner };
  return { access: partner.status, partner }; // pending | rejected | suspended
}

const requireBuyer = async (req) => {
  const user = await optionalUser(req);
  const a = await accessFor(user);
  if (a.access !== "approved") throw new ApiError(403, "Your account is not approved for wholesale ordering.");
  return { user, partner: a.partner };
};

/* ------------------------------ limits ------------------------------ */

const limiter = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => ipKeyGenerator(req.ip || ""), message: { success: false, message } });
export const catalogLimiter = limiter(60 * 1000, 60, "Too many requests. Please wait a moment.");
export const checkoutLimiter = limiter(60 * 60 * 1000, 30, "Too many checkout attempts. Please wait a few minutes.");

/* ------------------------------ catalog (private link) ------------------------------ */

const TONES = {
  "her-power": ["#F7EFEB", "#E5C3B7"],
  "daily-vitality": ["#F4F4ED", "#DDDFC7"],
  "power-max": ["#F0F3F9", "#CDD8EE"],
  "rapid-boost": ["#FBEFEB", "#EFC7BC"],
  "alpha-prime": ["#F8F0E8", "#E8CEB1"],
  "ultra-pro": ["#F8F4E9", "#F1E2B7"],
};
const toneFor = (slug) => TONES[slug] || ["#F6F1E4", "#E6DFC9"];

export const catalog = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  if (!settings.isEnabled) return ok(res, { enabled: false });
  const user = await optionalUser(req);
  const a = await accessFor(user);
  const me = user ? { name: user.name, email: user.email } : null;
  if (a.access !== "approved") return ok(res, { enabled: true, access: a.access, user: me, request: a.access === "request" ? { name: user?.name || "", email: user?.email || "" } : null });

  const products = await prisma.product.findMany({
    where: { isDeleted: false, isActive: true, wholesaleEnabled: true, wholesalePacks: { some: { isActive: true } } },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
      wholesalePacks: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });
  ok(res, {
    enabled: true,
    access: "approved",
    minBoxes: settings.minBoxes,
    shipping: num(settings.shippingFlat),
    user: me,
    buyer: { business: a.partner.business, contact: a.partner.contact, phone: a.partner.phone },
    products: products.map((p) => {
      const [mid, edge] = toneFor(p.slug);
      return {
        id: p.id, name: p.name, slug: p.slug,
        image: p.images[0]?.url ? getFileUrl(p.images[0].url) : null,
        bg: `radial-gradient(circle at 50% 46%, #fff 0%, ${mid} 52%, ${edge} 135%)`,
        packs: p.wholesalePacks.map((k) => ({ id: k.id, type: k.type, label: k.label, contains: k.contains, detail: k.detail, unit: k.unit, units: k.units, price: num(k.price) })),
      };
    }),
  });
});

// A signed-in, email-verified customer asks the MWP team for wholesale access.
export const requestAccess = asyncHandler(async (req, res) => {
  const user = await optionalUser(req);
  const a = await accessFor(user);
  if (a.access === "signin") throw new ApiError(401, "Please sign in first.");
  if (a.access === "verify") throw new ApiError(403, "Please verify your email address first.");
  if (a.access !== "request") return ok(res, { access: a.access }, "Request already received");
  const b = req.body || {};
  const f = { business: clean(b.business, 140), contact: clean(b.contact, 100), phone: clean(b.phone, 40), businessType: clean(b.businessType, 60) || "Retail store", ein: clean(b.ein, 40) || null, address: clean(b.address, 300), notes: clean(b.notes, 1000) || null };
  if (!f.business || !f.contact || !f.address) throw new ApiError(400, "Please enter your business name, your name and your business address.");
  if (!normalizeUsPhone(f.phone)) throw new ApiError(400, "Enter a valid US phone number, like (310) 724-8851.");
  const email = String(user.email).toLowerCase();
  await prisma.wholesalePartner.create({ data: { ...f, email, userId: user.id, status: "pending" } });
  const rows = [["Business", f.business], ["Contact", f.contact], ["Email", email], ["Phone", f.phone], ["Type", f.businessType], ["EIN / Tax ID", f.ein || "-"], ["Address", f.address]];
  await mail(adminEmail(), `Wholesale access request: ${f.business}`, `<h2>New wholesale access request</h2><table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table><p>Review it in Admin > Wholesale > Buyers.</p>`);
  await mail(email, "We received your MWP wholesale request", `<p>Hi ${esc(f.contact)}, thank you. Our team will review your request and email you as soon as your wholesale access is approved.</p>`);
  ok(res, { access: "pending" }, "Request received", 201);
});

/* ------------------------------ checkout (Stripe) ------------------------------ */

const orderNumber = () => `W${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomInt(1000, 9999)}`;
const baseUrl = (req) => (req.headers.origin || process.env.FRONTEND_URL || "").split(",")[0].replace(/\/$/, "");

const closeSession = async (stripe, id) => {
  if (!id) return;
  try {
    await stripe.checkout.sessions.expire(id);
  } catch {
    // already paid or already closed: nothing to do
  }
};

export const checkout = asyncHandler(async (req, res) => {
  const settings = await getSettings();
  if (!settings.isEnabled) throw new ApiError(403, "Wholesale ordering is not available right now.");
  // only an approved wholesale account may check out (never a guest or a normal customer)
  const { user, partner } = await requireBuyer(req);
  const b = req.body || {};
  const attemptId = String(b.attemptId || "");
  if (!/^[A-Za-z0-9-]{16,64}$/.test(attemptId)) throw new ApiError(400, "Please refresh the page and try again.");

  // cart: server prices only
  const items = Array.isArray(b.items) ? b.items : [];
  if (!items.length || items.length > 60) throw new ApiError(400, "Your cart is empty.");
  const merged = new Map();
  for (const it of items) {
    const packId = String(it?.packId || "");
    const qty = Number(it?.qty);
    if (!packId || !Number.isInteger(qty) || qty < 1 || qty > 999) throw new ApiError(400, "Please check the box quantities.");
    merged.set(packId, Math.min(999, (merged.get(packId) || 0) + qty));
  }
  const packs = await prisma.wholesalePack.findMany({
    where: { id: { in: [...merged.keys()] }, isActive: true, product: { isDeleted: false, isActive: true, wholesaleEnabled: true } },
    include: { product: { select: { id: true, name: true } } },
  });
  if (packs.length !== merged.size) throw new ApiError(409, "Some items are no longer available. Please refresh the page.");
  let subtotal = 0;
  let totalBoxes = 0;
  const lines = packs.map((k) => {
    const qty = merged.get(k.id);
    const lineTotal = Math.round(num(k.price) * qty * 100) / 100;
    subtotal += lineTotal;
    totalBoxes += qty;
    return { productId: k.product.id, packId: k.id, productName: k.product.name, packLabel: k.label, contains: k.contains, detail: k.detail || "", unitPrice: k.price, qty, lineTotal };
  });
  if (totalBoxes < settings.minBoxes) throw new ApiError(400, `The minimum order is ${settings.minBoxes} boxes.`);
  subtotal = Math.round(subtotal * 100) / 100;
  const shippingCost = num(settings.shippingFlat);
  const total = Math.round((subtotal + shippingCost) * 100) / 100;

  // buyer details (access was already checked above)
  const buyer = { business: partner.business, name: partner.contact, email: String(user.email).toLowerCase(), phone: clean(b.phone, 40) || partner.phone };
  const addr = validateUsAddress({ street: b.street, city: b.city, state: b.state, postalCode: b.postalCode, phone: buyer.phone, country: "US" });
  if (addr.errors) throw new ApiError(400, Object.values(addr.errors)[0]);
  const a = addr.value;
  const shippingAddress = `${a.street}, ${a.city}, ${a.state} ${a.postalCode}, USA`;
  const note = clean(b.note, 500) || null;

  const { stripe } = await getStripeContext();
  const base = baseUrl(req);
  if (!base) throw new ApiError(500, "Site URL is not configured");

  const orderData = {
    userId: user.id, partnerId: partner.id, buyerName: buyer.name, buyerEmail: buyer.email, buyerPhone: a.phone, business: buyer.business,
    subtotal, shippingCost, total, totalBoxes, shippingAddress, customerNote: note,
  };

  // one attempt = one order
  let order = await prisma.wholesaleOrder.findUnique({ where: { attemptId } });
  if (order && order.paymentStatus === "paid") return ok(res, { paid: true, orderNumber: order.orderNumber });
  if (order && order.userId && user.id !== order.userId) throw new ApiError(409, "Please refresh the page and try again.");

  if (order) {
    // reuse the open Stripe page when nothing changed (double click, reopened tab)
    if (order.stripeSessionId && cents(order.total) === cents(total) && order.buyerEmail === buyer.email) {
      try {
        const old = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (old.status === "open" && old.url) return ok(res, { url: old.url });
        if (old.payment_status === "paid") {
          await fulfillWholesaleSession(old);
          return ok(res, { paid: true, orderNumber: order.orderNumber });
        }
      } catch {
        // fall through and build a fresh page
      }
    }
    await closeSession(stripe, order.stripeSessionId);
    const orderId = order.id;
    order = await prisma.$transaction(async (tx) => {
      await tx.wholesaleOrderItem.deleteMany({ where: { orderId } });
      return tx.wholesaleOrder.update({ where: { id: orderId }, data: { ...orderData, stripeSessionId: null, items: { create: lines } } });
    });
  } else {
    try {
      order = await prisma.wholesaleOrder.create({ data: { ...orderData, orderNumber: orderNumber(), attemptId, items: { create: lines } } });
    } catch (e) {
      if (e?.code === "P2002") throw new ApiError(409, "Your order is already being processed. Please wait a moment and try again.");
      throw e;
    }
  }

  const lineItems = lines.map((l) => ({
    quantity: l.qty,
    price_data: { currency: "usd", unit_amount: cents(l.unitPrice), product_data: { name: `${l.productName} - ${l.packLabel}`, description: [l.contains, l.detail].filter(Boolean).join(" - ").slice(0, 200) || undefined } },
  }));
  if (shippingCost > 0) lineItems.push({ quantity: 1, price_data: { currency: "usd", unit_amount: cents(shippingCost), product_data: { name: "Shipping" } } });

  const meta = { kind: "wholesale", orderId: order.id, orderNumber: order.orderNumber };
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: order.id,
    customer_email: buyer.email,
    line_items: lineItems,
    metadata: meta,
    payment_intent_data: { metadata: meta },
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
    success_url: `${base}/wholesale?paid=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/wholesale?canceled=1`,
  });
  await prisma.wholesaleOrder.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  ok(res, { url: session.url });
});

// Turns a PAID Stripe session into a paid order. Safe to call twice (return page + webhook): only the first call changes the order.
export async function fulfillWholesaleSession(session) {
  const orderId = session?.metadata?.orderId;
  if (!orderId || session.metadata?.kind !== "wholesale") return null;
  const order = await prisma.wholesaleOrder.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return null;
  if (session.payment_status !== "paid") return order;

  if (session.amount_total !== cents(order.total)) {
    console.error(`wholesale: amount mismatch on ${order.orderNumber}: paid ${session.amount_total}, expected ${cents(order.total)}`);
    await prisma.wholesaleOrder.update({ where: { id: order.id }, data: { adminNote: `CHECK PAYMENT: Stripe session ${session.id} paid ${money(session.amount_total / 100)} but the order total is ${money(order.total)}.` } });
    return order;
  }

  if (order.paymentStatus === "paid" && order.stripeSessionId && order.stripeSessionId !== session.id) {
    // a second page was paid for the same order: give that payment back
    try {
      const { stripe } = await getStripeContext();
      if (session.payment_intent) await stripe.refunds.create({ payment_intent: String(session.payment_intent), reason: "duplicate" }, { idempotencyKey: `ws-dup-${session.id}` });
      await prisma.wholesaleOrder.update({ where: { id: order.id }, data: { adminNote: `${order.adminNote ? `${order.adminNote}\n` : ""}A duplicate payment (${session.id}) was refunded automatically.` } });
    } catch (e) {
      console.error("wholesale duplicate refund failed:", e?.message || e);
    }
    return order;
  }

  const r = await prisma.wholesaleOrder.updateMany({
    where: { id: order.id, paymentStatus: { not: "paid" } },
    data: { paymentStatus: "paid", status: "received", paidAt: new Date(), stripeSessionId: session.id, paymentIntentId: session.payment_intent ? String(session.payment_intent) : null },
  });
  const fresh = await prisma.wholesaleOrder.findUnique({ where: { id: order.id }, include: { items: true } });
  if (r.count === 1) {
    const rows = fresh.items.map((i) => `<tr><td>${esc(i.productName)} - ${esc(i.packLabel)}</td><td align="right">${i.qty} x ${money(i.unitPrice)}</td><td align="right">${money(i.lineTotal)}</td></tr>`).join("");
    const table = `<table cellpadding="6" width="100%">${rows}<tr><td colspan="2">Shipping</td><td align="right">${money(fresh.shippingCost)}</td></tr><tr><td colspan="2"><b>Total paid</b></td><td align="right"><b>${money(fresh.total)}</b></td></tr></table>`;
    await mail(fresh.buyerEmail, `Your MWP wholesale order ${fresh.orderNumber}`, `<p>Hi ${esc(fresh.buyerName)}, thank you. Your payment was received.</p>${table}<p>Ship to: ${esc(fresh.shippingAddress)}</p><p>We will email your tracking number as soon as the order ships.</p>`);
    await mail(adminEmail(), `New wholesale order ${fresh.orderNumber}: ${fresh.business}`, `<h2>Paid wholesale order ${esc(fresh.orderNumber)}</h2><p>${esc(fresh.business)} - ${esc(fresh.buyerName)} - ${esc(fresh.buyerEmail)} - ${esc(fresh.buyerPhone)}</p>${table}<p>Ship to: ${esc(fresh.shippingAddress)}</p>${fresh.customerNote ? `<p>Note: ${esc(fresh.customerNote)}</p>` : ""}`);
  }
  return fresh;
}

// the return page calls this with the session id Stripe sent the buyer back with
export const confirm = asyncHandler(async (req, res) => {
  const sessionId = String(req.body?.sessionId || "");
  if (!/^cs_[A-Za-z0-9_]{10,200}$/.test(sessionId)) throw new ApiError(400, "Missing payment session");
  const { stripe } = await getStripeContext();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.metadata?.kind !== "wholesale") throw new ApiError(404, "Payment session not found");
  const order = await fulfillWholesaleSession(session);
  if (!order) throw new ApiError(404, "Order not found");
  const paid = order.paymentStatus === "paid";
  ok(res, { paid, order: paid ? { orderNumber: order.orderNumber, totalBoxes: order.totalBoxes, total: num(order.total) } : null });
});

const publicOrder = (o) => ({
  id: o.id, orderNumber: o.orderNumber, status: o.status, paymentStatus: o.paymentStatus,
  totalBoxes: o.totalBoxes, subtotal: num(o.subtotal), shippingCost: num(o.shippingCost), total: num(o.total),
  carrier: o.carrier, trackingNumber: o.trackingNumber, createdAt: o.paidAt || o.createdAt,
  items: o.items.map((i) => ({ productName: i.productName, packLabel: i.packLabel, contains: i.contains, qty: i.qty, unitPrice: num(i.unitPrice), lineTotal: num(i.lineTotal) })),
});

// approved buyers see their paid wholesale orders (also listed in their account)
export const myOrders = asyncHandler(async (req, res) => {
  const user = await optionalUser(req);
  if (!user) throw new ApiError(401, "Please sign in to see your wholesale orders.");
  const orders = await prisma.wholesaleOrder.findMany({
    where: { paymentStatus: { in: ["paid", "refunded"] }, userId: user.id },
    orderBy: { createdAt: "desc" }, take: 50, include: { items: true },
  });
  ok(res, { orders: orders.map(publicOrder) });
});

/* ------------------------------ admin: buyers (who may order wholesale) ------------------------------ */

const buyerRow = (p) => ({
  id: p.id, business: p.business, contact: p.contact, email: p.email, phone: p.phone, businessType: p.businessType, ein: p.ein, address: p.address,
  notes: p.notes, status: p.status, adminNote: p.adminNote, hasAccount: !!p.userId, approvedAt: p.approvedAt, createdAt: p.createdAt, orderCount: p._count?.orders ?? 0,
});

export const adminBuyers = asyncHandler(async (req, res) => {
  const status = ["pending", "approved", "rejected", "suspended"].includes(req.query.status) ? req.query.status : undefined;
  const search = clean(req.query.search, 80);
  const where = {
    ...(status ? { status } : {}),
    ...(search ? { OR: [{ business: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }, { contact: { contains: search, mode: "insensitive" } }] } : {}),
  };
  const [rows, pending] = await Promise.all([
    prisma.wholesalePartner.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { orders: true } } } }),
    prisma.wholesalePartner.count({ where: { status: "pending" } }),
  ]);
  ok(res, { buyers: rows.map(buyerRow), pending });
});

// The team adds a wholesale buyer by email. They sign in with that email on the store and get access straight away.
export const adminAddBuyer = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const f = { business: clean(b.business, 140), contact: clean(b.contact, 100), email: clean(b.email, 200).toLowerCase(), phone: clean(b.phone, 40) || "-", address: clean(b.address, 300) || "-", businessType: clean(b.businessType, 60) || "Wholesale buyer" };
  if (!f.business || !f.contact || !f.email) throw new ApiError(400, "Business name, contact name and email are required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) throw new ApiError(400, "Please enter a valid email.");
  if (await prisma.wholesalePartner.findUnique({ where: { email: f.email } })) throw new ApiError(409, "A buyer with this email already exists. Find them in the list and approve them.");
  const buyer = await prisma.wholesalePartner.create({ data: { ...f, status: "approved", approvedAt: new Date() }, include: { _count: { select: { orders: true } } } });
  await mail(f.email, "You can now order MWP wholesale", `<p>Hi ${esc(f.contact)}, your MWP wholesale access is ready.</p><p>Create or sign in to your account with <b>${esc(f.email)}</b> at <a href="${wholesaleLink()}">${wholesaleLink()}</a> and you will see your wholesale prices.</p>`);
  ok(res, { buyer: buyerRow(buyer) }, "Buyer added", 201);
});

export const adminBuyerAction = asyncHandler(async (req, res) => {
  const buyer = await prisma.wholesalePartner.findUnique({ where: { id: req.params.id } });
  if (!buyer) throw new ApiError(404, "Buyer not found");
  const next = { approve: "approved", reject: "rejected", suspend: "suspended" }[req.params.action];
  if (!next) throw new ApiError(400, "Unknown action");
  await prisma.wholesalePartner.update({ where: { id: buyer.id }, data: { status: next, approvedAt: next === "approved" ? buyer.approvedAt || new Date() : buyer.approvedAt } });
  if (next === "approved" && buyer.status !== "approved") {
    await mail(buyer.email, "Your MWP wholesale access is approved", `<p>Hi ${esc(buyer.contact)}, you are approved for MWP wholesale ordering.</p><p>Sign in to your account with <b>${esc(buyer.email)}</b> at <a href="${wholesaleLink()}">${wholesaleLink()}</a> to see your wholesale prices and order.</p>`);
  }
  ok(res, {}, next === "approved" ? "Buyer approved" : next === "rejected" ? "Request rejected" : "Buyer suspended");
});

export const adminBuyerNote = asyncHandler(async (req, res) => {
  await prisma.wholesalePartner.update({ where: { id: req.params.id }, data: { adminNote: clean(req.body?.adminNote, 1000) || null } });
  ok(res, {}, "Saved");
});

/* ------------------------------ admin: settings + products ------------------------------ */

export const adminGetSettings = asyncHandler(async (req, res) => {
  const s = await getSettings();
  ok(res, { settings: { isEnabled: s.isEnabled, minBoxes: s.minBoxes, shippingFlat: num(s.shippingFlat) } });
});

export const adminSaveSettings = asyncHandler(async (req, res) => {
  const b = req.body || {};
  const minBoxes = Number(b.minBoxes);
  const shippingFlat = Number(b.shippingFlat);
  if (!Number.isInteger(minBoxes) || minBoxes < 1 || minBoxes > 1000) throw new ApiError(400, "Minimum boxes must be a whole number from 1 to 1000.");
  if (!(shippingFlat >= 0) || shippingFlat > 1000) throw new ApiError(400, "Shipping must be between $0 and $1000.");
  const data = { isEnabled: !!b.isEnabled, minBoxes, shippingFlat: Math.round(shippingFlat * 100) / 100 };
  await prisma.wholesaleSettings.upsert({ where: { id: "main" }, update: data, create: { id: "main", ...data } });
  ok(res, {}, "Settings saved");
});

export const adminProducts = asyncHandler(async (req, res) => {
  const products = await prisma.product.findMany({
    where: { isDeleted: false },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true, isActive: true, wholesaleEnabled: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
      wholesalePacks: { orderBy: { order: "asc" } },
    },
  });
  ok(res, {
    products: products.map((p) => ({
      id: p.id, name: p.name, slug: p.slug, isActive: p.isActive, wholesaleEnabled: p.wholesaleEnabled,
      image: p.images[0]?.url ? getFileUrl(p.images[0].url) : null,
      packs: p.wholesalePacks.map((k) => ({ id: k.id, type: k.type, label: k.label, contains: k.contains, detail: k.detail, unit: k.unit, units: k.units, price: num(k.price), isActive: k.isActive })),
    })),
  });
});

export const adminSaveProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({ where: { id: req.params.id, isDeleted: false }, select: { id: true } });
  if (!product) throw new ApiError(404, "Product not found");
  const enabled = !!req.body?.wholesaleEnabled;
  const raw = Array.isArray(req.body?.packs) ? req.body.packs : [];
  if (raw.length > 8) throw new ApiError(400, "At most 8 packs per product.");
  const packs = raw.map((k, i) => {
    const type = k.type === "blister" ? "blister" : "bottle";
    const price = Number(k.price);
    const units = Number(k.units);
    const label = clean(k.label, 60);
    if (!label) throw new ApiError(400, "Every pack needs a name.");
    if (!(price > 0) || price > 100000) throw new ApiError(400, `Enter a price for "${label}".`);
    if (!Number.isInteger(units) || units < 1 || units > 10000) throw new ApiError(400, `Enter how many items are in "${label}".`);
    return { id: typeof k.id === "string" ? k.id : null, type, label, contains: clean(k.contains, 80), detail: clean(k.detail, 120), unit: clean(k.unit, 20) || (type === "bottle" ? "bottle" : "pack"), units, price: Math.round(price * 100) / 100, isActive: k.isActive !== false, order: i };
  });
  if (enabled && !packs.some((k) => k.isActive)) throw new ApiError(400, "Add at least one active pack before turning wholesale on.");

  await prisma.$transaction(async (tx) => {
    const keep = packs.filter((k) => k.id).map((k) => k.id);
    await tx.wholesalePack.deleteMany({ where: { productId: product.id, id: { notIn: keep } } });
    for (const k of packs) {
      const { id, ...data } = k;
      if (id) await tx.wholesalePack.updateMany({ where: { id, productId: product.id }, data });
      else await tx.wholesalePack.create({ data: { ...data, productId: product.id } });
    }
    await tx.product.update({ where: { id: product.id }, data: { wholesaleEnabled: enabled } });
  });
  ok(res, {}, "Wholesale settings saved");
});

/* ------------------------------ admin: orders (their own payment list) ------------------------------ */

const adminOrderRow = (o) => ({
  id: o.id, orderNumber: o.orderNumber, status: o.status, paymentStatus: o.paymentStatus, paymentNote: o.paymentNote, invoiceNumber: o.invoiceNumber,
  paidAt: o.paidAt, paymentIntentId: o.paymentIntentId, hasAccount: !!o.userId,
  totalBoxes: o.totalBoxes, subtotal: num(o.subtotal), shippingCost: num(o.shippingCost), total: num(o.total), shippingAddress: o.shippingAddress,
  customerNote: o.customerNote, carrier: o.carrier, trackingNumber: o.trackingNumber, adminNote: o.adminNote, createdAt: o.createdAt,
  buyer: { business: o.business, name: o.buyerName, email: o.buyerEmail, phone: o.buyerPhone },
  items: o.items?.map((i) => ({ id: i.id, productName: i.productName, packLabel: i.packLabel, contains: i.contains, detail: i.detail, qty: i.qty, unitPrice: num(i.unitPrice), lineTotal: num(i.lineTotal) })),
});

const ORDER_STATUS = ["pending_payment", "received", "shipped", "delivered", "cancelled"];
const PAY_STATUS = ["unpaid", "paid", "refunded"];

export const adminOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const search = clean(req.query.search, 80);
  const status = ORDER_STATUS.includes(req.query.status) ? req.query.status : null;
  const where = {
    // abandoned checkouts (never paid) stay out of the list unless asked for
    ...(status ? { status } : { status: { not: "pending_payment" } }),
    ...(PAY_STATUS.includes(req.query.paymentStatus) ? { paymentStatus: req.query.paymentStatus } : {}),
    ...(search ? { OR: [{ orderNumber: { contains: search, mode: "insensitive" } }, { business: { contains: search, mode: "insensitive" } }, { buyerEmail: { contains: search, mode: "insensitive" } }, { buyerName: { contains: search, mode: "insensitive" } }] } : {}),
  };
  const [rows, total, paid, toShip] = await Promise.all([
    prisma.wholesaleOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { items: true } }),
    prisma.wholesaleOrder.count({ where }),
    prisma.wholesaleOrder.aggregate({ where: { paymentStatus: "paid" }, _sum: { total: true } }),
    prisma.wholesaleOrder.count({ where: { status: "received" } }),
  ]);
  ok(res, { orders: rows.map(adminOrderRow), pagination: { page, pages: Math.max(1, Math.ceil(total / limit)), total }, summary: { paidTotal: num(paid._sum.total || 0), toShip } });
});

export const adminUpdateOrder = asyncHandler(async (req, res) => {
  const order = await prisma.wholesaleOrder.findUnique({ where: { id: req.params.id } });
  if (!order) throw new ApiError(404, "Order not found");
  const b = req.body || {};
  const data = {};
  if (b.status !== undefined) {
    if (!ORDER_STATUS.includes(b.status)) throw new ApiError(400, "Invalid order status");
    if (order.paymentStatus !== "paid" && ["shipped", "delivered"].includes(b.status)) throw new ApiError(400, "This order has not been paid yet.");
    data.status = b.status;
  }
  for (const [k, max] of [["paymentNote", 300], ["invoiceNumber", 60], ["carrier", 60], ["trackingNumber", 80], ["adminNote", 1000]]) {
    if (b[k] !== undefined) data[k] = clean(b[k], max) || null;
  }
  const updated = await prisma.wholesaleOrder.update({ where: { id: order.id }, data, include: { items: true } });
  if (data.status === "shipped" && order.status !== "shipped") {
    await mail(order.buyerEmail, `Your wholesale order ${order.orderNumber} has shipped`, `<p>Hi ${esc(order.buyerName)}, your order has shipped.</p>${updated.carrier || updated.trackingNumber ? `<p>Carrier: <b>${esc(updated.carrier || "-")}</b><br>Tracking number: <b>${esc(updated.trackingNumber || "-")}</b></p>` : ""}`);
  }
  ok(res, { order: adminOrderRow(updated) }, "Order updated");
});

// full refund through Stripe; the order is cancelled
export const adminRefundOrder = asyncHandler(async (req, res) => {
  const order = await prisma.wholesaleOrder.findUnique({ where: { id: req.params.id } });
  if (!order) throw new ApiError(404, "Order not found");
  if (order.paymentStatus !== "paid" || !order.paymentIntentId) throw new ApiError(400, "Only a paid order can be refunded.");
  const { stripe } = await getStripeContext();
  await stripe.refunds.create({ payment_intent: order.paymentIntentId, reason: "requested_by_customer" }, { idempotencyKey: `ws-refund-${order.id}` });
  const updated = await prisma.wholesaleOrder.update({ where: { id: order.id }, data: { paymentStatus: "refunded", status: "cancelled" }, include: { items: true } });
  await mail(order.buyerEmail, `Refund for wholesale order ${order.orderNumber}`, `<p>Hi ${esc(order.buyerName)}, we refunded ${money(order.total)} to your card for order ${esc(order.orderNumber)}. It can take 5 to 10 business days to show on your statement.</p>`);
  ok(res, { order: adminOrderRow(updated) }, "Refund sent");
});
