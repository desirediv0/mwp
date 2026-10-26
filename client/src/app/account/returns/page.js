"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { IconLoader2, IconRefresh, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { fetchApi, formatCurrency, formatDate } from "@/lib/utils";

const FILTERS = [["", "All"], ["PENDING", "Pending"], ["APPROVED", "Approved"], ["PROCESSING", "Processing"], ["COMPLETED", "Completed"], ["REJECTED", "Rejected"]];
const label = (s) => String(s || "").charAt(0) + String(s || "").slice(1).toLowerCase();

export default function ReturnsPage() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [status, setStatus] = useState("");
    const page = parseInt(searchParams.get("page"), 10) || 1;

    useEffect(() => {
        if (!isAuthenticated) return;
        let live = true;
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ page: String(page), limit: "10" });
        if (status) params.append("status", status);
        fetchApi(`/returns/my-returns?${params.toString()}`, { credentials: "include" })
            .then((r) => {
                if (!live) return;
                setItems(r.data.returnRequests || []);
                setPagination(r.data.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
            })
            .catch(() => live && setError("We could not load your returns. Please try again."))
            .finally(() => live && setLoading(false));
        return () => { live = false; };
    }, [isAuthenticated, page, status]);

    const go = (n) => n >= 1 && n <= pagination.pages && router.push(`/account/returns?page=${n}`);

    return (
        <div className="mwp-set-stack">
            <div className="mwp-filter" role="group" aria-label="Filter returns">
                {FILTERS.map(([v, l]) => (
                    <button key={v} type="button" aria-pressed={status === v} onClick={() => { setStatus(v); if (page !== 1) router.push("/account/returns"); }}>{l}</button>
                ))}
            </div>

            {error && <p className="mwp-alert" role="alert">{error}</p>}

            {loading ? (
                <div className="mwp-spin"><IconLoader2 className="animate-spin" /></div>
            ) : !error && items.length === 0 ? (
                <div className="mwp-empty">
                    <IconRefresh size={34} stroke={1.3} />
                    <h3>No return requests</h3>
                    <p>Something not right with an order? Open it and request a return within 7 days of delivery.</p>
                    <Link href="/account/orders" className="mwp-btn">View my orders</Link>
                </div>
            ) : (
                <div className="mwp-set-card">
                    {items.map((r) => (
                        <Link key={r.id} href={`/account/orders/${r.order.id}`} className="mwp-order">
                            <div className="mwp-order-top">
                                <strong>{r.orderItem.product.name}</strong>
                                <span className={`mwp-chip s-${r.status}`}>{label(r.status)}</span>
                            </div>
                            <p className="mwp-meta">Order #{r.order.orderNumber} &middot; Qty {r.orderItem.quantity} &times; {formatCurrency(r.orderItem.price)}</p>
                            <p className="mwp-meta">Reason: {r.reason}{r.customReason ? ` (${r.customReason})` : ""}</p>
                            <p className="mwp-meta">Requested {formatDate(r.createdAt)}{r.processedAt ? ` · Processed ${formatDate(r.processedAt)}` : ""}</p>
                            {r.adminNotes && <p className="mwp-alert info" style={{ marginTop: 10 }}><b>Note from us:</b> {r.adminNotes}</p>}
                        </Link>
                    ))}
                </div>
            )}

            {pagination.pages > 1 && (
                <div className="mwp-pager">
                    <button onClick={() => go(page - 1)} disabled={page === 1} aria-label="Previous page"><IconChevronLeft size={18} /></button>
                    <span>Page {page} of {pagination.pages}</span>
                    <button onClick={() => go(page + 1)} disabled={page === pagination.pages} aria-label="Next page"><IconChevronRight size={18} /></button>
                </div>
            )}
        </div>
    );
}
