"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { fetchApi, formatCurrency, formatDate } from "@/lib/utils";
import {
  IconPackage,
  IconLoader2,
  IconEye,
  IconChevronLeft,
  IconChevronRight,
  IconShoppingBag,
  IconArrowRight,
} from "@tabler/icons-react";

const statusStyles = {
  PENDING: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-blue-50 text-blue-800 border-blue-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 0 });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const page = searchParams.get("page") ? parseInt(searchParams.get("page")) : 1;

  useEffect(() => {
    const fetchOrders = async () => {
      if (!isAuthenticated) return;
      setLoadingOrders(true);
      setError("");
      try {
        const response = await fetchApi(`/payment/orders?page=${page}&limit=10`, { credentials: "include" });
        setOrders(response.data.orders || []);
        setPagination(response.data.pagination || { total: 0, page: 1, limit: 10, pages: 0 });
      } catch (error) {
        setError("Failed to load your orders. Please try again later.");
      } finally { setLoadingOrders(false); }
    };
    fetchOrders();
  }, [isAuthenticated, page]);

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > pagination.pages) return;
    router.push(`/account/orders?page=${newPage}`);
  };

  return (
    <div className="space-y-6">

      <h2 className="text-xl text-gray-900 tracking-tight">My Orders</h2>

      {error && (
        <div className="px-5 py-4 bg-red-50 border border-red-200 text-red-700 text-[13px] font-light">{error}</div>
      )}

      {/* Recent Order Highlight */}
      {orders.length > 0 && (
        <div className="bg-gray-900 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-[9px] uppercase tracking-[0.3em] text-red-600/70 block mb-2">Latest Order</span>
              <p className="text-xl text-white tracking-tight">#{orders[0].orderNumber}</p>
              <p className="text-[12px] text-white/40 font-light mt-1">
                {formatDate(orders[0].date)} &middot; {orders[0].items.length} {orders[0].items.length === 1 ? "item" : "items"} &middot; {formatCurrency(orders[0].total)}
              </p>
              <span className={`inline-block mt-2 px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-medium border ${statusStyles[orders[0].status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                {orders[0].status}
              </span>
            </div>
            <button onClick={() => router.push(`/account/orders/${orders[0].id}`)}
              className="px-6 h-10 bg-red-600 text-gray-900 text-[11px] uppercase tracking-[0.15em] font-medium flex items-center gap-2 hover:bg-gray-50 transition-all duration-500">
              <IconEye className="h-3.5 w-3.5" stroke={1.5} /> View Details
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loadingOrders ? (
        <div className="bg-white border border-gray-200 p-12 flex justify-center">
          <IconLoader2 className="h-6 w-6 animate-spin text-red-600" stroke={1.5} />
        </div>
      ) : orders.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-gray-200 p-12 text-center">
          <IconShoppingBag className="h-8 w-8 text-gray-500 mx-auto mb-4" stroke={1.2} />
          <h3 className="text-xl text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-[13px] text-gray-500 font-light mb-6">Start shopping to see your orders here</p>
          <Link href="/products"
            className="inline-flex items-center gap-2 px-6 h-12 bg-gray-900 text-white text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-red-700 transition-all duration-500">
            Browse Collection <IconArrowRight className="h-4 w-4" stroke={1.5} />
          </Link>
        </div>
      ) : (
        /* Orders Table */
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Order</th>
                  <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Date</th>
                  <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Total</th>
                  <th className="px-6 py-4 text-right text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 last:border-0 hover:bg-gray-50/50 cursor-pointer transition-all"
                    onClick={() => router.push(`/account/orders/${order.id}`)}>
                    <td className="px-6 py-4">
                      <p className="text-[13px] text-gray-900 font-medium">#{order.orderNumber}</p>
                      <p className="text-[11px] text-gray-500 font-light">{order.items.length} {order.items.length === 1 ? "item" : "items"}</p>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-gray-500 font-light">{formatDate(order.date)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[9px] uppercase tracking-[0.15em] font-medium border ${statusStyles[order.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-[13px] text-gray-900 font-medium">{formatCurrency(order.total)}</p>
                      {order.discount > 0 && <p className="text-[11px] text-green-600 font-light">Saved {formatCurrency(order.discount)}</p>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/account/orders/${order.id}`} onClick={(e) => e.stopPropagation()}
                        className="text-[11px] uppercase tracking-[0.15em] text-gray-500 hover:text-red-600 transition-colors font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-[12px] text-gray-500 font-light">
                Page <span className="text-gray-900 font-medium">{pagination.page}</span> of <span className="text-gray-900 font-medium">{pagination.pages}</span>
              </p>
              <div className="flex gap-2">
                <button onClick={() => changePage(pagination.page - 1)} disabled={pagination.page === 1}
                  className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300">
                  <IconChevronLeft className="h-4 w-4" stroke={1.5} />
                </button>
                <button onClick={() => changePage(pagination.page + 1)} disabled={pagination.page === pagination.pages}
                  className="w-9 h-9 flex items-center justify-center border border-gray-200 text-gray-500 hover:border-gray-900 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300">
                  <IconChevronRight className="h-4 w-4" stroke={1.5} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
