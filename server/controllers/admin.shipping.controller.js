import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { encrypt, decrypt, maskSecret } from "../utils/encryption.js";
import { validateUsAddress } from "../utils/usValidation.js";
import { getShippingSettings, listCarrierAccounts, getEasyPostContext } from "../utils/easypost.js";
import { createLabelForOrder, voidLabelForOrder, syncTrackingForOrder, rateOrder } from "../utils/shipping.js";

const webhookUrl = (req) => {
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0];
  const base = process.env.API_PUBLIC_URL || `${proto}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}/api/webhooks/easypost`;
};

const safeMask = (value) => {
  if (!value) return null;
  try {
    return maskSecret(decrypt(value));
  } catch {
    return null;
  }
};

const present = (s, req) => ({
  isEnabled: s.isEnabled,
  bookingMode: s.bookingMode,
  keyConfigured: !!s.apiKey,
  apiKeyMasked: safeMask(s.apiKey),
  keyMode: s.keyMode,
  webhookSecretMasked: safeMask(s.webhookSecret),
  webhookUrl: webhookUrl(req),
  origin: {
    name: s.originName || "",
    company: s.originCompany || "",
    street1: s.originStreet1 || "",
    street2: s.originStreet2 || "",
    city: s.originCity || "",
    state: s.originState || "",
    zip: s.originZip || "",
    phone: s.originPhone || "",
    email: s.originEmail || "",
  },
  parcel: {
    defaultWeightLb: s.defaultWeightLb,
    packagingWeightLb: s.packagingWeightLb,
    defaultLengthIn: s.defaultLengthIn,
    defaultWidthIn: s.defaultWidthIn,
    defaultHeightIn: s.defaultHeightIn,
  },
  rateStrategy: s.rateStrategy,
  allowedCarriers: s.allowedCarriers || [],
  handlingFee: parseFloat(s.handlingFee),
  freeShippingThreshold: parseFloat(s.freeShippingThreshold),
  flatRate: parseFloat(s.flatRate),
});

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await getShippingSettings();
  res.status(200).json(new ApiResponsive(200, present(settings, req), "Shipping settings fetched"));
});

const num = (v, fallback, { min = 0, max = 100000 } = {}) => {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number(v);
  if (Number.isNaN(n) || n < min || n > max) throw new ApiError(400, "One of the numbers is out of range");
  return n;
};

