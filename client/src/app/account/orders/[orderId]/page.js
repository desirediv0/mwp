"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchApi, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import {
  IconLoader2,
  IconArrowLeft,
  IconPackage,
  IconTruck,
  IconPhone,
  IconShoppingBag,
  IconX,
} from "@tabler/icons-react";

const getImageUrl = (image) => {
  if (!image) return "/placeholder.jpg";
  if (typeof image === "string") {
    if (image.startsWith("http")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
  }
  if (image.url) {
    if (image.url.startsWith("http")) return image.url;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image.url}`;
  }
  return "/placeholder.jpg";
};

const statusStyles = {
  PENDING: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-blue-50 text-blue-800 border-blue-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  REFUNDED: "bg-purple-50 text-purple-700 border-purple-200",
};

const paymentStatusColors = {
  PENDING: "text-blue-600",
  SUCCESS: "text-green-600",
  FAILED: "text-red-600",
  REFUNDED: "text-purple-600",
};

export default function OrderDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth?redirect=/account/orders");
      return;
    }

    const fetchOrder = async () => {
      if (!isAuthenticated || !orderId) return;
      setLoading(true);
      setError("");
      try {
        const response = await fetchApi(`/users/orders/${orderId}`, { credentials: "include" });
        if (response.success) {
          setOrder(response.data.order);
        } else {
          setError(response.message || "Failed to load order details.");
        }
      } catch (err) {
        setError("Failed to load order details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [isAuthenticated, authLoading, orderId, router]);

  const handleCancelOrder = async () => {
    if (!order || order.status === "CANCELLED" || order.status === "DELIVERED") return;
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setCancelling(true);
    try {
      const response = await fetchApi(`/users/orders/${orderId}/cancel`, {
        method: "POST",
        credentials: "include",
      });
      if (response.success) {
        toast.success("Order cancelled successfully");
        setOrder({ ...order, status: "CANCELLED" });
      } else {
        toast.error(response.message || "Failed to cancel order");
      }
    } catch (err) {
      toast.error("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <IconLoader2 className="h-6 w-6 animate-spin text-gold mb-4" stroke={1.5} />
        <p className="text-[13px] text-stone font-light">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-line p-12 text-center">
        <IconPackage className="h-8 w-8 text-stone mx-auto mb-4" stroke={1.2} />
        <h3 className="font-display text-xl text-noir mb-2">Error Loading Order</h3>
        <p className="text-[13px] text-stone font-light mb-6">{error}</p>
        <button onClick={() => router.push("/account/orders")}
          className="inline-flex items-center gap-2 px-6 h-10 border border-line text-noir text-[11px] uppercase tracking-[0.15em] font-medium hover:border-gold hover:text-gold transition-all duration-500">
          <IconArrowLeft className="h-3.5 w-3.5" stroke={1.5} /> Back to Orders
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white border border-line p-12 text-center">
        <IconPackage className="h-8 w-8 text-stone mx-auto mb-4" stroke={1.2} />
        <h3 className="font-display text-xl text-noir mb-2">Order Not Found</h3>
        <p className="text-[13px] text-stone font-light mb-6">This order doesn&apos;t exist or has been removed.</p>
        <button onClick={() => router.push("/account/orders")}
          className="inline-flex items-center gap-2 px-6 h-10 border border-line text-noir text-[11px] uppercase tracking-[0.15em] font-medium hover:border-gold hover:text-gold transition-all duration-500">
          <IconArrowLeft className="h-3.5 w-3.5" stroke={1.5} /> Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Link href="/account/orders" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-stone hover:text-noir transition-colors mb-3">
            <IconArrowLeft className="h-3.5 w-3.5" stroke={1.5} /> All Orders
          </Link>
          <h2 className="font-display text-2xl md:text-3xl text-noir tracking-tight">Order #{order.orderNumber}</h2>
          <p className="text-[12px] text-stone font-light mt-1">Placed on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 text-[9px] uppercase tracking-[0.2em] font-medium border ${statusStyles[order.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
            {order.status}
          </span>
          {order.status !== "CANCELLED" && order.status !== "DELIVERED" && order.status !== "SHIPPED" && (
            <button onClick={handleCancelOrder} disabled={cancelling}
              className="inline-flex items-center gap-2 px-4 h-10 border border-red-300 text-red-600 text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-red-50 transition-all duration-300 disabled:opacity-50">
              {cancelling ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" stroke={1.5} /> : <IconX className="h-3.5 w-3.5" stroke={1.5} />}
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-line overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone font-medium">
                Items ({(order.items?.length || 0) + (order.orderBundles?.length || 0)})
              </h3>
            </div>
            <div className="divide-y divide-line">
              {/* Regular items */}
              {order.items?.map((item) => {
                const productImage = item.variant?.images?.[0] || item.product?.images?.[0];
                return (
                  <div key={item.id} className="p-5 flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0 bg-ivory overflow-hidden">
                      <Image src={getImageUrl(productImage)} alt={item.productName || item.product?.name || "Product"} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.product?.slug || "#"}`}
                        className="text-[13px] text-noir font-medium hover:text-gold transition-colors line-clamp-2">
                        {item.productName || item.product?.name}
                      </Link>
                      {item.variant?.options && item.variant.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.variant.options.map((opt, idx) => (
                            <span key={idx} className="text-[10px] text-stone bg-ivory px-2 py-0.5">{opt.name}: {opt.value}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[12px] text-stone font-light">Qty: {item.quantity}</span>
                        <span className="text-[13px] text-noir font-medium">{formatCurrency(item.subtotal)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Bundle items */}
              {order.orderBundles?.map((bundle) => {
                const selectedProducts = bundle.selectedProducts || [];
                return (
                  <div key={bundle.id} className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <span className="inline-flex items-center gap-1 bg-[#A958A4]/10 text-[#A958A4] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">
                        <IconShoppingBag className="h-3 w-3" />
                        Bundle
                      </span>
                      <div className="flex-1">
                        <h4 className="text-[13px] text-noir font-medium">{bundle.bundleName}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] text-noir font-medium">{formatCurrency(bundle.bundlePrice)}</p>
                        {bundle.actualPrice > bundle.bundlePrice && (
                          <p className="text-[10px] text-stone line-through">{formatCurrency(bundle.actualPrice)}</p>
                        )}
                      </div>
                    </div>
                    
                    {/* Bundle products list */}
                    <div className="ml-6 space-y-2">
                      {selectedProducts.map((product, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-[11px]">
                          <div className="w-1 h-1 rounded-full bg-stone" />
                          <span className="text-noir font-medium">{product.name}</span>
                          <span className="text-stone">{formatCurrency(product.price)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Savings */}
                    {bundle.savings > 0 && (
                      <div className="ml-6 mt-2">
                        <span className="text-[10px] text-green-600 font-medium">
                          You saved {formatCurrency(bundle.savings)} on this bundle
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tracking */}
          {order.tracking && (
            <div className="bg-white border border-line overflow-hidden">
              <div className="px-6 py-4 border-b border-line">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone font-medium">Tracking</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <IconTruck className="h-6 w-6 text-gold" stroke={1.5} />
                  <div>
                    <p className="text-[13px] text-noir font-medium">{order.tracking.carrier || "Carrier"}</p>
                    <p className="text-[12px] text-stone font-light">#{order.tracking.trackingNumber}</p>
                  </div>
                </div>
                {order.tracking.updates && order.tracking.updates.length > 0 && (
                  <div className="border-t border-line pt-4 mt-4 space-y-3">
                    {order.tracking.updates.map((update, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-gold flex-shrink-0" />
                        <div>
                          <p className="text-[12px] text-noir font-medium">{update.status}</p>
                          <p className="text-[11px] text-stone font-light">{formatDate(update.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">

          {/* Summary */}
          <div className="bg-white border border-line overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone font-medium">Order Summary</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-stone font-light">Subtotal</span>
                <span className="text-noir">{formatCurrency(order.subTotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-[13px] text-green-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-stone font-light">Shipping</span>
                <span className="text-noir">{order.shippingCost > 0 ? formatCurrency(order.shippingCost) : "Free"}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-stone font-light">Tax</span>
                <span className="text-noir">{formatCurrency(order.tax)}</span>
              </div>
              <div className="border-t border-line pt-3 mt-3 flex justify-between">
                <span className="text-[13px] text-noir font-medium">Total</span>
                <span className="font-display text-lg text-gold">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-line overflow-hidden">
            <div className="px-6 py-4 border-b border-line">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone font-medium">Payment</h3>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-stone font-light">Method</span>
                <span className="text-noir font-medium">{order.paymentMethod || "N/A"}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-stone font-light">Status</span>
                <span className={`font-medium ${paymentStatusColors[order.paymentStatus] || "text-stone"}`}>{order.paymentStatus || "N/A"}</span>
              </div>
              {order.razorpayPayment?.razorpayPaymentId && (
                <div className="flex justify-between text-[13px]">
                  <span className="text-stone font-light">Transaction</span>
                  <span className="text-[11px] text-noir font-mono">{order.razorpayPayment.razorpayPaymentId}</span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white border border-line overflow-hidden">
              <div className="px-6 py-4 border-b border-line">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-stone font-medium">Shipping Address</h3>
              </div>
              <div className="p-6">
                <p className="text-[13px] text-noir font-medium">{order.shippingAddress.name}</p>
                <p className="text-[12px] text-stone font-light mt-1">{order.shippingAddress.street}</p>
                <p className="text-[12px] text-stone font-light">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p className="text-[12px] text-stone font-light">{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="flex items-center gap-1.5 text-[12px] text-stone font-light mt-2">
                    <IconPhone className="h-3 w-3" stroke={1.5} /> {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/account/orders"
              className="flex items-center justify-center gap-2 px-6 h-12 border border-line text-noir text-[11px] uppercase tracking-[0.15em] font-medium hover:border-gold hover:text-gold transition-all duration-500">
              <IconArrowLeft className="h-4 w-4" stroke={1.5} /> Back to Orders
            </Link>
            <Link href="/products"
              className="flex items-center justify-center gap-2 px-6 h-12 bg-noir text-ivory text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-gold transition-all duration-500">
              <IconShoppingBag className="h-4 w-4" stroke={1.5} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
