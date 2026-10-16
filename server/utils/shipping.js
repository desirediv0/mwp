import { prisma } from "../config/db.js";
import { ApiError } from "./ApiError.js";
import sendEmail from "./sendEmail.js";
import { emailUser, notifyAdmin } from "./notify.js";
import { getOrderShippedTemplate } from "../email/temp/EmailTemplate.js";
import { createDeliveryCommissions } from "./partnerCommission.js";
import {
  getEasyPostContext,
  getShippingSettings,
  toEasyPostAddress,
  originAddress,
  buildParcel,
  createShipment,
  getShipment,
  buyShipmentRate,
  refundShipment,
  normalizeRates,
  mapTrackerStatus,
} from "./easypost.js";

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// What the customer pays for one rate: cost + handling. When the order qualifies for free
// shipping the cheapest option is free and faster options only cost the difference.
function priceRates(rates, settings, freeShipping) {
  const handling = Number(settings.handlingFee || 0);
  const cheapest = rates.length ? Math.min(...rates.map((r) => r.cost)) : 0;
  return rates.map((r) => ({
    ...r,
    price: round2(freeShipping ? Math.max(r.cost - cheapest, 0) : r.cost + handling),
  }));
}

const isFreeShipping = (settings, subTotal) => {
  const threshold = Number(settings.freeShippingThreshold || 0);
  return threshold > 0 && subTotal >= threshold;
};

const sameAddress = (shipmentTo, address) =>
  String(shipmentTo?.zip || "").slice(0, 5) === String(address.postalCode || "").slice(0, 5) &&
  String(shipmentTo?.street1 || "").trim().toLowerCase() === String(address.street || "").trim().toLowerCase();

/* -------------------- quotes at checkout -------------------- */

export async function quoteRates({ address, subTotal, parcelItems }) {
  const settings = await getShippingSettings();
  const freeShipping = isFreeShipping(settings, subTotal);
  const flat = Number(settings.flatRate || 0);

  const flatOption = () =>
    flat > 0
      ? {
          shipmentId: null,
          currency: "USD",
          freeShipping,
          rates: [{ id: "flat", carrier: "Standard", service: "Shipping", cost: flat, price: freeShipping ? 0 : flat, days: null, flat: true }],
        }
      : null;

  if (!settings.isEnabled || !settings.apiKey) {
    const fallback = flatOption();
    if (fallback) return fallback;
    throw new ApiError(400, "Shipping is not available right now. Please contact support.");
  }

  try {
    const { apiKey } = await getEasyPostContext();
    const shipment = await createShipment(apiKey, {
      to: toEasyPostAddress(address),
      from: originAddress(settings),
      parcel: buildParcel(parcelItems, settings),
    });
    const rates = normalizeRates(shipment, settings);
    if (!rates.length) throw new ApiError(400, "No carrier can deliver to this address. Please check it and try again.");
    return { shipmentId: shipment.id, currency: "USD", freeShipping, rates: priceRates(rates, settings, freeShipping) };
  } catch (err) {
    const fallback = flatOption();
    if (fallback && err.statusCode !== 400) {
      console.error("Live shipping rates failed, using the flat rate:", err.message);
      return fallback;
    }
    throw err;
  }
}

// Re-checks the option the customer picked, with the carrier, before charging for it
export async function resolveSelectedRate({ shipmentId, rateId, address, subTotal }) {
  const settings = await getShippingSettings();
  const freeShipping = isFreeShipping(settings, subTotal);

  if (rateId === "flat") {
    const flat = Number(settings.flatRate || 0);
    if (flat <= 0) throw new ApiError(400, "That shipping option is no longer available. Please choose again.");
    return { customerPrice: freeShipping ? 0 : flat, carrier: "Standard", service: "Shipping", rateCost: flat, rateId: "flat", shipmentId: null };
  }
  if (!shipmentId || !rateId) throw new ApiError(400, "Please choose a shipping option.");

  const { apiKey } = await getEasyPostContext();
  const shipment = await getShipment(apiKey, shipmentId);
  if (!sameAddress(shipment.to_address, address)) {
    throw new ApiError(400, "Your shipping address changed. Please choose your shipping option again.");
  }
  const priced = priceRates(normalizeRates(shipment, settings), settings, freeShipping);
  const chosen = priced.find((r) => r.id === rateId);
  if (!chosen) throw new ApiError(400, "That shipping option expired. Please choose again.");

  return {
    customerPrice: chosen.price,
    carrier: chosen.carrier,
    service: chosen.service,
    rateCost: chosen.cost,
    rateId: chosen.id,
    shipmentId: shipment.id,
  };
}