export const saveSettings = asyncHandler(async (req, res) => {
  const existing = await getShippingSettings();
  const b = req.body;
  const data = { updatedBy: req.admin?.id || null };

  // API key (only replaced when a new one is sent)
  const newKey = typeof b.apiKey === "string" ? b.apiKey.trim() : "";
  if (newKey) {
    if (!/^(EZTK|EZAK)/.test(newKey)) {
      throw new ApiError(400, "That does not look like an EasyPost API key (it starts with EZTK for test or EZAK for production)");
    }
    try {
      await listCarrierAccounts(newKey);
    } catch (err) {
      throw new ApiError(400, `EasyPost rejected this key: ${err.message}`);
    }
    data.apiKey = encrypt(newKey);
    data.keyMode = newKey.startsWith("EZAK") ? "LIVE" : "TEST";
  }
  const newWebhook = typeof b.webhookSecret === "string" ? b.webhookSecret.trim() : "";
  if (newWebhook) data.webhookSecret = encrypt(newWebhook);

  if (b.bookingMode !== undefined) {
    if (!["AUTO", "MANUAL"].includes(b.bookingMode)) throw new ApiError(400, "Booking mode must be AUTO or MANUAL");
    data.bookingMode = b.bookingMode;
  }
  if (b.rateStrategy !== undefined) {
    if (!["CHEAPEST", "FASTEST"].includes(b.rateStrategy)) throw new ApiError(400, "Rate strategy must be CHEAPEST or FASTEST");
    data.rateStrategy = b.rateStrategy;
  }
  if (Array.isArray(b.allowedCarriers)) {
    data.allowedCarriers = b.allowedCarriers.map((c) => String(c).trim()).filter(Boolean).map((c) => c.toUpperCase());
  }

  // Ship-from address must be a valid US address
  if (b.origin) {
    const o = b.origin;
    const checked = validateUsAddress({ street: o.street1, city: o.city, state: o.state, postalCode: o.zip, phone: o.phone, country: "US" });
    if (checked.errors) throw new ApiError(400, `Ship-from address: ${Object.values(checked.errors)[0]}`);
    if (!String(o.name || "").trim()) throw new ApiError(400, "Ship-from name is required");
    Object.assign(data, {
      originName: String(o.name).trim(),
      originCompany: String(o.company || "").trim() || null,
      originStreet1: checked.value.street,
      originStreet2: String(o.street2 || "").trim() || null,
      originCity: checked.value.city,
      originState: checked.value.state,
      originZip: checked.value.postalCode,
      originPhone: checked.value.phone,
      originEmail: String(o.email || "").trim() || null,
    });
  }

  if (b.parcel) {
    const p = b.parcel;
    Object.assign(data, {
      defaultWeightLb: num(p.defaultWeightLb, existing.defaultWeightLb, { min: 0.01, max: 150 }),
      packagingWeightLb: num(p.packagingWeightLb, existing.packagingWeightLb, { min: 0, max: 50 }),
      defaultLengthIn: num(p.defaultLengthIn, existing.defaultLengthIn, { min: 0.1, max: 108 }),
      defaultWidthIn: num(p.defaultWidthIn, existing.defaultWidthIn, { min: 0.1, max: 108 }),
      defaultHeightIn: num(p.defaultHeightIn, existing.defaultHeightIn, { min: 0.1, max: 108 }),
    });
  }
  if (b.handlingFee !== undefined) data.handlingFee = num(b.handlingFee, 0, { max: 1000 });
  if (b.freeShippingThreshold !== undefined) data.freeShippingThreshold = num(b.freeShippingThreshold, 0, { max: 100000 });
  if (b.flatRate !== undefined) data.flatRate = num(b.flatRate, 0, { max: 1000 });

  // Turning shipping on needs a key and a complete ship-from address
  if (b.isEnabled !== undefined) {
    const willHaveKey = !!(data.apiKey || existing.apiKey);
    const origin = {
      street1: data.originStreet1 ?? existing.originStreet1,
      zip: data.originZip ?? existing.originZip,
      name: data.originName ?? existing.originName,
    };
    if (b.isEnabled && (!willHaveKey || !origin.street1 || !origin.zip || !origin.name)) {
      throw new ApiError(400, "Add the EasyPost API key and the ship-from address before turning shipping on");
    }
    data.isEnabled = !!b.isEnabled;
  }

  const saved = await prisma.shippingSettings.update({ where: { id: existing.id }, data });
  res.status(200).json(new ApiResponsive(200, present(saved, req), "Shipping settings saved"));
});

// Checks the saved key and lists the carriers on the EasyPost account
export const testConnection = asyncHandler(async (req, res) => {
  const { apiKey } = await getEasyPostContext({ requireEnabled: false });
  const carriers = await listCarrierAccounts(apiKey);
  res.status(200).json(new ApiResponsive(200, { carriers }, "Connected to EasyPost"));
});

/* -------------------- per order -------------------- */

export const getOrderRates = asyncHandler(async (req, res) => {
  const result = await rateOrder(req.params.orderId);
  res.status(200).json(new ApiResponsive(200, result, "Rates fetched"));
});

export const createOrderLabel = asyncHandler(async (req, res) => {
  const order = await createLabelForOrder(req.params.orderId, { rateId: req.body?.rateId || null });
  res.status(200).json(new ApiResponsive(200, { order }, "Shipping label created"));
});

export const voidOrderLabel = asyncHandler(async (req, res) => {
  const result = await voidLabelForOrder(req.params.orderId);
  if (!result.voided) throw new ApiError(400, "This order has no active shipping label");
  res.status(200).json(new ApiResponsive(200, result, "Label cancelled. The carrier will refund the postage."));
});

export const syncOrderTracking = asyncHandler(async (req, res) => {
  const result = await syncTrackingForOrder(req.params.orderId);
  res.status(200).json(new ApiResponsive(200, result, "Tracking updated"));
});
