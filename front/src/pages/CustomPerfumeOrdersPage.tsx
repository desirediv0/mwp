import { useState, useEffect } from "react";
import { FlaskConical, Search, Eye, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/api/api";
import { toast } from "sonner";

interface CustomPerfumeOrder {
  id: string;
  orderNumber: string;
  userId: string;
  baseNotes: string[];
  heartNotes: string[];
  topNotes: string[];
  bottleSilhouette: string;
  monogramEngraving?: string;
  amount: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  orderStatus: "ORDER_RECEIVED" | "CRAFTING_SAMPLES" | "SAMPLES_SHIPPED" | "FORMULA_CONFIRMED" | "FINAL_BOTTLE_SHIPPED" | "DELIVERED" | "CANCELLED";
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  trackingNumber?: string;
  notes?: string;
  cancelReason?: string;
  createdAt: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export default function CustomPerfumeOrdersPage() {
  const [orders, setOrders] = useState<CustomPerfumeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<CustomPerfumeOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit State inside Modal
  const [editStatus, setEditStatus] = useState<string>("ORDER_RECEIVED");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/custom-perfume-orders");
      if (res.data?.success && res.data?.data) {
        setOrders(res.data.data);
      }
    } catch (err: any) {
      console.error("Failed to fetch custom perfume orders:", err);
      toast.error("Failed to load bespoke custom orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetailModal = (order: CustomPerfumeOrder) => {
    setSelectedOrder(order);
    setEditStatus(order.orderStatus);
    setTrackingNumber(order.trackingNumber || "");
    setAdminNotes(order.notes || "");
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);
      const res = await api.patch(`/admin/custom-perfume-orders/${selectedOrder.id}/status`, {
        orderStatus: editStatus,
        trackingNumber,
        notes: adminNotes
      });

      if (res.data?.success) {
        toast.success("Order status updated successfully!");
        setSelectedOrder(null);
        await fetchOrders();
      }
    } catch (err: any) {
      console.error("Status update error:", err);
      toast.error(err.response?.data?.message || "Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const term = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(term) ||
      order.shippingName.toLowerCase().includes(term) ||
      order.shippingPhone.includes(term) ||
      (order.user?.email && order.user.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#2E7D32] mb-1">
            <FlaskConical className="w-4 h-4" /> Bespoke Order Atelier
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Custom Perfume Orders</h1>
          <p className="text-xs text-slate-500 mt-1">Manage bespoke 100ml custom formula orders, sample crafting, tracking codes, and fulfillment.</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" className="flex items-center gap-2 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh List
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Custom Orders</span>
          <p className="text-2xl font-extrabold text-slate-900">{orders.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-green-600">Paid Revenue</span>
          <p className="text-2xl font-extrabold text-slate-900">
            ₹{orders.filter(o => o.paymentStatus === "PAID").reduce((sum, o) => sum + Number(o.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">In Crafting Progress</span>
          <p className="text-2xl font-extrabold text-slate-900">
            {orders.filter(o => o.orderStatus !== "DELIVERED" && o.orderStatus !== "CANCELLED").length}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by order number, customer name, phone or email..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#2E7D32]"
        />
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-[#2E7D32]" />
          <span className="ml-3 text-sm text-slate-600 font-medium">Loading custom orders...</span>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-500 text-sm">
          No custom perfume orders found matching your search.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Formula Specs</th>
                  <th className="py-3.5 px-4">Label</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Progress Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#2E7D32]">{order.orderNumber}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.shippingName}</div>
                      <div className="text-[11px] text-slate-500">{order.shippingPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="truncate text-slate-800">
                        <strong>B:</strong> {order.baseNotes?.join(", ")}
                      </div>
                      <div className="truncate text-slate-500 text-[11px]">
                        <strong>H:</strong> {order.heartNotes?.join(", ")} | <strong>T:</strong> {order.topNotes?.join(", ")}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 italic">
                      {order.monogramEngraving && order.monogramEngraving !== "None" ? order.monogramEngraving : "-"}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">₹{Number(order.amount).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full font-bold text-[10px] uppercase bg-purple-100 text-purple-900 tracking-wider">
                        {order.orderStatus?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button onClick={() => handleOpenDetailModal(order)} variant="outline" size="sm" className="h-8 text-xs flex items-center gap-1.5 ml-auto">
                        <Eye className="w-3.5 h-3.5" /> View / Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail & Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#2E7D32]">Bespoke Order Details</span>
                <h3 className="text-xl font-bold text-slate-900">{selectedOrder.orderNumber}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">✕</button>
            </div>

            {/* Formula Breakdown */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Selected Perfume Formula:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div><strong>Base Notes:</strong> {selectedOrder.baseNotes?.join(", ")}</div>
                <div><strong>Heart Notes:</strong> {selectedOrder.heartNotes?.join(", ")}</div>
                <div><strong>Top Notes:</strong> {selectedOrder.topNotes?.join(", ")}</div>
                <div><strong>Bottle Silhouette:</strong> {selectedOrder.bottleSilhouette}</div>
                {selectedOrder.monogramEngraving && (
                  <div className="sm:col-span-2 text-purple-900 font-serif italic">
                    <strong>Custom Label:</strong> {selectedOrder.monogramEngraving}
                  </div>
                )}
              </div>
            </div>

            {/* Shipping & Payment Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 p-3 bg-slate-50 rounded-xl border">
                <span className="font-bold text-slate-900 block">Customer & Shipping Details:</span>
                <p className="font-medium text-slate-900">{selectedOrder.shippingName}</p>
                <p className="text-slate-600">Phone: {selectedOrder.shippingPhone}</p>
                {selectedOrder.user?.email && <p className="text-slate-600">Email: {selectedOrder.user.email}</p>}
                <p className="text-slate-600 pt-1">Address: {selectedOrder.shippingAddress}, {selectedOrder.shippingCity}, {selectedOrder.shippingState} - {selectedOrder.shippingPincode}</p>
              </div>
              <div className="space-y-1 p-3 bg-slate-50 rounded-xl border">
                <span className="font-bold text-slate-900 block">Payment & Cancellation Info:</span>
                <p>Status: <strong className="text-green-700">{selectedOrder.paymentStatus}</strong></p>
                <p>Amount: <strong>₹{Number(selectedOrder.amount).toLocaleString()}</strong></p>
                {selectedOrder.razorpayPaymentId && <p className="font-mono text-[10px] text-slate-500">PayID: {selectedOrder.razorpayPaymentId}</p>}
                {selectedOrder.cancelReason && (
                  <p className="text-red-600 font-bold text-xs pt-1">
                    Cancellation Reason: &quot;{selectedOrder.cancelReason}&quot;
                  </p>
                )}
              </div>
            </div>

            {/* Status Update Form */}
            <form onSubmit={handleSaveStatus} className="space-y-4 pt-2 border-t">
              <h4 className="font-bold text-slate-900 text-sm">Update Order Progress Status</h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Step</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
                >
                  <option value="ORDER_RECEIVED">ORDER RECEIVED (Crafting 3 Samples)</option>
                  <option value="CRAFTING_SAMPLES">CRAFTING SAMPLES</option>
                  <option value="SAMPLES_SHIPPED">SAMPLES SHIPPED TO USER</option>
                  <option value="FORMULA_CONFIRMED">FORMULA CONFIRMED BY USER</option>
                  <option value="FINAL_BOTTLE_SHIPPED">FINAL 100ML BOTTLE SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tracking Number (Courier / Shiprocket Code)</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. AWB10928374"
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Perfumer Notes</label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes for perfumer lab or sample code choices..."
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-[#2E7D32]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setSelectedOrder(null)}>Cancel</Button>
                <Button type="submit" disabled={isUpdating} className="bg-[#2E7D32] hover:bg-[#1b5e20] text-white flex items-center gap-2">
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Status & Tracking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
