import crypto from "crypto";
import jwt from "jsonwebtoken";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import s3client from "../utils/s3client.js";
import { getFileUrl } from "../utils/deleteFromS3.js";
import sendEmail from "../utils/sendEmail.js";
import { getFromEmail } from "../utils/storeConfig.js";

// Wholesale portal: approved business partners order by the box at their own prices.
// Security notes: access codes are random and stored only as a hash; prices and totals are always
// recomputed on the server; the resale certificate is a private file only admins can open;
// login and application endpoints are rate limited and answer generically.

const ok = (res, data, message = "OK", code = 200) => res.status(code).json(new ApiResponsive(code, data, message));
const MIN_BOXES = Math.max(1, Number(process.env.WHOLESALE_MIN_BOXES) || 4);
const COOKIE = "wholesaleToken";
const TOKEN_HOURS = 12;
const num = (d) => Number(d);
const money = (n) => `$${num(n).toFixed(2)}`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const adminEmail = () => process.env.WHOLESALE_ADMIN_EMAIL || getFromEmail();
const siteUrl = () => (process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://www.mwpsupplements.com").replace(/\/$/, "");

const secret = () => `${process.env.ACCESS_JWT_SECRET}|wholesale`;
const hashCode = (code) => crypto.createHash("sha256").update(`${String(code).trim().toUpperCase()}|${process.env.ENCRYPTION_KEY || ""}`).digest("hex");
const newCode = () => {
  const a = crypto.randomBytes(8).toString("hex").toUpperCase(); // 64 bits
  return `MWP-${a.slice(0, 4)}-${a.slice(4, 8)}-${a.slice(8, 12)}-${a.slice(12, 16)}`;
};
const cookieOptions = () => {
  const prod = process.env.NODE_ENV === "production";
  return { httpOnly: true, secure: prod, sameSite: prod ? "none" : "lax", path: "/", ...(prod && process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}) };
};

// emails never block or break the request
const mail = async (to, subject, html) => {
  try {
    await sendEmail({ email: to, subject, html: `<div style="font-family:Arial,sans-serif;color:#12213F;max-width:560px">${html}<p style="color:#6B7388;font-size:12px">MWP Supplements</p></div>` });
  } catch (e) {
    console.error("wholesale email failed:", e?.message || e);
  }
};

/* ------------------------------ limits ------------------------------ */

const limiter = (windowMs, max, message) =>
  rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, keyGenerator: (req) => ipKeyGenerator(req.ip || ""), message: { success: false, message } });
export const applyLimiter = limiter(60 * 60 * 1000, 6, "Too many applications from this connection. Please try again later.");
export const loginLimiter = limiter(15 * 60 * 1000, 12, "Too many sign-in attempts. Please wait a few minutes.");
export const orderLimiter = limiter(60 * 60 * 1000, 40, "Too many orders in a short time. Please wait a moment.");

/* ------------------------------ partner auth ------------------------------ */

export const requirePartner = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.[COOKIE];
  if (!token) throw new ApiError(401, "Please sign in to the wholesale portal.");
  let decoded;
  try {
    decoded = jwt.verify(token, secret());
  } catch {
    throw new ApiError(401, "Your session ended. Please sign in again.");
  }
  const partner = await prisma.wholesalePartner.findUnique({ where: { id: decoded.pid } });
  if (!partner || partner.status !== "approved") throw new ApiError(401, "This wholesale account is not active.");
  req.partner = partner;
  next();
});

