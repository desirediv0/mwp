"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi, formatCurrency, formatDate } from "@/lib/utils";
import { IconLoader2, IconChevronLeft, IconChevronRight, IconShoppingBag, IconArrowRight } from "@tabler/icons-react";

const label = (s) => String(s || "").charAt(0) + String(s || "").slice(1).toLowerCase();

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const page = parseInt(searchParams.get("page"), 10) || 1;

  useEffect(() => {
    if (!isAuthenticated) return;
    let live = true;
    setLoadingOrders(true);
    setError("");
    fetchApi(`/payment/orders?page=${page}&limit=10`, { credentials: "include" })
      .then((r) => {
        if (!live) return;
        setOrders(r.data.orders || []);
        setPagination(r.data.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
      })
      .catch(() => live && setError("We could not load your orders. Please try again."))
      .finally(() => live && setLoadingOrders(false));
    return () => { live = false; };
  }, [isAuthenticated, page]);

  const go = (n) => n >= 1 && n <= pagination.pages && router.push(`/account/orders?page=${n}`);

  if (loadingOrders) return <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>;

  return (
    <div className="mwp-set-stack">
      {error && <p className="mwp-alert" role="alert">{error}</p>}

      {!error && orders.length === 0 ? (
        <div className="mwp-empty">
          <IconShoppingBag size={34} stroke={1.3} />
          <h3>No orders yet</h3>
          <p>When you place an order it shows up here, with tracking once it ships.</p>
          <Link href="/products" className="mwp-btn">Shop formulas <IconArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="mwp-set-card">
          {orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="mwp-order">
              <div className="mwp-order-top">
                <strong>Order #{o.orderNumber}</strong>
                <span className={`mwp-chip s-${o.status}`}>{label(o.status)}</span>
              </div>
              <div className="mwp-order-bot">
                <span>{formatDate(o.date)} &middot; {o.items.length} {o.items.length === 1 ? "item" : "items"}</span>
                <b>{formatCurrency(o.total)}</b>
              </div>
            </Link>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="mwp-pager">
          <button onClick={() => go(pagination.page - 1)} disabled={pagination.page === 1} aria-label="Previous page"><IconChevronLeft size={18} /></button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button onClick={() => go(pagination.page + 1)} disabled={pagination.page === pagination.pages} aria-label="Next page"><IconChevronRight size={18} /></button>
        </div>
      )}
    </div>
  );
}