/* -------------------- labels -------------------- */

const orderAddress = (order) =>
  order.shippingAddressSnapshot
    ? { ...order.shippingAddress, ...order.shippingAddressSnapshot }
    : order.shippingAddress;

export async function createLabelForOrder(orderId, { rateId = null } = {}) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: true } }, shippingAddress: true, user: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  if (["CANCELLED", "REFUNDED"].includes(order.status)) throw new ApiError(400, "A cancelled or refunded order cannot be shipped");
  if (order.labelUrl && order.shippingStatus !== "label_voided") throw new ApiError(409, "This order already has a shipping label");

  const { settings, apiKey } = await getEasyPostContext();
  const address = orderAddress(order);
  if (!address) throw new ApiError(400, "This order has no shipping address");

  let shipment = null;
  let rates = [];
  let chosenRateId = rateId || order.shipmentRateId || null;

  if (order.shipmentId) {
    try {
      shipment = await getShipment(apiKey, order.shipmentId);
      rates = normalizeRates(shipment, settings);
    } catch {
      shipment = null;
    }
  }

  // No usable earlier quote (or admin wants a different one): get fresh rates for the real package
  if (!shipment || !rates.length || (chosenRateId && !rates.some((r) => r.id === chosenRateId))) {
    const parcelItems = order.items.map((item) => ({
      qty: item.quantity,
      weightLb: item.variant?.shippingWeight || null,
      lengthIn: item.variant?.shippingLength || null,
      widthIn: item.variant?.shippingBreadth || null,
      heightIn: item.variant?.shippingHeight || null,
    }));
    shipment = await createShipment(apiKey, {
      to: toEasyPostAddress({ ...address, name: address.name || order.user?.name, email: order.user?.email }),
      from: originAddress(settings),
      parcel: buildParcel(parcelItems, settings),
    });
    rates = normalizeRates(shipment, settings);
    if (!rates.length) throw new ApiError(400, "No carrier can deliver to this address");

    const sameService = rates.find((r) => r.carrier === order.shippingCarrier && r.service === order.shippingService);
    chosenRateId = rateId && rates.some((r) => r.id === rateId) ? rateId : sameService?.id || rates[0].id;
  }
  if (!chosenRateId) chosenRateId = rates[0].id;

  let bought;
  try {
    bought = await buyShipmentRate(apiKey, shipment.id, chosenRateId);
  } catch (err) {
    await prisma.order.update({ where: { id: orderId }, data: { shipmentError: String(err.message).slice(0, 300) } });
    throw err;
  }

  const selected = bought.selected_rate || {};
  const trackingCode = bought.tracking_code || bought.tracker?.tracking_code || null;
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      shippingProvider: "EASYPOST",
      shipmentId: bought.id,
      shipmentRateId: selected.id || chosenRateId,
      shippingCarrier: selected.carrier || order.shippingCarrier,
      shippingService: selected.service || order.shippingService,
      shippingRateCost: selected.rate ? parseFloat(selected.rate) : order.shippingRateCost,
      trackingCode,
      trackingUrl: bought.tracker?.public_url || null,
      labelUrl: bought.postage_label?.label_url || null,
      labelBoughtAt: new Date(),
      shippingStatus: "pre_transit",
      shipmentError: null,
      ...(order.status === "PAID" ? { status: "PROCESSING" } : {}),
    },
  });

  if (trackingCode) {
    await prisma.tracking.upsert({
      where: { orderId },
      create: {
        orderId,
        trackingNumber: trackingCode,
        carrier: `${updated.shippingCarrier || ""} ${updated.shippingService || ""}`.trim(),
        status: "PROCESSING",
        updates: { create: { status: "PROCESSING", description: "Shipping label created", location: settings.originCity || null } },
      },
      update: {
        trackingNumber: trackingCode,
        carrier: `${updated.shippingCarrier || ""} ${updated.shippingService || ""}`.trim(),
        status: "PROCESSING",
        updates: { create: { status: "PROCESSING", description: "Shipping label created", location: settings.originCity || null } },
      },
    });
  }
  return updated;
}