const publicPartner = (p) => ({ id: p.id, business: p.business, contact: p.contact, email: p.email, address: p.address });

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const code = String(req.body?.code || "").trim();
  const generic = new ApiError(401, "Email or access code is not correct.");
  if (!email || !code || email.length > 200 || code.length > 60) throw generic;

  const partner = await prisma.wholesalePartner.findUnique({ where: { email } });
  if (!partner || partner.status !== "approved" || !partner.codeHash) {
    await new Promise((r) => setTimeout(r, 350)); // keeps timing similar for unknown emails
    throw generic;
  }
  if (partner.lockedUntil && partner.lockedUntil > new Date()) throw new ApiError(429, "Too many wrong codes. Please try again in 15 minutes.");

  const given = Buffer.from(hashCode(code));
  const real = Buffer.from(partner.codeHash);
  const match = given.length === real.length && crypto.timingSafeEqual(given, real);
  if (!match) {
    const failed = partner.failedLogins + 1;
    await prisma.wholesalePartner.update({
      where: { id: partner.id },
      data: failed >= 8 ? { failedLogins: 0, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) } : { failedLogins: failed },
    });
    throw generic;
  }

  await prisma.wholesalePartner.update({ where: { id: partner.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  const token = jwt.sign({ pid: partner.id, typ: "wholesale" }, secret(), { expiresIn: `${TOKEN_HOURS}h` });
  res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: TOKEN_HOURS * 3600 * 1000 });
  ok(res, { partner: publicPartner(partner), minBoxes: MIN_BOXES }, "Signed in");
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie(COOKIE, cookieOptions());
  ok(res, {}, "Signed out");
});

export const me = asyncHandler(async (req, res) => ok(res, { partner: publicPartner(req.partner), minBoxes: MIN_BOXES }));

/* ------------------------------ application ------------------------------ */

const sniff = (buf) => {
  if (buf.length < 12) return null;
  if (buf.slice(0, 4).toString("latin1") === "%PDF") return { ext: "pdf", type: "application/pdf" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", type: "image/png" };
  if (buf.slice(0, 4).toString("latin1") === "RIFF" && buf.slice(8, 12).toString("latin1") === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
};

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

export const apply = asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (clean(b.website, 50)) return ok(res, {}, "Application received"); // spam trap

  const f = {
    business: clean(b.business, 140),
    contact: clean(b.contact, 100),
    email: clean(b.email, 200).toLowerCase(),
    phone: clean(b.phone, 40),
    businessType: clean(b.businessType, 60),
    ein: clean(b.ein, 40),
    address: clean(b.address, 300),
    volume: clean(b.volume, 60),
    notes: clean(b.notes, 1000),
    interested: [].concat(b.products || []).map((x) => clean(x, 40)).filter(Boolean).slice(0, 12).join(", "),
  };
  for (const k of ["business", "contact", "email", "phone", "businessType", "ein", "address"]) {
    if (!f[k]) throw new ApiError(400, "Please fill in all required fields.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) throw new ApiError(400, "Please enter a valid email.");

  const file = req.file;
  if (!file || !file.buffer?.length) throw new ApiError(400, "Please attach your resale certificate.");
  if (file.size > 10 * 1024 * 1024) throw new ApiError(400, "The certificate must be under 10 MB.");
  const kind = sniff(file.buffer);
  if (!kind) throw new ApiError(400, "The certificate must be a PDF, JPG, PNG or WEBP file.");

  const existing = await prisma.wholesalePartner.findUnique({ where: { email: f.email } });
  // same answer whether or not the email is already known (no account probing)
  if (existing) return ok(res, {}, "Application received");

  const id = crypto.randomUUID();
  const key = `${process.env.UPLOAD_FOLDER || "mwp"}/wholesale-private/${id}.${kind.ext}`;
  await s3client.send(new PutObjectCommand({ Bucket: process.env.SPACES_BUCKET, Key: key, Body: file.buffer, ContentType: kind.type, ACL: "private" }));

  await prisma.wholesalePartner.create({ data: { id, ...f, volume: f.volume || null, notes: f.notes || null, interested: f.interested || null, ein: f.ein, certificateKey: key, certificateName: clean(file.originalname, 120) || `certificate.${kind.ext}` } });

  const rows = [["Business", f.business], ["Contact", f.contact], ["Email", f.email], ["Phone", f.phone], ["Type", f.businessType], ["Address", f.address], ["Expected volume", f.volume || "-"]];
  await mail(adminEmail(), `New wholesale application: ${f.business}`, `<h2>New wholesale application</h2><table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("")}</table><p>Review it in Admin → Wholesale → Partners.</p>`);
  await mail(f.email, "We received your MWP wholesale application", `<p>Hi ${esc(f.contact)},</p><p>Thank you for applying to the MWP Supplements wholesale program. Our team will review your details and email your wholesale access code once you are approved.</p>`);
  ok(res, {}, "Application received", 201);
});

/* ------------------------------ catalog + orders (partner) ------------------------------ */

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
  const products = await prisma.product.findMany({
    where: { isDeleted: false, isActive: true, wholesaleEnabled: true, wholesalePacks: { some: { isActive: true } } },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, slug: true, description: true,
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1, select: { url: true } },
      wholesalePacks: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  });
  const list = products.map((p) => {
    const [mid, edge] = toneFor(p.slug);
    return {
      id: p.id, name: p.name, slug: p.slug,
      desc: String(p.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90),
      image: p.images[0]?.url ? getFileUrl(p.images[0].url) : null,
      bg: `radial-gradient(circle at 50% 46%, #fff 0%, ${mid} 52%, ${edge} 135%)`,
      packs: p.wholesalePacks.map((k) => ({ id: k.id, type: k.type, label: k.label, contains: k.contains, detail: k.detail, unit: k.unit, units: k.units, price: num(k.price) })),
    };
  });
  ok(res, { minBoxes: MIN_BOXES, products: list });
});

