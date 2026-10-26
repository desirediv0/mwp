"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChevronLeft, IconLoader2, IconLock, IconPlus, IconRepeat, IconMinus } from "@tabler/icons-react";
import { useAuth } from "@/lib/auth-context";
import { fetchApi, formatCurrency } from "@/lib/utils";
import { formatCityLine } from "@/lib/us";
import AddressForm from "@/components/AddressForm";
import GuestCheckout from "@/components/checkout/GuestCheckout";
import "../account/settings.css";

const nextMonth = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
};

export default function SubscribeClient() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const variantId = params.get("variant");
  const [qty, setQty] = useState(Math.min(Math.max(parseInt(params.get("qty"), 10) || 1, 1), 10));

  const [addresses, setAddresses] = useState(null);
  const [addressId, setAddressId] = useState("");
  const [adding, setAdding] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(params.get("canceled") ? "Payment was cancelled. You have not been charged." : "");

  const loadAddresses = async () => {
    try {
      const r = await fetchApi("/users/addresses", { credentials: "include" });
      const list = r.data.addresses || [];
      setAddresses(list);
      setAddressId((cur) => (list.some((a) => a.id === cur) ? cur : (list.find((a) => a.isDefault) || list[0])?.id || ""));
      setAdding(list.length === 0);
    } catch {
      setAddresses([]);
      setAdding(true);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadAddresses();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !variantId || !addressId) return;
    let live = true;
    setLoadingPreview(true);
    setError((e) => (e.startsWith("Payment was cancelled") ? e : ""));
    fetchApi("/subscriptions/preview", { method: "POST", credentials: "include", body: JSON.stringify({ variantId, quantity: qty, shippingAddressId: addressId }) })
      .then((r) => live && setPreview(r.data))
      .catch((e) => live && (setPreview(null), setError(e.message || "We could not price this subscription.")))
      .finally(() => live && setLoadingPreview(false));
    return () => { live = false; };
  }, [isAuthenticated, variantId, qty, addressId]);

  const date = useMemo(nextMonth, []);

  const pay = async () => {
    setPaying(true);
    setError("");
    try {
      const r = await fetchApi("/subscriptions/checkout", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ variantId, quantity: qty, shippingAddressId: addressId, agreed: true }),
      });
      window.location.href = r.data.url;
    } catch (e) {
      setError(e.message || "Could not start checkout. Please try again.");
      setPaying(false);
    }
  };

  if (!variantId) {
    return (
      <div className="mwp-set-page">
        <div className="mwp-empty" style={{ maxWidth: 520, margin: "0 auto" }}>
          <IconRepeat size={34} stroke={1.3} />
          <h3>Pick a formula first</h3>
          <p>Choose &ldquo;Subscribe monthly&rdquo; on any product page.</p>
          <Link href="/products" className="mwp-btn">Shop formulas</Link>
        </div>
      </div>
    );
  }

  if (authLoading) return <div className="mwp-set-page"><div className="mwp-spin"><IconLoader2 className="animate-spin" /></div></div>;
  if (!isAuthenticated) return <GuestCheckout />;

  return (
    <div className="mwp-set-page">
      <div className="mwp-set">
        <header className="mwp-set-top">
          <button type="button" onClick={() => router.back()} className="mwp-set-back" aria-label="Back"><IconChevronLeft size={20} stroke={1.8} /></button>
          <h1 className="mwp-set-title">Subscribe monthly</h1>
        </header>

        {error && <p role="alert" className="mwp-alert" style={{ marginBottom: 14 }}>{error}</p>}

        <div className="mwp-set-stack">
          <section>
            <h2 className="mwp-card-title">Ship to</h2>
            {addresses === null ? (
              <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>
            ) : adding ? (
              <div className="mwp-set-card pad">
                <AddressForm onSuccess={() => loadAddresses()} onCancel={addresses.length ? () => setAdding(false) : undefined} />
              </div>
            ) : (
              <div className="mwp-set-card">
                {addresses.map((a) => (
                  <label key={a.id} className="mwp-addr" style={{ display: "flex", gap: 12, cursor: "pointer" }}>
                    <input type="radio" name="addr" checked={addressId === a.id} onChange={() => setAddressId(a.id)} style={{ marginTop: 4 }} />
                    <span>
                      <strong style={{ fontSize: 15 }}>{a.name}</strong>
                      <span style={{ display: "block", fontSize: 14, color: "#4a5470" }}>{a.street}, {formatCityLine(a)}</span>
                    </span>
                  </label>
                ))}
                <button type="button" className="mwp-set-row" onClick={() => setAdding(true)}>
                  <span className="mwp-set-ico"><IconPlus size={18} /></span>
                  <span className="mwp-set-txt"><strong>Add a new address</strong></span>
                </button>
              </div>
            )}
          </section>

          <section>
            <h2 className="mwp-card-title">Your subscription</h2>
            <div className="mwp-set-card pad">
              {loadingPreview && !preview ? (
                <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>
              ) : preview ? (
                <>
                  <div className="mwp-order-top">
                    <div>
                      <strong style={{ fontSize: 17 }}>{preview.product}</strong>
                      <p className="mwp-meta">Delivered every month</p>
                    </div>
                    <div className="mwp-qty" role="group" aria-label="Quantity">
                      <button type="button" onClick={() => setQty((q) => Math.max(q - 1, 1))} disabled={qty <= 1} aria-label="Fewer"><IconMinus size={14} /></button>
                      <span>{qty}</span>
                      <button type="button" onClick={() => setQty((q) => Math.min(q + 1, 10))} disabled={qty >= 10} aria-label="More"><IconPlus size={14} /></button>
                    </div>
                  </div>
                  <div style={{ marginTop: 16, opacity: loadingPreview ? 0.5 : 1 }}>
                    <div className="mwp-line">
                      <span>Price each{preview.discountPercent > 0 ? ` (${preview.discountPercent}% subscriber saving)` : ""}</span>
                      <b>{preview.discountPercent > 0 && <s style={{ color: "#8a90a3", fontWeight: 400, marginRight: 6 }}>{formatCurrency(preview.listPrice)}</s>}{formatCurrency(preview.unitPrice)}</b>
                    </div>
                    <div className="mwp-line"><span>Subtotal ({qty})</span><b>{formatCurrency(preview.subTotal)}</b></div>
                    <div className="mwp-line"><span>Shipping ({preview.shippingLabel})</span><b>{preview.shipping > 0 ? formatCurrency(preview.shipping) : "Free"}</b></div>
                    <div className="mwp-line total"><span>Charged today</span><b>{formatCurrency(preview.total)}</b></div>
                  </div>
                </>
              ) : (
                <p className="mwp-meta">{addressId ? "We could not price this subscription." : "Add a delivery address to see your price."}</p>
              )}
            </div>
          </section>

          {preview && (
            <section className="mwp-set-card pad">
              <p className="mwp-set-sub" style={{ marginBottom: 12 }}>
                <IconRepeat size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
                Your next shipment and charge is on <b>{date}</b>, then every month. We email you {" "}a few days before each charge. Skip a month or cancel any time in your account.
              </p>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13.5, color: "#12213f", cursor: "pointer" }}>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} style={{ marginTop: 3 }} />
                <span>
                  I authorize MWP Supplements to charge my card {formatCurrency(preview.total)} today and about {formatCurrency(preview.total)} every month (price and shipping may change slightly) until I cancel.
                  I have read the <Link href="/terms" className="underline">Terms</Link> and <Link href="/return-policy" className="underline">Return policy</Link>.
                </span>
              </label>
              <button className="mwp-btn block" style={{ marginTop: 16 }} disabled={!agreed || paying || loadingPreview} onClick={pay}>
                {paying ? <IconLoader2 size={16} className="animate-spin" /> : <IconLock size={16} />} Subscribe and pay {formatCurrency(preview.total)}
              </button>
              <p className="mwp-meta" style={{ textAlign: "center", marginTop: 10 }}>Secure payment with Stripe. Your card is saved only by Stripe.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
