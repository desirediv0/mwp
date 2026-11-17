"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { wsFetch, money } from "./wholesale-api";

const US_STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

const PackIcon = ({ type }) =>
  type === "bottle" ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45F10" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="7" width="10" height="14" rx="2" /><path d="M9 7V4h6v3" /><path d="M7 12h10" /></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45F10" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8" cy="10" r="1.3" /><circle cx="12" cy="10" r="1.3" /><circle cx="16" cy="10" r="1.3" /><circle cx="8" cy="14" r="1.3" /><circle cx="12" cy="14" r="1.3" /><circle cx="16" cy="14" r="1.3" /></svg>
  );
const BagIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
);
const LockIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
);

const clampQty = (n) => Math.max(1, Math.min(999, parseInt(n, 10) || 1));
const when = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const STATUS = { received: "Received", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const PAY = { paid: "Paid", refunded: "Refunded", unpaid: "Unpaid" };
const newId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`);

const ATTEMPT_KEY = "mwp_ws_attempt";
const CART_KEY = "mwp_ws_cart";
const getAttempt = () => {
  try {
    let a = localStorage.getItem(ATTEMPT_KEY);
    if (!a || !/^[A-Za-z0-9-]{16,64}$/.test(a)) {
      a = newId();
      localStorage.setItem(ATTEMPT_KEY, a);
    }
    return a;
  } catch {
    return newId();
  }
};

export default function Portal() {
  const [boot, setBoot] = useState("loading"); // loading | off | ready | error
  const [minBoxes, setMinBoxes] = useState(4);
  const [shipping, setShipping] = useState(0);
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [bootError, setBootError] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("shop"); // shop | orders | done
  const [sel, setSel] = useState({});
  const [qty, setQty] = useState({});
  const [cart, setCart] = useState({}); // packId -> boxes
  const [sheet, setSheet] = useState(false);
  const [step, setStep] = useState("cart"); // cart | details
  const [toast, setToast] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [done, setDone] = useState(null);
  const [orders, setOrders] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [f, setF] = useState({ business: "", name: "", email: "", phone: "", street: "", city: "", state: "", postalCode: "", note: "" });
  const toastTimer = useRef(null);
  const cartLoaded = useRef(false);

  const say = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2400);
  };

  const load = useCallback(async () => {
    try {
      const d = await wsFetch("/catalog");
      if (!d.enabled) return setBoot("off");
      setProducts(d.products || []);
      setMinBoxes(d.minBoxes || 4);
      setShipping(Number(d.shipping) || 0);
      setUser(d.user || null);
      setBoot("ready");
    } catch (e) {
      setBootError(e.message);
      setBoot("error");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // signed-in customers get their name and email filled in
  useEffect(() => {
    if (user) setF((x) => ({ ...x, name: x.name || user.name || "", email: x.email || user.email || "" }));
  }, [user]);

  // the cart is remembered in this browser
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY) || "{}");
      if (saved && typeof saved === "object") setCart(saved);
    } catch {}
    cartLoaded.current = true;
  }, []);
  useEffect(() => {
    if (!cartLoaded.current) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // coming back from Stripe
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("canceled")) {
      say("Payment was cancelled. Your cart is saved.");
      window.history.replaceState({}, "", "/wholesale");
    }
    const sid = q.get("session_id");
    if (q.get("paid") && sid) {
      setConfirming(true);
      window.history.replaceState({}, "", "/wholesale");
      wsFetch("/confirm", { method: "POST", body: { sessionId: sid } })
        .then((d) => {
          if (d.paid) {
            setDone(d.order);
            setView("done");
            setCart({});
            try {
              localStorage.removeItem(ATTEMPT_KEY);
              localStorage.removeItem(CART_KEY);
            } catch {}
          } else {
            say("We have not received the payment yet. If you were charged, your order will appear shortly.");
          }
        })
        .catch((e) => say(e.message))
        .finally(() => setConfirming(false));
    }
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheet]);

  const packIndex = useMemo(() => {
    const m = {};
    products.forEach((p) => p.packs.forEach((k) => (m[k.id] = { product: p, pack: k })));
    return m;
  }, [products]);
  const lines = useMemo(() => Object.entries(cart).filter(([id, n]) => n > 0 && packIndex[id]).map(([id, n]) => ({ id, n, ...packIndex[id] })), [cart, packIndex]);
  const totalBoxes = lines.reduce((a, l) => a + l.n, 0);
  const bottleBoxes = lines.filter((l) => l.pack.type === "bottle").reduce((a, l) => a + l.n, 0);
  const blisterBoxes = totalBoxes - bottleBoxes;
  const subtotal = lines.reduce((a, l) => a + l.n * l.pack.price, 0);
  const total = subtotal + (lines.length ? shipping : 0);
  const met = totalBoxes >= minBoxes;

  const add = (p) => {
    const packId = sel[p.id] || p.packs[0].id;
    const n = qty[p.id] || 1;
    setCart((c) => ({ ...c, [packId]: Math.min(999, (c[packId] || 0) + n) }));
    setQty((q) => ({ ...q, [p.id]: 1 }));
    const k = p.packs.find((x) => x.id === packId);
    say(`Added ${n} × ${p.name} ${k.label}`);
  };
  const setLine = (id, n) =>
    setCart((c) => {
      const next = { ...c };
      if (n <= 0) delete next[id];
      else next[id] = Math.min(999, n);
      return next;
    });
  const openSheet = () => {
    setStep("cart");
    setPayError("");
    setSheet(true);
  };

  async function pay(e) {
    e.preventDefault();
    if (paying) return;
    setPaying(true);
    setPayError("");
    try {
      const d = await wsFetch("/checkout", { method: "POST", body: { attemptId: getAttempt(), items: lines.map((l) => ({ packId: l.id, qty: l.n })), ...f } });
      if (d.paid) {
        setDone({ orderNumber: d.orderNumber });
        setView("done");
        setSheet(false);
        setCart({});
        try {
          localStorage.removeItem(ATTEMPT_KEY);
        } catch {}
        return;
      }
      if (!d.url) throw new Error("We could not open the payment page. Please try again.");
      window.location.href = d.url; // Stripe's own secure payment page
    } catch (err) {
      setPayError(err.message);
      if (err.status === 409) load();
      setPaying(false);
    }
  }

  async function openOrders() {
    setView("orders");
    window.scrollTo(0, 0);
    try {
      const d = await wsFetch("/orders");
      setOrders(d.orders || []);
    } catch {
      setOrders([]);
    }
  }

  const counts = {
    all: products.length,
    bottle: products.filter((p) => p.packs.some((k) => k.type === "bottle")).length,
    blister: products.filter((p) => p.packs.some((k) => k.type === "blister")).length,
  };
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const totals = (
    <>
      <div className="wp-sum"><span>Bottle boxes</span><b>{bottleBoxes}</b></div>
      <div className="wp-sum"><span>Blister boxes</span><b>{blisterBoxes}</b></div>
      <div className="wp-sum"><span>Boxes subtotal</span><b>{money(subtotal)}</b></div>
      <div className="wp-sum"><span>Shipping</span><b>{shipping > 0 ? money(shipping) : "Free"}</b></div>
      <div className="wp-total"><span>Total</span><span>{money(total)}</span></div>
    </>
  );

  const cartPanel = (
    <>
      {step === "cart" ? (
        <>
          <h2>Your Cart <small>{lines.length ? `${lines.length} item${lines.length > 1 ? "s" : ""}` : ""}</small></h2>
          {lines.length === 0 ? (
            <div className="wp-empty">Your cart is empty.<br />Add boxes from the products.</div>
          ) : (
            lines.map((l) => (
              <div className="wp-item" key={l.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {l.product.image && <img src={l.product.image} alt="" />}
                <div className="wp-t">
                  <b>{l.product.name}</b>
                  <small>{l.pack.label} · {l.pack.contains}</small>
                  <br />
                  <small>{l.n} × {money(l.pack.price)} = <b className="wp-lineTotal">{money(l.n * l.pack.price)}</b></small>
                </div>
                <div className="wp-step wp-stepSm">
                  <button type="button" onClick={() => setLine(l.id, l.n - 1)} aria-label="Remove one box">−</button>
                  <input inputMode="numeric" value={l.n} onChange={(e) => setLine(l.id, parseInt(e.target.value, 10) || 0)} aria-label="Boxes" />
                  <button type="button" onClick={() => setLine(l.id, l.n + 1)} aria-label="Add one box">+</button>
                </div>
                <button className="wp-rm" type="button" onClick={() => setLine(l.id, 0)} aria-label={`Remove ${l.product.name} ${l.pack.label}`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
            ))
          )}
          {totals}
          <div className="wp-prog"><i className={met ? "full" : ""} style={{ width: `${Math.min(100, (totalBoxes / minBoxes) * 100)}%` }} /></div>
          <div className="wp-note">{met ? `Minimum order reached ✓ (${minBoxes} boxes)` : `Add ${minBoxes - totalBoxes} more box${minBoxes - totalBoxes > 1 ? "es" : ""}. The minimum order is ${minBoxes} boxes.`}</div>
          <button className="wp-place" type="button" disabled={!met} onClick={() => setStep("details")}>Checkout</button>
        </>
      ) : (
        <form onSubmit={pay} className="wp-form">
          <h2>Checkout</h2>
          <button type="button" className="wp-back" onClick={() => setStep("cart")}>← Back to cart</button>
          {user ? (
            <div className="wp-acct">Signed in as <b>{user.email}</b>. This order will show in your account.</div>
          ) : (
            <div className="wp-acct">Ordering as a guest. <a href="/auth?redirect=%2Fwholesale">Sign in or create an account</a> to keep this order in your account.</div>
          )}
          <label>Business name *<input value={f.business} onChange={set("business")} required maxLength={140} autoComplete="organization" /></label>
          <label>Your name *<input value={f.name} onChange={set("name")} required maxLength={100} autoComplete="name" /></label>
          <label>Email *<input type="email" value={f.email} onChange={set("email")} required maxLength={200} autoComplete="email" /></label>
          <label>Phone *<input type="tel" value={f.phone} onChange={set("phone")} required maxLength={40} autoComplete="tel" placeholder="(310) 724-8851" /></label>
          <label>Shipping street address *<input value={f.street} onChange={set("street")} required maxLength={150} autoComplete="street-address" /></label>
          <div className="wp-two">
            <label>City *<input value={f.city} onChange={set("city")} required maxLength={80} autoComplete="address-level2" /></label>
            <label>State *
              <select value={f.state} onChange={set("state")} required autoComplete="address-level1">
                <option value="">Select</option>
                {US_STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <label>ZIP code *<input value={f.postalCode} onChange={set("postalCode")} required maxLength={10} inputMode="numeric" autoComplete="postal-code" /></label>
          <label>Note for the MWP team (optional)<input value={f.note} onChange={set("note")} maxLength={500} /></label>
          {totals}
          {payError && <p className="wp-error" role="alert">{payError}</p>}
          <button className="wp-place" type="submit" disabled={paying || !met || !lines.length}>{paying ? "Opening secure payment..." : <><LockIcon /> Pay {money(total)} securely</>}</button>
          <div className="wp-note">You will pay by card on Stripe's secure page. We never see or store your card details. If you cancel, your cart stays saved.</div>
        </form>
      )}
    </>
  );

  /* ---------------- render ---------------- */

  const header = (
    <header className="wp-header">
      <div className="wp-hd">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/"><img src="/mwp-logo-3.png" alt="MWP Supplements" /></a>
        <nav className="wp-nav" aria-label="Wholesale"><span>Wholesale Portal</span></nav>
        {boot === "ready" && (
          <div className="wp-hdRight">
            {user ? (
              <button type="button" className={`wp-navBtn ${view === "orders" ? "on" : ""}`} onClick={() => (view === "orders" ? setView("shop") : openOrders())}>{view === "orders" ? "Shop" : "My orders"}</button>
            ) : (
              <a className="wp-navBtn" href="/auth?redirect=%2Fwholesale">Sign in</a>
            )}
            <button className="wp-cartBtn" type="button" onClick={openSheet} aria-label="Open cart">
              <BagIcon /> Cart <b>{totalBoxes}</b>
            </button>
          </div>
        )}
      </div>
    </header>
  );

  if (boot === "loading") return <div className="wp-root">{header}<div className="wp-boot">Loading...</div></div>;
  if (boot === "off" || boot === "error")
    return (
      <div className="wp-root">
        {header}
        <div className="wp-boot">
          <h2>{boot === "off" ? "Wholesale ordering is not available right now." : "We could not load the wholesale page."}</h2>
          <p>{boot === "off" ? "Please contact the MWP team." : bootError}</p>
        </div>
      </div>
    );

  return (
    <div className="wp-root">
      {header}

      {confirming ? (
        <div className="wp-boot">Confirming your payment...</div>
      ) : view === "done" ? (
        <section className="wp-wrap">
          <div className="wp-done" role="status">
            <span className="wp-okc"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg></span>
            <span className="wp-eyebrow">Payment received</span>
            <h2>Thank you for your order.</h2>
            <p>Order <b>{done?.orderNumber}</b>{done?.totalBoxes ? `: ${done.totalBoxes} boxes, ${money(done.total)} paid` : ""}. We emailed you the details, and we will email your tracking number as soon as it ships.</p>
            <div className="wp-doneBtns">
              <button className="wp-add wp-addAuto" type="button" onClick={() => setView("shop")}>Place another order</button>
              {user && <button className="wp-ghost" type="button" onClick={openOrders}>View my orders</button>}
            </div>
          </div>
        </section>
      ) : view === "orders" ? (
        <main className="wp-wrap">
          <h2 className="wp-h2">My wholesale orders</h2>
          {orders === null ? <p className="wp-note">Loading...</p> : orders.length === 0 ? <div className="wp-empty">No orders yet.</div> : (
            <div className="wp-orders">
              {orders.map((o) => (
                <article className="wp-order" key={o.id}>
                  <div className="wp-orderHead">
                    <div><b>{o.orderNumber}</b><small>{when(o.createdAt)} · {o.totalBoxes} boxes</small></div>
                    <div className="wp-badges"><span className={`wp-pill s-${o.status}`}>{STATUS[o.status] || o.status}</span><span className={`wp-pill p-${o.paymentStatus}`}>{PAY[o.paymentStatus]}</span></div>
                  </div>
                  <ul>{o.items.map((i, idx) => (<li key={idx}><span>{i.productName} · {i.packLabel} <small>({i.contains})</small></span><span>{i.qty} × {money(i.unitPrice)} = {money(i.lineTotal)}</span></li>))}</ul>
                  <div className="wp-orderFoot"><span>Boxes {money(o.subtotal)} · Shipping {o.shippingCost ? money(o.shippingCost) : "Free"}</span><b>Total {money(o.total)}</b></div>
                  {o.trackingNumber && <div className="wp-note">Tracking: {o.carrier ? `${o.carrier} ` : ""}{o.trackingNumber}</div>}
                </article>
              ))}
            </div>
          )}
        </main>
      ) : (
        <>
          <section className="wp-hero">
            <div className="wp-heroIn">
              <div>
                <span className="wp-eyebrow">Wholesale Partners</span>
                <h1>Wholesale <em>Order</em> Dashboard</h1>
                <p>{user ? <>Signed in as <b>{user.name || user.email}</b></> : <>Order as a guest or <a className="wp-inline" href="/auth?redirect=%2Fwholesale">sign in</a></>}</p>
              </div>
              <div className="wp-facts" aria-label="Order terms">
                <div><b>{minBoxes} boxes</b><span>Minimum order</span></div>
                <div><b>Mix &amp; match</b><span>Any product, any pack</span></div>
                <div><b>Secure card payment</b><span>Pay on Stripe at checkout</span></div>
              </div>
            </div>
          </section>

          <main className="wp-wrap">
            <div className="wp-tools">
              <div className="wp-tabs" role="group" aria-label="Filter by pack">
                {[["all", "All"], ["bottle", "Bottle Boxes"], ["blister", "Blister Boxes"]].map(([k, label]) => (
                  <button key={k} className="wp-tab" type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label} <i>{counts[k]}</i></button>
                ))}
              </div>
              <span className="wp-showing">Showing {products.filter((p) => p.packs.some((k) => filter === "all" || k.type === filter)).length} products</span>
            </div>

            <div className="wp-layout">
              <section className="wp-grid" aria-label="Products">
                {products.length === 0 && <div className="wp-empty">No wholesale products are available yet.</div>}
                {products.map((p) => {
                  const packs = p.packs.filter((k) => filter === "all" || k.type === filter);
                  if (!packs.length) return null;
                  const chosen = packs.some((k) => k.id === sel[p.id]) ? sel[p.id] : packs[0].id;
                  const n = qty[p.id] || 1;
                  return (
                    <article className="wp-card" key={p.id}>
                      <div className="wp-imgBox" style={{ background: p.bg }}>
                        <span className="wp-badge">{packs.length > 1 ? "Bottle & Blister" : packs[0].label}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {p.image && <img src={p.image} alt={`${p.name} bottle`} loading="lazy" />}
                      </div>
                      <div className="wp-body">
                        <h3 className="wp-name">{p.name}</h3>
                        <div className="wp-packs">
                          {packs.map((k) => (
                            <button type="button" key={k.id} className="wp-pack" aria-pressed={chosen === k.id} onClick={() => setSel((s) => ({ ...s, [p.id]: k.id }))}>
                              <span className="wp-ic"><PackIcon type={k.type} /></span>
                              <span className="wp-tx"><b>{k.label}</b><small>{k.contains}</small>{k.detail && <small>{k.detail}</small>}</span>
                              <span className="wp-pr">{money(k.price)}<small>{money(k.price / k.units)} / {k.unit}</small></span>
                            </button>
                          ))}
                        </div>
                        <div className="wp-row">
                          <div className="wp-step">
                            <button type="button" onClick={() => setQty((q) => ({ ...q, [p.id]: clampQty(n - 1) }))} aria-label={`Fewer boxes of ${p.name}`}>−</button>
                            <input inputMode="numeric" value={n} onChange={(e) => setQty((q) => ({ ...q, [p.id]: clampQty(e.target.value) }))} aria-label={`Boxes of ${p.name}`} />
                            <button type="button" onClick={() => setQty((q) => ({ ...q, [p.id]: clampQty(n + 1) }))} aria-label={`More boxes of ${p.name}`}>+</button>
                          </div>
                          <button type="button" className="wp-add" onClick={() => add(p)}><BagIcon size={16} /> Add to Cart</button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>
              <aside className="wp-cart wp-cartDesk" aria-label="Cart">{cartPanel}</aside>
            </div>
          </main>
        </>
      )}

      {sheet && (
        <div className="wp-overlay" onClick={() => setSheet(false)}>
          <aside className="wp-sheet" role="dialog" aria-label="Cart" onClick={(e) => e.stopPropagation()}>
            <button className="wp-close" type="button" onClick={() => setSheet(false)} aria-label="Close cart">×</button>
            <div className="wp-cart wp-cartSheet">{cartPanel}</div>
          </aside>
        </div>
      )}

      <div className={`wp-toast ${toast ? "show" : ""}`} role="status" aria-live="polite">{toast && <>✓ {toast}</>}</div>
    </div>
  );
}
