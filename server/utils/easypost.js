import crypto from "crypto";
import { prisma } from "../config/db.js";
import { decrypt } from "./encryption.js";
import { ApiError } from "./ApiError.js";
import { validateUsAddress } from "./usValidation.js";

// Thin client for the EasyPost REST API (USPS, UPS, FedEx, DHL ... through one account).
// The API key is saved by the admin (Shipping Settings) and stored encrypted.

const BASE = process.env.EASYPOST_API_URL || "https://api.easypost.com/v2";

/* -------------------- settings -------------------- */

export async function getShippingSettings() {
  let settings = await prisma.shippingSettings.findFirst();
  if (!settings) settings = await prisma.shippingSettings.create({ data: {} });
  return settings;
}

export async function getEasyPostContext({ requireEnabled = true } = {}) {
  const settings = await getShippingSettings();
  if (!settings.apiKey) {
    throw new ApiError(400, "Shipping is not set up yet. Add your EasyPost API key in Admin > Shipping Settings.");
  }
  if (requireEnabled && !settings.isEnabled) {
    throw new ApiError(400, "Shipping is turned off in Admin > Shipping Settings.");
  }
  let apiKey;
  try {
    apiKey = decrypt(settings.apiKey);
  } catch {
    throw new ApiError(400, "Could not read the saved EasyPost key. Please save it again in Shipping Settings.");
  }
  return { settings, apiKey };
}

/* -------------------- HTTP -------------------- */

async function epFetch(apiKey, path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }
  if (!res.ok) {
    const detail = json?.error?.message || json?.error?.code || `HTTP ${res.status}`;
    const message = typeof detail === "string" ? detail : JSON.stringify(detail);
    const err = new ApiError(res.status >= 500 ? 502 : 400, `EasyPost: ${message}`);
    err.easypost = json?.error;
    throw err;
  }
  return json;
}

/* -------------------- addresses & parcel -------------------- */

export function toEasyPostAddress(addr) {
  const checked = validateUsAddress({ ...addr, country: addr.country || "US" });
  if (checked.errors) {
    throw new ApiError(400, `Shipping address problem: ${Object.values(checked.errors)[0]}`);
  }
  const a = checked.value;
  return {
    name: addr.name || undefined,
    street1: a.street,
    city: a.city,
    state: a.state,
    zip: a.postalCode,
    country: "US",
    phone: a.phone,
    email: addr.email || undefined,
  };
}

export function originAddress(settings) {
  const missing = ["originName", "originStreet1", "originCity", "originState", "originZip", "originPhone"].filter(
    (k) => !String(settings[k] || "").trim()
  );
  if (missing.length) {
    throw new ApiError(400, "The ship-from address is incomplete. Fill it in under Admin > Shipping Settings.");
  }
  const checked = validateUsAddress({
    street: settings.originStreet1,
    city: settings.originCity,
    state: settings.originState,
    postalCode: settings.originZip,
    phone: settings.originPhone,
    country: "US",
  });
  if (checked.errors) {
    throw new ApiError(400, `Ship-from address problem: ${Object.values(checked.errors)[0]}`);
  }
  const a = checked.value;
  return {
    name: settings.originName,
    company: settings.originCompany || undefined,
    street1: a.street,
    street2: settings.originStreet2 || undefined,
    city: a.city,
    state: a.state,
    zip: a.postalCode,
    country: "US",
    phone: a.phone,
    email: settings.originEmail || undefined,
  };
}

// items: [{ qty, weightLb, lengthIn, widthIn, heightIn }]
// Weight = sum of item weights + packaging. Size = the default box, or the stacked items when every item has a size.
export function buildParcel(items, settings) {
  const totalLb =
    items.reduce((sum, i) => sum + (i.weightLb || settings.defaultWeightLb) * (i.qty || 1), 0) +
    (settings.packagingWeightLb || 0);
  const weightOz = Math.max(1, Math.round(totalLb * 16 * 10) / 10);

  const allSized = items.length > 0 && items.every((i) => i.lengthIn && i.widthIn && i.heightIn);
  let length = settings.defaultLengthIn;
  let width = settings.defaultWidthIn;
  let height = settings.defaultHeightIn;
  if (allSized) {
    length = Math.max(...items.map((i) => i.lengthIn));
    width = Math.max(...items.map((i) => i.widthIn));
    height = items.reduce((sum, i) => sum + i.heightIn * (i.qty || 1), 0);
  }
  return { length, width, height, weight: weightOz };
}

/* -------------------- rates, labels, refunds, tracking -------------------- */

export async function createShipment(apiKey, { to, from, parcel }) {
  return epFetch(apiKey, "/shipments", {
    method: "POST",
    body: { shipment: { to_address: to, from_address: from, parcel, options: { label_format: "PDF" } } },
  });
}

export const getShipment = (apiKey, shipmentId) => epFetch(apiKey, `/shipments/${shipmentId}`);

export const buyShipmentRate = (apiKey, shipmentId, rateId) =>
  epFetch(apiKey, `/shipments/${shipmentId}/buy`, { method: "POST", body: { rate: { id: rateId } } });

export const refundShipment = (apiKey, shipmentId) =>
  epFetch(apiKey, `/shipments/${shipmentId}/refund`, { method: "POST" });

export async function listCarrierAccounts(apiKey) {
  const accounts = await epFetch(apiKey, "/carrier_accounts");
  const list = Array.isArray(accounts) ? accounts : accounts?.carrier_accounts || [];
  return list.map((c) => ({ id: c.id, type: c.type, name: c.readable || c.type }));
}

// Turns an EasyPost shipment's rates into a clean, sorted list
export function normalizeRates(shipment, settings) {
  const allowed = (settings.allowedCarriers || []).map((c) => c.toUpperCase());
  const rates = (shipment.rates || [])
    .filter((r) => r.currency === "USD" && !Number.isNaN(parseFloat(r.rate)))
    .filter((r) => allowed.length === 0 || allowed.includes(String(r.carrier).toUpperCase()))
    .map((r) => ({
      id: r.id,
      carrier: r.carrier,
      service: r.service,
      cost: parseFloat(r.rate),
      days: r.delivery_days ?? r.est_delivery_days ?? null,
      deliveryDate: r.delivery_date || null,
    }));

  const byPrice = (a, b) => a.cost - b.cost;
  const byDays = (a, b) => (a.days ?? 99) - (b.days ?? 99) || a.cost - b.cost;
  rates.sort(settings.rateStrategy === "FASTEST" ? byDays : byPrice);
  return rates;
}

/* -------------------- tracking helpers -------------------- */

// EasyPost tracker status -> our ShipmentStatus enum
export function mapTrackerStatus(status) {
  switch (status) {
    case "in_transit":
      return "IN_TRANSIT";
    case "out_for_delivery":
    case "available_for_pickup":
      return "OUT_FOR_DELIVERY";
    case "delivered":
      return "DELIVERED";
    case "return_to_sender":
      return "RETURNED";
    case "failure":
    case "error":
    case "cancelled":
      return "FAILED";
    default:
      return "PROCESSING"; // pre_transit, unknown
  }
}

// EasyPost signs webhooks: X-Hmac-Signature: hmac-sha256-hex=<hex of HMAC-SHA256(secret, raw body)>
export function verifyWebhookSignature(rawBody, header, secret) {
  if (!header || !secret) return false;
  const given = String(header).split("=").pop();
  const expected = crypto.createHmac("sha256", secret.normalize("NFKD")).update(rawBody).digest("hex");
  const a = Buffer.from(given, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
