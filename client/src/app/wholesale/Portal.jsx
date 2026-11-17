"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { wsFetch, money } from "./wholesale-api";

const PackIcon = ({ type }) =>
  type === "bottle" ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45F10" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="7" y="7" width="10" height="14" rx="2" /><path d="M9 7V4h6v3" /><path d="M7 12h10" /></svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#B45F10" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="8" cy="10" r="1.3" /><circle cx="12" cy="10" r="1.3" /><circle cx="16" cy="10" r="1.3" /><circle cx="8" cy="14" r="1.3" /><circle cx="12" cy="14" r="1.3" /><circle cx="16" cy="14" r="1.3" /></svg>
  );
const BagIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 7h12l-1 13H7L6 7z" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
);

const clampQty = (n) => Math.max(1, Math.min(999, parseInt(n, 10) || 1));
const when = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const STATUS = { received: "Received", invoiced: "Invoiced", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
const PAY = { unpaid: "Unpaid", invoiced: "Invoice sent", paid: "Paid", refunded: "Refunded" };

/* ------------------------------ sign in ------------------------------ */

function SignIn({ onDone }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      onDone(await wsFetch("/login", { method: "POST", body: { email, code } }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wp-login">
      <form className="wp-loginCard" onSubmit={submit}>
        <span className="wp-eyebrow">Wholesale partners</span>
        <h1>Wholesale sign in</h1>
        <p>Use the email you applied with and the private access code we emailed you.</p>
        <label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="username" maxLength={200} /></label>
        <label>Access code<input type="password" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="current-password" maxLength={60} placeholder="MWP-XXXX-XXXX-XXXX-XXXX" /></label>
        {error && <p className="wp-error" role="alert">{error}</p>}
        <button className="wp-add" type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        <p className="wp-note">Need access? Contact the MWP team for your wholesale code.</p>
      </form>
    </div>
  );
}

/* ------------------------------ portal ------------------------------ */

export default function Portal() {
  const [boot, setBoot] = useState("loading"); // loading | out | in
  const [partner, setPartner] = useState(null);
  const [minBoxes, setMinBoxes] = useState(4);
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("shop"); // shop | orders | done
  const [sel, setSel] = useState({});
  const [qty, setQty] = useState({});
  const [cart, setCart] = useState({}); // packId -> boxes
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState("");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");
  const [done, setDone] = useState(null);
  const [orders, setOrders] = useState(null);
  const toastTimer = useRef(null);

  const loadCatalog = useCallback(async () => {
    try {
      const data = await wsFetch("/catalog");
      setProducts(data.products || []);
      setMinBoxes(data.minBoxes || 4);
      setLoadError("");
    } catch (e) {
      if (e.status === 401) setBoot("out");
      else setLoadError(e.message);
    }
  }, []);

  useEffect(() => {
    wsFetch("/me")
      .then((d) => {
        setPartner(d.partner);
        setMinBoxes(d.minBoxes || 4);
        setBoot("in");
      })
      .catch(() => setBoot("out"));
  }, []);

  useEffect(() => {
    if (boot === "in") loadCatalog();
  }, [boot, loadCatalog]);

  // the cart is remembered in this browser, per partner
  const cartKey = partner ? `mwp_ws_cart_${partner.id}` : null;
  useEffect(() => {
    if (!cartKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || "{}");
      if (saved && typeof saved === "object") setCart(saved);
    } catch {}
  }, [cartKey]);
  useEffect(() => {
    if (!cartKey) return;
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch {}
  }, [cart, cartKey]);

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

  const lines = useMemo(
    () => Object.entries(cart).filter(([id, n]) => n > 0 && packIndex[id]).map(([id, n]) => ({ id, n, ...packIndex[id] })),
    [cart, packIndex]
  );
  const totalBoxes = lines.reduce((a, l) => a + l.n, 0);
  const bottleBoxes = lines.filter((l) => l.pack.type === "bottle").reduce((a, l) => a + l.n, 0);
  const blisterBoxes = totalBoxes - bottleBoxes;
  const subtotal = lines.reduce((a, l) => a + l.n * l.pack.price, 0);
  const met = totalBoxes >= minBoxes;

  const say = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

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

  async function place() {
    setPlacing(true);
    setPlaceError("");
    try {
      const data = await wsFetch("/orders", { method: "POST", body: { items: lines.map((l) => ({ packId: l.id, qty: l.n })) } });
      setDone(data.order);
      setCart({});
      setSheet(false);
      setView("done");
      setOrders(null);
      window.scrollTo(0, 0);
    } catch (e) {
      setPlaceError(e.message);
      if (e.status === 409) loadCatalog();
      if (e.status === 401) setBoot("out");
    } finally {
      setPlacing(false);
    }
  }

  async function openOrders() {
    setView("orders");
    window.scrollTo(0, 0);
    try {
      const data = await wsFetch("/orders");
      setOrders(data.orders || []);
    } catch (e) {
      if (e.status === 401) setBoot("out");
      setOrders([]);
    }
  }

  async function signOut() {
    try {
      await wsFetch("/logout", { method: "POST" });
    } catch {}
    setBoot("out");
    setPartner(null);
    setProducts([]);
    setCart({});
    setView("shop");
  }

  const counts = {
    all: products.length,
    bottle: products.filter((p) => p.packs.some((k) => k.type === "bottle")).length,
    blister: products.filter((p) => p.packs.some((k) => k.type === "blister")).length,
  };

  const cartPanel = (
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
      <div className="wp-sum"><span>Bottle boxes</span><b>{bottleBoxes}</b></div>
      <div className="wp-sum"><span>Blister boxes</span><b>{blisterBoxes}</b></div>
      <div className="wp-total"><span>Subtotal</span><span>{money(subtotal)}</span></div>
      <div className="wp-prog"><i className={met ? "full" : ""} style={{ width: `${Math.min(100, (totalBoxes / minBoxes) * 100)}%` }} /></div>
      <div className="wp-note">{met ? `Minimum order reached ✓ (${minBoxes} boxes)` : `Add ${minBoxes - totalBoxes} more box${minBoxes - totalBoxes > 1 ? "es" : ""}. The minimum order is ${minBoxes} boxes.`}</div>
      {placeError && <p className="wp-error" role="alert">{placeError}</p>}
      <button className="wp-place" type="button" disabled={!met || placing} onClick={place}>{placing ? "Placing order..." : "Place Wholesale Order"}</button>
      <div className="wp-note">Shipping is added on your invoice. Your tracking number is emailed when the order ships.</div>
    </>
  );

  /* ---------------- render ---------------- */

  if (boot === "loading") return <div className="wp-root"><div className="wp-boot">Loading...</div></div>;

  return (
    <div className="wp-root">
      <header className="wp-header">
        <div className="wp-hd">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <a href="/"><img src="/mwp-logo-3.png" alt="MWP Supplements" /></a>
          <nav className="wp-nav" aria-label="Wholesale"><span>Wholesale Portal</span></nav>
          {boot === "in" && (
            <div className="wp-hdRight">
              <button type="button" className={`wp-navBtn ${view === "orders" ? "on" : ""}`} onClick={() => (view === "orders" ? setView("shop") : openOrders())}>{view === "orders" ? "Shop" : "My orders"}</button>
              <button type="button" className="wp-navBtn" onClick={signOut}>Sign out</button>
              <button className="wp-cartBtn" type="button" onClick={() => setSheet(true)} aria-label="Open cart">
                <BagIcon /> Cart <b>{totalBoxes}</b>
              </button>
            </div>
          )}
        </div>
      </header>

      {boot === "out" ? (
        <SignIn onDone={(d) => { setPartner(d.partner); setMinBoxes(d.minBoxes || 4); setBoot("in"); }} />
      ) : view === "done" ? (
        <section className="wp-wrap">
          <div className="wp-done" role="status">
            <span className="wp-okc"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg></span>
            <span className="wp-eyebrow">Order received</span>
            <h2>Thank you for your order.</h2>
            <p>Order <b>{done?.orderNumber}</b>: {done?.totalBoxes} boxes, {money(done?.subtotal)} before shipping. We will email your invoice shortly, and your tracking number as soon as it ships.</p>
            <div className="wp-doneBtns">
              <button className="wp-add wp-addAuto" type="button" onClick={() => setView("shop")}>Place another order</button>
              <button className="wp-ghost" type="button" onClick={openOrders}>View my orders</button>
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
                    <div className="wp-badges"><span className={`wp-pill s-${o.status}`}>{STATUS[o.status]}</span><span className={`wp-pill p-${o.paymentStatus}`}>{PAY[o.paymentStatus]}</span></div>
                  </div>
                  <ul>
                    {o.items.map((i, idx) => (<li key={idx}><span>{i.productName} · {i.packLabel} <small>({i.contains})</small></span><span>{i.qty} × {money(i.unitPrice)} = {money(i.lineTotal)}</span></li>))}
                  </ul>
                  <div className="wp-orderFoot">
                    <span>Subtotal {money(o.subtotal)} · Shipping {o.shippingCost ? money(o.shippingCost) : "added on invoice"}</span>
                    <b>Total {money(o.total)}</b>
                  </div>
                  {(o.trackingNumber || o.invoiceNumber) && <div className="wp-note">{o.invoiceNumber && <>Invoice {o.invoiceNumber}. </>}{o.trackingNumber && <>Tracking: {o.carrier ? `${o.carrier} ` : ""}{o.trackingNumber}</>}</div>}
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
                <p>Account: <b>{partner?.business}</b></p>
              </div>
              <div className="wp-facts" aria-label="Order terms">
                <div><b>{minBoxes} boxes</b><span>Minimum order</span></div>
                <div><b>Mix &amp; match</b><span>Any product, any pack</span></div>
                <div><b>Invoice</b><span>Sent with every order</span></div>
              </div>
            </div>
          </section>

          <main className="wp-wrap">
            <div className="wp-tools">
              <div className="wp-tabs" role="group" aria-label="Filter by pack">
                {[["all", "All"], ["bottle", "Bottle Boxes"], ["blister", "Blister Boxes"]].map(([f, label]) => (
                  <button key={f} className="wp-tab" type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>{label} <i>{counts[f]}</i></button>
                ))}
              </div>
              <span className="wp-showing">Showing {products.filter((p) => p.packs.some((k) => filter === "all" || k.type === filter)).length} products</span>
            </div>

            <div className="wp-layout">
              <section className="wp-grid" aria-label="Products">
                {loadError && <p className="wp-error">{loadError}</p>}
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
