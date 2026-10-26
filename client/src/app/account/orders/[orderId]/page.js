"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { IconLoader2, IconPackage, IconTruck, IconShoppingBag, IconX, IconExternalLink } from "@tabler/icons-react";
import { fetchApi, formatCurrency, formatDate } from "@/lib/utils";
import { formatUsPhone, formatCityLine, formatCountry } from "@/lib/us";

const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  const u = typeof image === "string" ? image : image.url;
  if (!u) return "/placeholder.jpg";
  return u.startsWith("http") ? u : `https://desirediv-storage.blr1.digitaloceanspaces.com/${u}`;
};

const label = (s) => String(s || "").charAt(0) + String(s || "").slice(1).toLowerCase();
const CANCEL_REASONS = ["Changed my mind", "Ordered by mistake", "Found a better price", "Delivery takes too long", "Wrong address", "Other"];

export default function OrderDetailPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [cancelNote, setCancelNote] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !orderId) return;
    let live = true;
    setLoading(true);
    setError("");
    fetchApi(`/users/orders/${orderId}`, { credentials: "include" })
      .then((r) => live && (r.success ? setOrder(r.data.order) : setError(r.message || "We could not load this order.")))
      .catch(() => live && setError("We could not load this order. Please try again."))
      .finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [isAuthenticated, orderId]);

  const cancelOrder = async () => {
    setCancelling(true);
    try {
      const r = await fetchApi(`/users/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ reason: cancelNote.trim() ? `${cancelReason}: ${cancelNote.trim()}` : cancelReason }),
      });
      if (r.success) {
        toast.success("Order cancelled. Your payment will be refunded to your card.");
        setShowCancel(false);
        setOrder((o) => ({ ...o, status: "CANCELLED" }));
      } else toast.error(r.message || "Could not cancel the order");
    } catch {
      toast.error("Could not cancel the order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>;

  if (error || !order) {
    return (
      <div className="mwp-empty">
        <IconPackage size={34} stroke={1.3} />
        <h3>{error ? "Could not load this order" : "Order not found"}</h3>
        <p>{error || "This order does not exist or was removed."}</p>
        <Link href="/account/orders" className="mwp-btn">Back to orders</Link>
      </div>
    );
  }

  const canCancel = !["CANCELLED", "DELIVERED", "SHIPPED", "REFUNDED"].includes(order.status);
  const itemCount = (order.items?.length || 0) + (order.orderBundles?.length || 0);
  const addr = order.shippingAddress;

  return (
    <div className="mwp-set-stack">
      <div className="mwp-set-card pad">
        <div className="mwp-order-top">
          <div>
            <strong style={{ fontSize: 20 }}>Order #{order.orderNumber}</strong>
            <p className="mwp-meta">Placed {formatDate(order.createdAt)}</p>
          </div>
          <span className={`mwp-chip s-${order.status}`}>{label(order.status)}</span>
        </div>
        {order.status === "CANCELLED" && (
          <p className="mwp-alert info" style={{ marginTop: 14 }}>
            This order was cancelled. If you paid by card, the refund goes back to your original payment method, usually within 5 to 7 business days.
          </p>
        )}
        {canCancel && (
          <button className="mwp-btn ghost sm" style={{ marginTop: 14 }} onClick={() => setShowCancel(true)}>
            <IconX size={15} /> Cancel order
          </button>
        )}
      </div>

      <div className="mwp-order-grid">
        <div className="mwp-set-stack">
          <section>
            <h2 className="mwp-card-title">Items ({itemCount})</h2>
            <div className="mwp-set-card">
              {order.items?.map((item) => {
                const img = item.productImage || item.productSnapshot?.image || item.variant?.images?.find((i) => i.isPrimary) || item.variant?.images?.[0] || item.product?.images?.find((i) => i.isPrimary) || item.product?.images?.[0];
                const name = item.productName || item.product?.name;
                return (
                  <div key={item.id} className="mwp-item">
                    <div className="mwp-thumb"><Image src={getImageUrl(img)} alt={name || "Product"} fill sizes="68px" className="object-contain p-1" /></div>
                    <div className="mwp-item-body">
                      <Link href={`/products/${item.product?.slug || ""}`}>{name}</Link>
                      {item.variant?.options?.length > 0 && <p className="mwp-meta">{item.variant.options.map((o) => `${o.name}: ${o.value}`).join(", ")}</p>}
                      <div className="mwp-line" style={{ marginTop: 6 }}><span>Qty {item.quantity}</span><b>{formatCurrency(item.subtotal)}</b></div>
                    </div>
                  </div>
                );
              })}
              {order.orderBundles?.map((b) => (
                <div key={b.id} className="mwp-item">
                  <div className="mwp-thumb" style={{ display: "grid", placeItems: "center", color: "#a8741f" }}><IconShoppingBag size={24} stroke={1.4} /></div>
                  <div className="mwp-item-body">
                    <strong>{b.bundleName}</strong>
                    <p className="mwp-meta">{(b.selectedProducts || []).map((p) => p.name).join(", ")}</p>
                    <div className="mwp-line" style={{ marginTop: 6 }}>
                      <span>{b.savings > 0 ? `You saved ${formatCurrency(b.savings)}` : "Bundle"}</span>
                      <b>{formatCurrency(b.bundlePrice)}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {order.tracking && (
            <section>
              <h2 className="mwp-card-title">Tracking</h2>
              <div className="mwp-set-card pad">
                <div className="mwp-order-top">
                  <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="mwp-set-ico"><IconTruck size={20} stroke={1.5} /></span>
                    <span className="mwp-set-txt"><strong>{order.tracking.carrier || order.shippingCarrier || "Carrier"}</strong><small>#{order.tracking.trackingNumber}</small></span>
                  </span>
                  {order.trackingUrl && (
                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mwp-btn sm">Track <IconExternalLink size={14} /></a>
                  )}
                </div>
                {order.tracking.updates?.length > 0 && (
                  <ul style={{ marginTop: 16, display: "grid", gap: 10, listStyle: "none", padding: 0 }}>
                    {order.tracking.updates.map((u, i) => (
                      <li key={i} className="mwp-meta" style={{ display: "flex", gap: 10 }}>
                        <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: "50%", background: "#a8741f", flex: "none" }} />
                        <span><b style={{ color: "#12213f" }}>{u.status}</b><br />{formatDate(u.createdAt)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="mwp-set-stack">
          <section>
            <h2 className="mwp-card-title">Summary</h2>
            <div className="mwp-set-card pad">
              <div className="mwp-line"><span>Subtotal</span><b>{formatCurrency(order.subTotal)}</b></div>
              {order.discount > 0 && <div className="mwp-line"><span>Discount</span><b style={{ color: "#1f6b3a" }}>-{formatCurrency(order.discount)}</b></div>}
              <div className="mwp-line"><span>Shipping</span><b>{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : "Free"}</b></div>
              {order.tax > 0 && <div className="mwp-line"><span>Tax</span><b>{formatCurrency(order.tax)}</b></div>}
              <div className="mwp-line total"><span>Total</span><b>{formatCurrency(order.total)}</b></div>
            </div>
          </section>

          <section>
            <h2 className="mwp-card-title">Payment</h2>
            <div className="mwp-set-card pad">
              <div className="mwp-line"><span>Method</span><b>{order.paymentMethod || "Card"}</b></div>
              <div className="mwp-line"><span>Status</span><span className={`mwp-chip s-${order.paymentStatus}`}>{label(order.paymentStatus) || "N/A"}</span></div>
            </div>
          </section>

          {addr && (
            <section>
              <h2 className="mwp-card-title">Ships to</h2>
              <div className="mwp-set-card pad mwp-addr" style={{ padding: 20 }}>
                <strong>{addr.name}</strong>
                <p>{addr.street}</p>
                <p>{formatCityLine(addr)}</p>
                <p>{formatCountry(addr.country)}</p>
                {addr.phone && <p>{formatUsPhone(addr.phone)}</p>}
              </div>
            </section>
          )}

          <Link href="/products" className="mwp-btn block">Continue shopping</Link>
        </div>
      </div>

      {showCancel && (
        <div className="mwp-set-modal" role="dialog" aria-modal="true" aria-label="Cancel order" onClick={(e) => e.target === e.currentTarget && !cancelling && setShowCancel(false)}>
          <div className="mwp-set-sheet">
            <div className="mwp-set-sheet-head"><h3>Cancel order #{order.orderNumber}?</h3></div>
            <p className="mwp-set-sub">Tell us why. Paid orders are refunded to your card automatically.</p>
            <label className="mwp-field">Reason
              <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>{CANCEL_REASONS.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            <label className="mwp-field">Note (optional)
              <textarea value={cancelNote} onChange={(e) => setCancelNote(e.target.value)} maxLength={300} rows={3} />
            </label>
            <button className="mwp-set-save danger" onClick={cancelOrder} disabled={cancelling}>
              {cancelling && <IconLoader2 size={16} className="animate-spin" />} Cancel order
            </button>
            <button className="mwp-set-cancel" onClick={() => setShowCancel(false)} disabled={cancelling}>Keep my order</button>
          </div>
        </div>
      )}
    </div>
  );
}
