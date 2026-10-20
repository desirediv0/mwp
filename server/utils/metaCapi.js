import crypto from "crypto";
import { prisma } from "../config/db.js";

// Meta Conversions API (server-side Purchase event). Works together with the browser pixel:
// both send the same event_id (the order id), so Meta counts the purchase once.
// Needs META_PIXEL_ID and META_CAPI_TOKEN in the server environment. Without them this does nothing.

const sha = (v) => (v ? crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex") : undefined);
const digits = (v) => String(v || "").replace(/\D/g, "");

export async function sendMetaPurchase(orderId, { clientIp, userAgent, sourceUrl } = {}) {
  const pixelId = process.env.META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  if (!pixelId || !token) return { skipped: "not-configured" };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: { include: { variant: { select: { sku: true } } } } },
    });
    if (!order) return { skipped: "no-order" };

    const snap = order.shippingAddressSnapshot || {};
    const [first, ...rest] = String(snap.name || order.user?.name || "").trim().split(/\s+/);
    const phone = digits(snap.phone || order.user?.phone);

    const event = {
      event_name: "Purchase",
      event_time: Math.floor(new Date(order.createdAt).getTime() / 1000),
      event_id: order.id,
      action_source: "website",
      event_source_url: sourceUrl || `${process.env.FRONTEND_URL || ""}/checkout`,
      user_data: {
        em: order.user?.email ? [sha(order.user.email)] : undefined,
        ph: phone ? [sha(phone.length === 10 ? `1${phone}` : phone)] : undefined,
        fn: sha(first),
        ln: sha(rest.join(" ")),
        ct: sha(snap.city),
        st: sha(snap.state),
        zp: sha(String(snap.postalCode || "").slice(0, 5)),
        country: sha("us"),
        external_id: sha(order.userId),
        client_ip_address: clientIp,
        client_user_agent: userAgent,
      },
      custom_data: {
        currency: "USD",
        value: parseFloat(order.total),
        order_id: order.orderNumber,
        content_type: "product",
        content_ids: order.items.map((i) => i.variant?.sku || i.variantId),
        contents: order.items.map((i) => ({ id: i.variant?.sku || i.variantId, quantity: i.quantity, item_price: parseFloat(i.price) })),
        num_items: order.items.reduce((n, i) => n + i.quantity, 0),
      },
    };

    const body = { data: [event], ...(process.env.META_TEST_EVENT_CODE ? { test_event_code: process.env.META_TEST_EVENT_CODE } : {}) };
    const base = process.env.META_GRAPH_URL || "https://graph.facebook.com";
    const res = await fetch(`${base}/v19.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("Meta CAPI purchase failed:", res.status, text.slice(0, 200));
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("Meta CAPI error:", err.message);
    return { ok: false };
  }
}