// Used right after an order is paid when booking mode is AUTO. Never throws.
export async function autoBookLabel(orderId) {
  try {
    const settings = await getShippingSettings();
    if (!settings.isEnabled || !settings.apiKey || settings.bookingMode !== "AUTO") return null;
    return await createLabelForOrder(orderId);
  } catch (err) {
    console.error(`Auto shipping label failed for order ${orderId}:`, err.message);
    const failed = await prisma.order
      .update({ where: { id: orderId }, data: { shipmentError: String(err.message).slice(0, 300) } })
      .catch(() => null);
    await notifyAdmin(`Shipping label failed for order #${failed?.orderNumber || orderId}`, {
      title: "Label not created",
      danger: true,
      paragraphs: ["The shipping label could not be bought automatically. Open the order in the admin panel and create it manually."],
      rows: [["Order", failed?.orderNumber || orderId], ["Reason", err.message]],
    });
    return null;
  }
}

// Cancels the label (a refund request to the carrier) while the package has not been scanned yet.
export async function voidLabelForOrder(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new ApiError(404, "Order not found");
  if (!order.shipmentId || !order.labelUrl) return { voided: false, reason: "no-label" };

  if (["in_transit", "out_for_delivery", "delivered"].includes(order.shippingStatus || "")) {
    throw new ApiError(409, "The package is already with the carrier, so the label can no longer be cancelled.");
  }

  const { apiKey } = await getEasyPostContext({ requireEnabled: false });
  const result = await refundShipment(apiKey, order.shipmentId);

  await prisma.order.update({
    where: { id: orderId },
    data: { shippingStatus: "label_voided", labelUrl: null, trackingCode: null, trackingUrl: null, shipmentError: null },
  });
  await prisma.tracking.deleteMany({ where: { orderId } });
  return { voided: true, refundStatus: result.refund_status || "submitted" };
}

/* -------------------- tracking -------------------- */

