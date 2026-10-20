// Sends shopping events to every analytics tool that is installed (GTM data layer, GA4, Meta Pixel).
// Nothing happens when an ID is not configured, so it is always safe to call.

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
};

export function trackEvent(name, { value, items = [], eventId, extra = {} } = {}) {
  if (typeof window === "undefined") return;
  const ga = { currency: "USD", value: num(value), items, ...extra };
  try {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, ecommerce: ga, event_id: eventId });
    if (typeof window.gtag === "function" && !window.__gtmLoaded) window.gtag("event", name, ga);
  } catch {
    /* analytics must never break the page */
  }
  try {
    if (typeof window.fbq === "function") {
      const meta = {
        view_item: ["ViewContent"],
        add_to_cart: ["AddToCart"],
        begin_checkout: ["InitiateCheckout"],
        purchase: ["Purchase"],
      }[name];
      if (meta) {
        window.fbq(
          "track",
          meta[0],
          { currency: "USD", value: num(value), content_type: "product", content_ids: items.map((i) => i.item_id), contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity || 1 })) },
          eventId ? { eventID: eventId } : undefined
        );
      }
    }
  } catch {
    /* ignore */
  }
}

export const toItem = (product, variant, quantity = 1) => ({
  item_id: variant?.sku || variant?.id || product?.id,
  item_name: product?.name,
  item_brand: "MWP SUPPLEMENTS",
  price: num(variant?.salePrice && parseFloat(variant.salePrice) < parseFloat(variant.price) ? variant.salePrice : variant?.price || product?.basePrice),
  quantity,
});
