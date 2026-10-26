"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { IconLoader2, IconRepeat, IconPlayerSkipForward, IconX } from "@tabler/icons-react";
import { fetchApi, formatCurrency } from "@/lib/utils";

const REASONS = ["Too expensive", "I have enough for now", "Not seeing results", "Switching products", "Delivery problems", "Other"];
const STATUS = { ACTIVE: ["Active", "s-DELIVERED"], PAST_DUE: ["Payment issue", "s-PROCESSING"], CANCELLED: ["Cancelled", "s-CANCELLED"] };
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

function SubscriptionsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("subscribed");
  const confirmStarted = useRef(false);

  const [subs, setSubs] = useState(null);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [cancelFor, setCancelFor] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [addrFor, setAddrFor] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [addrId, setAddrId] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetchApi("/subscriptions/mine", { credentials: "include" });
      setSubs(r.data.subscriptions);
      setError("");
    } catch {
      setSubs((cur) => cur || []);
      setError("We could not load your subscriptions. Please try again.");
    }
  }, []);

  // coming back from Stripe: turn the paid session into a subscription
  useEffect(() => {
    if (!sessionId || confirmStarted.current) return;
    confirmStarted.current = true;
    setBanner({ type: "info", text: "Confirming your payment..." });
    fetchApi("/subscriptions/confirm", { method: "POST", credentials: "include", body: JSON.stringify({ sessionId }) })
      .then((r) => setBanner({ type: "ok", text: `You are subscribed. Your first order${r.data.orderNumber ? ` #${r.data.orderNumber}` : ""} is confirmed.` }))
      .catch((e) => setBanner({ type: "error", text: e.message || "We could not confirm the payment yet. Refresh in a moment." }))
      .finally(() => {
        router.replace("/account/subscriptions", { scroll: false });
        load();
      });
  }, [sessionId, router, load]);

  useEffect(() => {
    if (!sessionId) load();
  }, [sessionId, load]);

  const skip = async (s) => {
    setBusyId(s.id);
    try {
      const r = await fetchApi(`/subscriptions/${s.id}/skip`, { method: "POST", credentials: "include" });
      toast.success(`Skipped. Next charge is ${fmt(r.data.nextBillingDate)}.`);
      load();
    } catch (e) {
      toast.error(e.message || "Could not skip this shipment");
    } finally {
      setBusyId(null);
    }
  };

  const openAddress = async (s) => {
    setAddrFor(s);
    setAddrId(s.shippingAddressId || "");
    try {
      const r = await fetchApi("/users/addresses", { credentials: "include" });
      setAddresses(r.data.addresses || []);
    } catch {
      setAddresses([]);
    }
  };

  const saveAddress = async () => {
    setBusyId(addrFor.id);
    try {
      await fetchApi(`/subscriptions/${addrFor.id}/address`, { method: "POST", credentials: "include", body: JSON.stringify({ shippingAddressId: addrId }) });
      toast.success("Delivery address updated");
      setAddrFor(null);
      load();
    } catch (e) {
      toast.error(e.message || "Could not update the address");
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async () => {
    setBusyId(cancelFor.id);
    try {
      await fetchApi(`/subscriptions/${cancelFor.id}/cancel`, { method: "POST", credentials: "include", body: JSON.stringify({ reason }) });
      toast.success("Subscription cancelled. You will not be charged again.");
      setCancelFor(null);
      load();
    } catch (e) {
      toast.error(e.message || "Could not cancel the subscription");
    } finally {
      setBusyId(null);
    }
  };

  if (subs === null) return <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>;

  const active = subs.filter((s) => s.status !== "CANCELLED");
  const past = subs.filter((s) => s.status === "CANCELLED");

  const Card = ({ s }) => {
    const [label, cls] = STATUS[s.status] || [s.status, ""];
    return (
      <div className="mwp-set-card pad">
        <div className="mwp-item" style={{ padding: 0 }}>
          <div className="mwp-thumb">{s.product.image ? <Image src={s.product.image} alt={s.product.name || "Product"} fill sizes="68px" className="object-contain p-1" /> : null}</div>
          <div className="mwp-item-body">
            <div className="mwp-order-top">
              {s.product.slug ? <Link href={`/products/${s.product.slug}`}>{s.product.name}</Link> : <strong>{s.product.name}</strong>}
              <span className={`mwp-chip ${cls}`}>{label}</span>
            </div>
            <p className="mwp-meta">Qty {s.quantity}{s.unitPrice ? ` · ${formatCurrency(s.unitPrice)} each` : ""}{s.discountPercent > 0 ? ` · ${s.discountPercent}% off` : ""}</p>
            <p className="mwp-meta">
              {s.status === "CANCELLED"
                ? `Cancelled ${s.cancelledAt ? fmt(s.cancelledAt) : ""}`
                : `Next charge ${fmt(s.nextBillingDate)}`} · {s.billingCount} {s.billingCount === 1 ? "shipment" : "shipments"} so far
            </p>
          </div>
        </div>

        {s.status === "PAST_DUE" && (
          <p className="mwp-alert" style={{ marginTop: 14 }}>
            We could not charge your card{s.lastError ? ` (${s.lastError})` : ""}. We will try again on {fmt(s.nextBillingDate)}. If your card changed, cancel this and subscribe again with the new card.
          </p>
        )}

        {s.status !== "CANCELLED" && (
          <div className="mwp-addr-actions" style={{ marginTop: 14 }}>
            {s.status === "ACTIVE" && (
              <button className="mwp-btn ghost sm" disabled={busyId === s.id} onClick={() => skip(s)}>
                {busyId === s.id ? <IconLoader2 size={14} className="animate-spin" /> : <IconPlayerSkipForward size={14} />} Skip next shipment
              </button>
            )}
            <button className="mwp-btn ghost sm" disabled={busyId === s.id} onClick={() => openAddress(s)}>Change address</button>
            <button className="mwp-btn ghost sm" disabled={busyId === s.id} onClick={() => { setReason(REASONS[0]); setCancelFor(s); }}>
              <IconX size={14} /> Cancel subscription
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mwp-set-stack">
      {banner && <p role="status" className={`mwp-alert${banner.type === "ok" ? " ok" : banner.type === "info" ? " info" : ""}`}>{banner.text}</p>}
      {error && <p role="alert" className="mwp-alert">{error}</p>}

      {subs.length === 0 && !error ? (
        <div className="mwp-empty">
          <IconRepeat size={34} stroke={1.3} />
          <h3>No subscriptions yet</h3>
          <p>Choose &ldquo;Subscribe monthly&rdquo; on a product page to get it delivered every month. Skip or cancel any time.</p>
          <Link href="/products" className="mwp-btn">Shop formulas</Link>
        </div>
      ) : (
        <>
          {active.map((s) => <Card key={s.id} s={s} />)}
          {past.length > 0 && (
            <section>
              <h2 className="mwp-card-title" style={{ marginTop: 10 }}>Cancelled</h2>
              <div className="mwp-set-stack">{past.map((s) => <Card key={s.id} s={s} />)}</div>
            </section>
          )}
        </>
      )}

      {addrFor && (
        <div className="mwp-set-modal" role="dialog" aria-modal="true" aria-label="Change delivery address" onClick={(e) => e.target === e.currentTarget && busyId == null && setAddrFor(null)}>
          <div className="mwp-set-sheet">
            <div className="mwp-set-sheet-head"><h3>Delivery address</h3></div>
            <p className="mwp-set-sub">Your next shipment of {addrFor.product.name} will go to this address.</p>
            {addresses.length === 0 ? (
              <p className="mwp-set-sub">You have no saved addresses. <Link href="/account/addresses" className="underline">Add one first</Link>.</p>
            ) : (
              <div className="mwp-set-card">
                {addresses.map((a) => (
                  <label key={a.id} className="mwp-addr" style={{ display: "flex", gap: 12, cursor: "pointer" }}>
                    <input type="radio" name="sub-addr" checked={addrId === a.id} onChange={() => setAddrId(a.id)} style={{ marginTop: 4 }} />
                    <span><strong style={{ fontSize: 15 }}>{a.name}</strong><span style={{ display: "block", fontSize: 14, color: "#4a5470" }}>{a.street}, {a.city}, {a.state} {a.postalCode}</span></span>
                  </label>
                ))}
              </div>
            )}
            <button className="mwp-set-save" onClick={saveAddress} disabled={busyId != null || !addrId || addrId === addrFor.shippingAddressId}>
              {busyId != null && <IconLoader2 size={16} className="animate-spin" />} Save address
            </button>
            <button className="mwp-set-cancel" onClick={() => setAddrFor(null)} disabled={busyId != null}>Close</button>
          </div>
        </div>
      )}

      {cancelFor && (
        <div className="mwp-set-modal" role="dialog" aria-modal="true" aria-label="Cancel subscription" onClick={(e) => e.target === e.currentTarget && busyId == null && setCancelFor(null)}>
          <div className="mwp-set-sheet">
            <div className="mwp-set-sheet-head"><h3>Cancel this subscription?</h3></div>
            <p className="mwp-set-sub">{cancelFor.product.name} will not be shipped or charged again. Orders already placed are not affected. No fees.</p>
            <label className="mwp-field">Why are you leaving? (optional)
              <select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
            </label>
            <button className="mwp-set-save danger" onClick={cancel} disabled={busyId != null}>
              {busyId != null && <IconLoader2 size={16} className="animate-spin" />} Yes, cancel subscription
            </button>
            <button className="mwp-set-cancel" onClick={() => setCancelFor(null)} disabled={busyId != null}>Keep my subscription</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>}>
      <SubscriptionsInner />
    </Suspense>
  );
}