const orderNumber = () => `W${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${crypto.randomInt(1000, 9999)}`;

export const createOrder = asyncHandler(async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
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
  if (totalBoxes < MIN_BOXES) throw new ApiError(400, `The minimum order is ${MIN_BOXES} boxes.`);
  subtotal = Math.round(subtotal * 100) / 100;

  const order = await prisma.wholesaleOrder.create({
    data: {
      orderNumber: orderNumber(), partnerId: req.partner.id, subtotal, total: subtotal, totalBoxes,
      shippingAddress: req.partner.address, customerNote: clean(req.body?.note, 500) || null,
      items: { create: lines },
    },
    include: { items: true },
  });

  const table = order.items.map((i) => `<tr><td>${esc(i.productName)} · ${esc(i.packLabel)}</td><td align="right">${i.qty} × ${money(i.unitPrice)}</td><td align="right">${money(i.lineTotal)}</td></tr>`).join("");
  const body = `<table cellpadding="6" width="100%">${table}<tr><td colspan="2"><b>Subtotal</b></td><td align="right"><b>${money(order.subtotal)}</b></td></tr></table>`;
  await mail(adminEmail(), `New wholesale order ${order.orderNumber}: ${req.partner.business}`, `<h2>New wholesale order ${esc(order.orderNumber)}</h2><p>${esc(req.partner.business)} · ${esc(req.partner.email)}</p>${body}<p>Ship to: ${esc(order.shippingAddress)}</p><p>Send the invoice from Admin → Wholesale → Orders.</p>`);
  await mail(req.partner.email, `We received your wholesale order ${order.orderNumber}`, `<p>Hi ${esc(req.partner.contact)}, thank you for your order.</p>${body}<p>We will email your invoice shortly, and your tracking number as soon as the order ships. Shipping is added on the invoice.</p>`);

  ok(res, { order: { id: order.id, orderNumber: order.orderNumber, totalBoxes: order.totalBoxes, subtotal: num(order.subtotal) } }, "Order received", 201);
});

const publicOrder = (o) => ({
  id: o.id, orderNumber: o.orderNumber, status: o.status, paymentStatus: o.paymentStatus, invoiceNumber: o.invoiceNumber,
  totalBoxes: o.totalBoxes, subtotal: num(o.subtotal), shippingCost: num(o.shippingCost), total: num(o.total),
  carrier: o.carrier, trackingNumber: o.trackingNumber, createdAt: o.createdAt,
  items: o.items.map((i) => ({ productName: i.productName, packLabel: i.packLabel, contains: i.contains, qty: i.qty, unitPrice: num(i.unitPrice), lineTotal: num(i.lineTotal) })),
});

export const myOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.wholesaleOrder.findMany({ where: { partnerId: req.partner.id }, orderBy: { createdAt: "desc" }, take: 50, include: { items: true } });
  ok(res, { orders: orders.map(publicOrder) });
});

/* ------------------------------ admin: products ------------------------------ */

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
    minBoxes: MIN_BOXES,
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

/* ------------------------------ admin: partners ------------------------------ */