export async function applyTrackerUpdate(tracker) {
  const code = tracker.tracking_code;
  const shipmentId = tracker.shipment_id;
  const conditions = [code ? { trackingCode: code } : null, shipmentId ? { shipmentId } : null].filter(Boolean);
  if (!conditions.length) return { ignored: true };

  const order = await prisma.order.findFirst({
    where: { OR: conditions },
    include: { user: true, shippingAddress: true },
  });
  if (!order) return { ignored: true };

  const epStatus = tracker.status;
  if (!epStatus || order.shippingStatus === epStatus) return { unchanged: true };

  const mapped = mapTrackerStatus(epStatus);
  const detail = [...(tracker.tracking_details || [])].pop() || {};
  const location = [detail.tracking_location?.city, detail.tracking_location?.state].filter(Boolean).join(", ") || null;
  const description = detail.message || epStatus.replace(/_/g, " ");
  const wasShipped = ["in_transit", "out_for_delivery", "delivered"].includes(order.shippingStatus || "");

  const updated = await prisma.$transaction(async (tx) => {
    const data = { shippingStatus: epStatus };
    if (["in_transit", "out_for_delivery"].includes(epStatus) && ["PAID", "PROCESSING"].includes(order.status)) data.status = "SHIPPED";
    if (epStatus === "delivered" && !["CANCELLED", "REFUNDED"].includes(order.status)) data.status = "DELIVERED";
    if (tracker.public_url && !order.trackingUrl) data.trackingUrl = tracker.public_url;

    const next = await tx.order.update({ where: { id: order.id }, data });

    const trackingNumber = order.trackingCode || code;
    const trackingData = {
      status: mapped,
      ...(epStatus === "in_transit" ? { shippedAt: new Date() } : {}),
      ...(epStatus === "delivered" ? { deliveredAt: new Date() } : {}),
      ...(tracker.est_delivery_date ? { estimatedDelivery: new Date(tracker.est_delivery_date) } : {}),
    };
    await tx.tracking.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        trackingNumber: trackingNumber || "-",
        carrier: `${order.shippingCarrier || tracker.carrier || ""} ${order.shippingService || ""}`.trim(),
        ...trackingData,
        updates: { create: { status: mapped, description, location } },
      },
      update: { ...trackingData, updates: { create: { status: mapped, description, location } } },
    });

    if (data.status === "DELIVERED") await createDeliveryCommissions(tx, next);
    return next;
  });

  // "Your order has shipped" email, once, when the carrier first scans the package
  if (epStatus === "in_transit" && !wasShipped && order.user?.email) {
    try {
      await sendEmail({
        email: order.user.email,
        subject: `Your Order #${order.orderNumber} Has Shipped`,
        html: getOrderShippedTemplate({
          userName: order.user.name || "Customer",
          orderNumber: order.orderNumber,
          trackingCode: order.trackingCode || code,
          carrier: order.shippingCarrier,
          service: order.shippingService,
          trackingUrl: updated.trackingUrl || order.trackingUrl,
          estimatedDelivery: tracker.est_delivery_date ? new Date(tracker.est_delivery_date).toDateString() : null,
          shippingAddress: orderAddress(order),
        }),
      });
    } catch (err) {
      console.error("Shipped email failed:", err.message);
    }
  }
  if (epStatus === "delivered" && updated.status === "DELIVERED" && order.status !== "DELIVERED" && order.user?.email) {
    await emailUser(order.user.email, `Your Order #${order.orderNumber} Was Delivered`, {
      title: "Order delivered",
      accent: "Delivered",
      greeting: `Hi ${order.user.name || "there"},`,
      paragraphs: [
        "Your package has been delivered. We hope you enjoy your supplements!",
        "If something is damaged or wrong, please report it within 7 days of delivery from your account or by replying to this email.",
      ],
      rows: [["Order", `#${order.orderNumber}`], ["Carrier", `${order.shippingCarrier || ""} ${order.shippingService || ""}`.trim()], ["Tracking", order.trackingCode || code]],
    });
  }
  return { updated: true, status: epStatus };
}

// Pull the latest tracking from the carrier (the "Sync" button)
export async function syncTrackingForOrder(orderId) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order?.shipmentId) throw new ApiError(400, "This order has no shipment to sync");
  const { apiKey } = await getEasyPostContext({ requireEnabled: false });
  const shipment = await getShipment(apiKey, order.shipmentId);
  if (!shipment.tracker) throw new ApiError(400, "The carrier has no tracking for this shipment yet");
  return applyTrackerUpdate({ ...shipment.tracker, shipment_id: shipment.id, tracking_code: shipment.tracking_code || shipment.tracker.tracking_code });
}

// Fresh carrier rates for an existing order (admin picks one before buying the label)
export async function rateOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: true } }, shippingAddress: true, user: true },
  });
  if (!order) throw new ApiError(404, "Order not found");
  const { settings, apiKey } = await getEasyPostContext();
  const address = orderAddress(order);
  if (!address) throw new ApiError(400, "This order has no shipping address");

  const parcelItems = order.items.map((item) => ({
    qty: item.quantity,
    weightLb: item.variant?.shippingWeight || null,
    lengthIn: item.variant?.shippingLength || null,
    widthIn: item.variant?.shippingBreadth || null,
    heightIn: item.variant?.shippingHeight || null,
  }));
  const shipment = await createShipment(apiKey, {
    to: toEasyPostAddress({ ...address, name: address.name || order.user?.name, email: order.user?.email }),
    from: originAddress(settings),
    parcel: buildParcel(parcelItems, settings),
  });
  return { shipmentId: shipment.id, rates: normalizeRates(shipment, settings) };
}
