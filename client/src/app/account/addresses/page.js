"use client";

import { useState, useEffect } from "react";
import { fetchApi } from "@/lib/utils";
import { toast } from "sonner";
import AddressForm from "@/components/AddressForm";
import {
  IconMapPin,
  IconPlus,
  IconEdit,
  IconTrash,
  IconHome,
  IconCheck,
  IconLoader2,
} from "@tabler/icons-react";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await fetchApi("/users/addresses", { credentials: "include" });
      if (response.success) setAddresses(response.data.addresses || []);
    } catch (error) {
      toast.error("Failed to load your addresses");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const handleFormSuccess = () => { setShowAddForm(false); setEditingAddress(null); fetchAddresses(); };

  const handleDeleteAddress = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    setDeletingId(id);
    try {
      const response = await fetchApi(`/users/addresses/${id}`, { method: "DELETE", credentials: "include" });
      if (response.success) { toast.success("Address deleted successfully"); fetchAddresses(); }
    } catch (error) {
      toast.error(error.message || "Failed to delete address");
    } finally { setDeletingId(null); }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const response = await fetchApi(`/users/addresses/${id}/default`, { method: "PATCH", credentials: "include" });
      if (response.success) { toast.success("Default address updated"); fetchAddresses(); }
    } catch (error) { toast.error(error.message || "Failed to set default address"); }
  };

  if (loading && addresses.length === 0) {
    return (
      <div className="flex justify-center py-16">
        <IconLoader2 className="h-6 w-6 animate-spin text-neutral-800" stroke={1.5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-gray-900 tracking-tight">My Addresses</h2>
        {!showAddForm && !editingAddress && (
          <button onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-5 h-10 bg-gray-900 text-white text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-neutral-900 transition-all duration-500">
            <IconPlus className="h-3.5 w-3.5" stroke={1.5} /> Add New
          </button>
        )}
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg text-gray-900 tracking-tight mb-4">Add New Address</h3>
          <AddressForm onSuccess={handleFormSuccess} onCancel={() => setShowAddForm(false)} />
        </div>
      )}

      {/* Edit Form */}
      {editingAddress && (
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg text-gray-900 tracking-tight mb-4">Edit Address</h3>
          <AddressForm existingAddress={editingAddress} onSuccess={handleFormSuccess} onCancel={() => setEditingAddress(null)} />
        </div>
      )}

      {/* Empty State */}
      {addresses.length === 0 && !showAddForm && !editingAddress && (
        <div className="bg-white border border-gray-200 p-12 text-center">
          <IconMapPin className="h-8 w-8 text-gray-500 mx-auto mb-4" stroke={1.2} />
          <h3 className="text-xl text-gray-900 mb-2">No Addresses Yet</h3>
          <p className="text-[13px] text-gray-500 font-light mb-6">Add a shipping address for your orders</p>
          <button onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-6 h-12 bg-gray-900 text-white text-[11px] uppercase tracking-[0.15em] font-medium hover:bg-neutral-900 transition-all duration-500">
            <IconPlus className="h-4 w-4" stroke={1.5} /> Add Address
          </button>
        </div>
      )}

      {/* Address Cards */}
      {addresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="bg-white border border-gray-200 p-5 relative">
              {address.isDefault && (
                <span className="absolute top-4 right-4 text-[9px] uppercase tracking-[0.2em] text-neutral-800 font-medium bg-neutral-900/10 px-2 py-0.5 flex items-center gap-1">
                  <IconCheck className="h-2.5 w-2.5" stroke={2} /> Default
                </span>
              )}
              <div className="mb-4">
                <p className="text-[14px] text-gray-900 font-medium">{address.name}</p>
                <p className="text-[12px] text-gray-500 font-light mt-1">{address.street}</p>
                <p className="text-[12px] text-gray-500 font-light">{address.city}, {address.state} {address.postalCode}</p>
                <p className="text-[12px] text-gray-500 font-light">{address.country}</p>
                {address.phone && <p className="text-[12px] text-gray-500 font-light mt-1">Phone: {address.phone}</p>}
              </div>
              <div className="flex gap-2 flex-wrap pt-4 border-t border-gray-200">
                {!address.isDefault && (
                  <button onClick={() => handleSetDefaultAddress(address.id)}
                    className="inline-flex items-center gap-1.5 px-3 h-8 border border-gray-200 text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all duration-300">
                    <IconHome className="h-3 w-3" stroke={1.5} /> Default
                  </button>
                )}
                <button onClick={() => setEditingAddress(address)}
                  className="inline-flex items-center gap-1.5 px-3 h-8 border border-gray-200 text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:border-gray-900 hover:text-gray-900 transition-all duration-300">
                  <IconEdit className="h-3 w-3" stroke={1.5} /> Edit
                </button>
                <button onClick={() => handleDeleteAddress(address.id)} disabled={deletingId === address.id}
                  className="inline-flex items-center gap-1.5 px-3 h-8 border border-gray-200 text-[10px] uppercase tracking-[0.15em] text-gray-500 hover:border-neutral-900 hover:text-neutral-600 transition-all duration-300 disabled:opacity-50">
                  {deletingId === address.id ? <IconLoader2 className="h-3 w-3 animate-spin" stroke={1.5} /> : <IconTrash className="h-3 w-3" stroke={1.5} />} Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