const adminPartnerRow = (p) => ({
  id: p.id, business: p.business, contact: p.contact, email: p.email, phone: p.phone, businessType: p.businessType, ein: p.ein,
  address: p.address, volume: p.volume, interested: p.interested, notes: p.notes, status: p.status, codeHint: p.codeHint,
  hasCertificate: !!p.certificateKey, certificateName: p.certificateName, adminNote: p.adminNote,
  approvedAt: p.approvedAt, lastLoginAt: p.lastLoginAt, createdAt: p.createdAt, orderCount: p._count?.orders ?? undefined,
});

export const adminPartners = asyncHandler(async (req, res) => {
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
  ok(res, { partners: rows.map(adminPartnerRow), pending });
});

export const adminPartnerAction = asyncHandler(async (req, res) => {
  const partner = await prisma.wholesalePartner.findUnique({ where: { id: req.params.id } });
  if (!partner) throw new ApiError(404, "Partner not found");
  const action = req.params.action;

  if (action === "approve" || action === "reset-code") {
    if (action === "reset-code" && partner.status !== "approved") throw new ApiError(400, "Approve the partner first.");
    const code = newCode(); // shown once to the admin and emailed to the partner; only its hash is stored
    await prisma.wholesalePartner.update({
      where: { id: partner.id },
      data: { status: "approved", codeHash: hashCode(code), codeHint: code.slice(-4), approvedAt: partner.approvedAt || new Date(), failedLogins: 0, lockedUntil: null },
    });
    await mail(partner.email, "Your MWP wholesale access code", `<p>Hi ${esc(partner.contact)},</p><p>${action === "approve" ? "You are approved as an MWP Supplements wholesale partner." : "Here is your new wholesale access code."}</p><p>Your access code: <b style="font-size:18px;letter-spacing:1px">${esc(code)}</b></p><p>Sign in with this email address and the code at <a href="${siteUrl()}/wholesale/order">${siteUrl()}/wholesale/order</a>. Please keep the code private.</p>`);
    return ok(res, { code }, action === "approve" ? "Partner approved" : "New code created");
  }
  if (action === "reject" || action === "suspend") {
    await prisma.wholesalePartner.update({ where: { id: partner.id }, data: { status: action === "reject" ? "rejected" : "suspended", codeHash: null, codeHint: null } });
    return ok(res, {}, action === "reject" ? "Application rejected" : "Partner suspended");
  }
  throw new ApiError(400, "Unknown action");
});

export const adminPartnerNote = asyncHandler(async (req, res) => {
  await prisma.wholesalePartner.update({ where: { id: req.params.id }, data: { adminNote: clean(req.body?.adminNote, 1000) || null } });
  ok(res, {}, "Saved");
});

// the resale certificate is private: streamed only to a signed-in admin
export const adminCertificate = asyncHandler(async (req, res) => {
  const p = await prisma.wholesalePartner.findUnique({ where: { id: req.params.id }, select: { certificateKey: true, certificateName: true } });
  if (!p?.certificateKey) throw new ApiError(404, "No certificate on file");
  const obj = await s3client.send(new GetObjectCommand({ Bucket: process.env.SPACES_BUCKET, Key: p.certificateKey }));
  res.setHeader("Content-Type", obj.ContentType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(p.certificateName || "certificate")}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  obj.Body.pipe(res);
});

/* ------------------------------ admin: orders ------------------------------ */

const adminOrderRow = (o) => ({
  id: o.id, orderNumber: o.orderNumber, status: o.status, paymentStatus: o.paymentStatus, paymentNote: o.paymentNote, invoiceNumber: o.invoiceNumber,
  totalBoxes: o.totalBoxes, subtotal: num(o.subtotal), shippingCost: num(o.shippingCost), total: num(o.total), shippingAddress: o.shippingAddress,
  customerNote: o.customerNote, carrier: o.carrier, trackingNumber: o.trackingNumber, adminNote: o.adminNote, createdAt: o.createdAt,
  partner: o.partner ? { id: o.partner.id, business: o.partner.business, contact: o.partner.contact, email: o.partner.email, phone: o.partner.phone } : undefined,
  items: o.items?.map((i) => ({ id: i.id, productName: i.productName, packLabel: i.packLabel, contains: i.contains, detail: i.detail, qty: i.qty, unitPrice: num(i.unitPrice), lineTotal: num(i.lineTotal) })),
});

