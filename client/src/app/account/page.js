"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ClientOnly } from "@/components/client-only";
import { fetchApi, formatDate } from "@/lib/utils";
import { ProtectedRoute } from "@/components/protected-route";
import {
  IconUser,
  IconMail,
  IconPhone,
  IconCalendar,
  IconEdit,
  IconCheck,
  IconX,
  IconMapPin,
  IconLock,
  IconUsers,
  IconCopy,
  IconLoader2,
  IconArrowRight,
  IconCoin,
  IconFlask
} from "@tabler/icons-react";

export default function AccountPage() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", profileImage: null });
  const [addresses, setAddresses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [referralCode, setReferralCode] = useState("");
  const [referralStats, setReferralStats] = useState(null);
  const [isLoadingReferral, setIsLoadingReferral] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (user) setFormData({ name: user.name || "", phone: user.phone || "", profileImage: null });
  }, [user]);

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user) return;
      try {
        const response = await fetchApi("/users/addresses", { credentials: "include" });
        setAddresses(response.data.addresses || []);
      } catch (error) { console.error("Failed to fetch addresses:", error); }
    };
    fetchAddresses();
  }, [user]);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!user) return;
      try {
        setIsLoadingReferral(true);
        const response = await fetchApi("/referrals/my-code", { credentials: "include" });
        if (response.success) {
          setReferralCode(response.data.referralCode);
          setReferralStats(response.data.stats);
        }
      } catch (error) { console.error("Failed to fetch referral data:", error); }
      finally { setIsLoadingReferral(false); }
    };
    fetchReferralData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profileImage" && files.length > 0) {
      setFormData((prev) => ({ ...prev, profileImage: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      setMessage({ type: "error", text: error.message || "Failed to update profile" });
    } finally { setIsSubmitting(false); }
  };

  return (
    <ProtectedRoute>
      <ClientOnly>
        <div className="space-y-8">

          {/* Message */}
          {message.text && (
            <div className={`px-5 py-4 flex items-center gap-3 text-[13px] font-light ${
              message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-neutral-100 text-neutral-900 border border-neutral-200"
            }`}>
              {message.type === "success" ? <IconCheck className="h-4 w-4 flex-shrink-0" stroke={2} /> : <IconX className="h-4 w-4 flex-shrink-0" stroke={2} />}
              {message.text}
            </div>
          )}

          {/* Profile Information */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg text-gray-900 tracking-tight">Profile Information</h2>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-gray-500 hover:text-gray-900 transition-colors">
                  <IconEdit className="h-3.5 w-3.5" stroke={1.5} /> Edit
                </button>
              )}
            </div>

            <div className="p-6">
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Full Name</label>
                      <input
                        name="name" type="text" value={formData.name} onChange={handleChange}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 text-gray-900 text-[13px] font-light focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Phone</label>
                      <input
                        name="phone" type="tel" value={formData.phone} onChange={handleChange}
                        className="w-full h-12 px-4 bg-gray-50 border border-gray-200 text-gray-900 text-[13px] font-light focus:outline-none focus:border-neutral-900 focus:ring-4 focus:ring-neutral-900/10 transition-all duration-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => { setIsEditing(false); setFormData({ name: user?.name || "", phone: user?.phone || "", profileImage: null }); }}
                      className="px-6 h-10 border border-gray-200 text-gray-500 text-[11px] uppercase tracking-[0.15em] font-medium hover:border-gray-900 hover:text-gray-900 transition-all duration-300">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmitting}
                      className="px-6 h-10 bg-gray-900 text-white text-[11px] uppercase tracking-[0.15em] font-medium flex items-center gap-2 hover:bg-neutral-900 disabled:opacity-50 transition-all duration-500">
                      {isSubmitting ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" stroke={1.5} /> : null}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-1.5">
                      <IconUser className="h-3 w-3" stroke={1.5} /> Full Name
                    </span>
                    <p className="text-[14px] text-gray-900 font-light">{user?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-1.5">
                      <IconMail className="h-3 w-3" stroke={1.5} /> Email
                    </span>
                    <p className="text-[14px] text-gray-900 font-light">{user?.email || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-1.5">
                      <IconPhone className="h-3 w-3" stroke={1.5} /> Phone
                    </span>
                    <p className="text-[14px] text-gray-900 font-light">{user?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-1.5">
                      <IconCalendar className="h-3 w-3" stroke={1.5} /> Member Since
                    </span>
                    <p className="text-[14px] text-gray-900 font-light">{user?.createdAt ? formatDate(user.createdAt) : "Unknown"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Addresses */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg text-gray-900 tracking-tight">Saved Addresses</h2>
              <Link href="/account/addresses" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-gray-500 hover:text-gray-900 transition-colors">
                Manage <IconArrowRight className="h-3 w-3" stroke={1.5} />
              </Link>
            </div>
            <div className="p-6">
              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.slice(0, 2).map((address) => (
                    <div key={address.id} className="flex items-start justify-between p-4 bg-gray-50 border border-gray-200">
                      <div>
                        {address.isDefault && (
                          <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-800 font-medium bg-neutral-900/10 px-2 py-0.5 mb-2 inline-block">Default</span>
                        )}
                        <p className="text-[13px] text-gray-900 font-medium">{address.name || user?.name}</p>
                        <p className="text-[12px] text-gray-500 font-light mt-0.5">{address.street}, {address.city}, {address.state} {address.postalCode}</p>
                      </div>
                    </div>
                  ))}
                  {addresses.length > 2 && (
                    <p className="text-[12px] text-gray-500 font-light">+ {addresses.length - 2} more</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 border border-gray-200">
                  <IconMapPin className="h-6 w-6 text-gray-500 mx-auto mb-3" stroke={1.5} />
                  <p className="text-[13px] text-gray-500 font-light mb-4">No addresses added yet</p>
                  <Link href="/account/addresses" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-gray-900 hover:text-neutral-800 transition-colors font-medium">
                    Add Address <IconArrowRight className="h-3 w-3" stroke={1.5} />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Referral Program */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <IconUsers className="h-4 w-4 text-neutral-800" stroke={1.5} />
                <h2 className="text-lg text-gray-900 tracking-tight">Referral Program</h2>
              </div>
              <p className="text-[12px] text-gray-500 font-light mt-1">Share your code with friends and earn rewards</p>
            </div>
            <div className="p-6">
              {isLoadingReferral ? (
                <div className="flex justify-center py-8">
                  <IconLoader2 className="h-6 w-6 animate-spin text-neutral-800" stroke={1.5} />
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 border border-gray-200 mb-6">
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 font-medium mb-2">Your Referral Code</label>
                    <div className="flex items-center gap-3">
                      <input value={referralCode} readOnly
                        className="flex-1 h-12 px-4 bg-white border border-gray-200 text-gray-900 text-[14px] tracking-wider focus:outline-none" />
                      <button onClick={() => { navigator.clipboard.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                        className="h-12 px-5 bg-gray-900 text-white text-[11px] uppercase tracking-[0.15em] font-medium flex items-center gap-2 hover:bg-neutral-900 transition-all duration-500">
                        {copied ? <><IconCheck className="h-3.5 w-3.5" stroke={1.5} /> Copied</> : <><IconCopy className="h-3.5 w-3.5" stroke={1.5} /> Copy</>}
                      </button>
                    </div>
                  </div>

                  {referralStats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {[
                        { label: "Total Referrals", value: referralStats.totalReferrals || 0, color: "text-gray-900" },
                        { label: "Completed", value: referralStats.completedReferrals || 0, color: "text-green-600" },
                        { label: "Pending", value: referralStats.pendingReferrals || 0, color: "text-neutral-800" },
                        { label: "Earnings", value: `₹${parseFloat(referralStats.totalEarnings || 0).toFixed(0)}`, color: "text-neutral-800" },
                      ].map((stat) => (
                        <div key={stat.label} className="p-4 bg-gray-50 border border-gray-200 text-center">
                          <p className={`text-2xl ${stat.color}`}>{stat.value}</p>
                          <p className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mt-1">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white border border-gray-200">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg text-gray-900 tracking-tight">Security</h2>
            </div>
            <div className="p-6">
              <Link href="/account/change-password"
                className="inline-flex items-center gap-2 px-6 h-12 border border-gray-200 text-gray-900 text-[11px] uppercase tracking-[0.15em] font-medium hover:border-neutral-900 hover:text-neutral-800 transition-all duration-500">
                <IconLock className="h-4 w-4" stroke={1.5} /> Change Password
              </Link>
            </div>
          </div>

        </div>
      </ClientOnly>
    </ProtectedRoute>
  );
}
