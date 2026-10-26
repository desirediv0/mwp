"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { IconCircleCheck, IconLoader2, IconRepeat } from "@tabler/icons-react";
import { fetchApi } from "@/lib/utils";
import "../../account/settings.css";

const REASONS = ["Too expensive", "I have enough for now", "Not seeing results", "Switching products", "Delivery problems", "Other"];
const fmt = (d) => new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default function ManageClient() {
  const token = useSearchParams().get("token");
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("This link is incomplete. Sign in to manage your subscription.");
      return;
    }
    fetchApi(`/subscriptions/manage/${encodeURIComponent(token)}`)
      .then((r) => setInfo(r.data))
      .catch((e) => setError(e.message || "This link is invalid or has expired."));
  }, [token]);

  const cancel = async () => {
    setBusy(true);
    setError("");
    try {
      await fetchApi(`/subscriptions/manage/${encodeURIComponent(token)}/cancel`, { method: "POST", body: JSON.stringify({ reason, note: note.trim() || undefined }) });
      setDone(true);
    } catch (e) {
      setError(e.message || "We could not cancel. Please try again or sign in to your account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mwp-set-page">
      <div className="mwp-set" style={{ maxWidth: 520 }}>
        <div className="mwp-set-card pad mwp-set-stack">
          {!info && !error ? (
            <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>
          ) : done || info?.status === "CANCELLED" ? (
            <>
              <div style={{ textAlign: "center", color: "#1f6b3a" }}><IconCircleCheck size={44} stroke={1.4} /></div>
              <h1 className="mwp-set-title" style={{ textAlign: "center", fontSize: 24 }}>Subscription cancelled</h1>
              <p className="mwp-set-sub" style={{ textAlign: "center" }}>
                {info?.product} will not be shipped or charged again. We sent you a confirmation email.
              </p>
              <Link href="/products" className="mwp-btn block">Shop formulas</Link>
            </>
          ) : info ? (
            <>
              <div style={{ color: "#a8741f" }}><IconRepeat size={30} stroke={1.4} /></div>
              <h1 className="mwp-set-title" style={{ fontSize: 24 }}>Cancel your subscription?</h1>
              <p className="mwp-set-sub">
                <b>{info.product}</b>{info.quantity > 1 ? ` x ${info.quantity}` : ""}. Your next charge is on {fmt(info.nextBillingDate)}. If you cancel, you will not be charged again. Orders already placed are not affected. No fees.
              </p>
              {error && <p role="alert" className="mwp-alert">{error}</p>}
              <label className="mwp-field">Why are you leaving? (optional)
                <select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</select>
              </label>
              {reason === "Other" && (
                <label className="mwp-field">Tell us more
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} rows={3} />
                </label>
              )}
              <button className="mwp-btn block" style={{ background: "#b3001b" }} onClick={cancel} disabled={busy}>
                {busy && <IconLoader2 size={16} className="animate-spin" />} Yes, cancel my subscription
              </button>
              <Link href="/account/subscriptions" className="mwp-btn ghost block">Keep it / manage in my account</Link>
            </>
          ) : (
            <>
              <p role="alert" className="mwp-alert">{error}</p>
              <Link href="/account/subscriptions" className="mwp-btn block">Sign in to manage subscriptions</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