const ORDER_STATUS = ["received", "invoiced", "shipped", "delivered", "cancelled"];
const PAY_STATUS = ["unpaid", "invoiced", "paid", "refunded"];

export const adminOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const search = clean(req.query.search, 80);
  const where = {
    ...(ORDER_STATUS.includes(req.query.status) ? { status: req.query.status } : {}),
    ...(PAY_STATUS.includes(req.query.paymentStatus) ? { paymentStatus: req.query.paymentStatus } : {}),
    ...(search ? { OR: [{ orderNumber: { contains: search, mode: "insensitive" } }, { partner: { business: { contains: search, mode: "insensitive" } } }, { partner: { email: { contains: search, mode: "insensitive" } } }] } : {}),
  };
  const [rows, total, unpaid, openCount] = await Promise.all([
    prisma.wholesaleOrder.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: { partner: true, items: true } }),
    prisma.wholesaleOrder.count({ where }),
    prisma.wholesaleOrder.aggregate({ where: { paymentStatus: { in: ["unpaid", "invoiced"] }, status: { not: "cancelled" } }, _sum: { total: true } }),
    prisma.wholesaleOrder.count({ where: { status: { in: ["received", "invoiced"] } } }),
  ]);
  ok(res, { orders: rows.map(adminOrderRow), pagination: { page, pages: Math.max(1, Math.ceil(total / limit)), total }, summary: { awaitingPayment: num(unpaid._sum.total || 0), openOrders: openCount } });
});

export const adminUpdateOrder = asyncHandler(async (req, res) => {
  const order = await prisma.wholesaleOrder.findUnique({ where: { id: req.params.id }, include: { partner: true } });
  if (!order) throw new ApiError(404, "Order not found");
  const b = req.body || {};
  const data = {};
  if (b.status !== undefined) {
    if (!ORDER_STATUS.includes(b.status)) throw new ApiError(400, "Invalid order status");
    data.status = b.status;
  }
  if (b.paymentStatus !== undefined) {
    if (!PAY_STATUS.includes(b.paymentStatus)) throw new ApiError(400, "Invalid payment status");
    data.paymentStatus = b.paymentStatus;
  }
  for (const [k, max] of [["paymentNote", 300], ["invoiceNumber", 60], ["carrier", 60], ["trackingNumber", 80], ["adminNote", 1000]]) {
    if (b[k] !== undefined) data[k] = clean(b[k], max) || null;
  }
  if (b.shippingCost !== undefined) {
    const ship = Number(b.shippingCost);
    if (!(ship >= 0) || ship > 100000) throw new ApiError(400, "Enter a valid shipping cost");
    data.shippingCost = Math.round(ship * 100) / 100;
    data.total = Math.round((num(order.subtotal) + data.shippingCost) * 100) / 100;
  }
  const updated = await prisma.wholesaleOrder.update({ where: { id: order.id }, data, include: { partner: true, items: true } });

  if (data.status === "shipped" && order.status !== "shipped") {
    await mail(order.partner.email, `Your wholesale order ${order.orderNumber} has shipped`, `<p>Hi ${esc(order.partner.contact)}, your order has shipped.</p>${updated.carrier || updated.trackingNumber ? `<p>Carrier: <b>${esc(updated.carrier || "-")}</b><br>Tracking number: <b>${esc(updated.trackingNumber || "-")}</b></p>` : ""}`);
  }
  if (data.paymentStatus === "invoiced" && order.paymentStatus !== "invoiced") {
    await mail(order.partner.email, `Invoice for wholesale order ${order.orderNumber}`, `<p>Hi ${esc(order.partner.contact)}, here is the total for your order.</p><p>Subtotal ${money(updated.subtotal)}<br>Shipping ${money(updated.shippingCost)}<br><b>Total ${money(updated.total)}</b>${updated.invoiceNumber ? `<br>Invoice ${esc(updated.invoiceNumber)}` : ""}</p><p>Our team will send you the payment details. Reply to this email with any question.</p>`);
  }
  ok(res, { order: adminOrderRow(updated) }, "Order updated");
});
