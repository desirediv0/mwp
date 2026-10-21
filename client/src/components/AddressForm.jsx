"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, XCircle } from "lucide-react";
import { US_STATES, formatUsPhone, isValidUsPhone, isValidUsZip } from "@/lib/us";

// US shipping addresses only: state list, ZIP code and US phone number are validated here
// and again on the server.
export default function AddressForm({ onSuccess, onCancel, existingAddress = null, isInline = false }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: existingAddress?.name || "",
        street: existingAddress?.street || "",
        city: existingAddress?.city || "",
        state: existingAddress?.state || "",
        postalCode: existingAddress?.postalCode || "",
        phone: formatUsPhone(existingAddress?.phone || ""),
        isDefault: existingAddress?.isDefault || false,
    });
    const [errors, setErrors] = useState({});

    const validations = {
        name: (v) => (!v.trim() ? "Name is required" : v.trim().length < 2 ? "Name must be at least 2 characters" : ""),
        street: (v) => (!v.trim() ? "Street address is required" : v.trim().length < 3 ? "Enter your street address" : ""),
        city: (v) => (!v.trim() ? "City is required" : !/^[A-Za-z][A-Za-z .'-]*$/.test(v.trim()) ? "Enter a valid city" : ""),
        state: (v) => (!v ? "Choose a state" : ""),
        postalCode: (v) => (!v.trim() ? "ZIP code is required" : !isValidUsZip(v) ? "Enter a valid ZIP code (12345 or 12345-6789)" : ""),
        phone: (v) => (!v.trim() ? "Phone number is required" : !isValidUsPhone(v) ? (/^[01]/.test(String(v).replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "")) ? "A US area code cannot start with 0 or 1. Use a number like (562) 524-3557" : "Enter a valid US phone number, like (562) 524-3557") : ""),
    };

    const handleChange = (e) => {
        const { name, type, checked } = e.target;
        let value = type === "checkbox" ? checked : e.target.value;
        if (name === "phone") value = formatUsPhone(value);
        if (name === "postalCode") value = String(value).replace(/[^\d-]/g, "").slice(0, 10);
        setFormData((prev) => ({ ...prev, [name]: value }));
        const validationError = validations[name]?.(value) || "";
        setErrors((prev) => ({ ...prev, [name]: validationError, general: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        Object.keys(validations).forEach((field) => {
            const error = validations[field](formData[field]);
            if (error) newErrors[field] = error;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            // name the first problem and jump to it, so it is obvious what to fix
            const order = ["name", "street", "city", "state", "postalCode", "phone"];
            const bad = order.find((f) => validations[f]?.(formData[f]));
            const message = bad ? validations[bad](formData[bad]) : "";
            toast.error(message ? `Please fix: ${message}` : "Please fix the errors in the form");
            if (bad && typeof document !== "undefined") {
                const el = document.getElementById(bad);
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
                el?.focus({ preventScroll: true });
            }
            return;
        }
        setLoading(true);
        try {
            const endpoint = existingAddress ? `/users/addresses/${existingAddress.id}` : "/users/addresses";
            const method = existingAddress ? "PATCH" : "POST";
            const response = await fetchApi(endpoint, {
                method,
                credentials: "include",
                body: JSON.stringify({ ...formData, country: "US" }),
            });
            if (!response.success) throw new Error(response.message || `Failed to ${existingAddress ? "update" : "add"} address`);
            toast.success(`Address ${existingAddress ? "updated" : "added"} successfully`);
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.message || "Failed to save address");
            setErrors((prev) => ({ ...prev, general: error.message }));
        } finally {
            setLoading(false);
        }
    };

    const errorClass = "border-red-500 bg-red-50/40 focus-visible:ring-red-500";
    const fieldError = (name) => errors[name] && <p role="alert" className="mt-1 text-sm font-medium text-red-600">{errors[name]}</p>;

    return (
        <div className={isInline ? "p-4 border rounded-lg mb-4" : ""}>
            {isInline && (
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">Add New Address</h3>
                    <button type="button" onClick={onCancel} className="text-neutral-600 hover:text-gray-700"><XCircle className="h-5 w-5" /></button>
                </div>
            )}
            {errors.general && <div role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{errors.general}</div>}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Label htmlFor="name">Full Name*</Label>
                        <Input id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} className={errors.name ? errorClass : ""} placeholder="Recipient's full name" />
                        {fieldError("name")}
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <Label htmlFor="street">Street Address*</Label>
                        <Input id="street" name="street" autoComplete="address-line1" value={formData.street} onChange={handleChange} className={errors.street ? errorClass : ""} placeholder="123 Main St, Apt 4B" />
                        {fieldError("street")}
                    </div>
                    <div>
                        <Label htmlFor="city">City*</Label>
                        <Input id="city" name="city" autoComplete="address-level2" value={formData.city} onChange={handleChange} className={errors.city ? errorClass : ""} placeholder="City" />
                        {fieldError("city")}
                    </div>
                    <div>
                        <Label htmlFor="state">State*</Label>
                        <select
                            id="state"
                            name="state"
                            autoComplete="address-level1"
                            value={formData.state}
                            onChange={handleChange}
                            className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm ${errors.state ? errorClass : "border-input"}`}
                        >
                            <option value="">Select state</option>
                            {US_STATES.map(([code, name]) => (
                                <option key={code} value={code}>{name}</option>
                            ))}
                        </select>
                        {fieldError("state")}
                    </div>
                    <div>
                        <Label htmlFor="postalCode">ZIP Code*</Label>
                        <Input id="postalCode" name="postalCode" inputMode="numeric" autoComplete="postal-code" value={formData.postalCode} onChange={handleChange} className={errors.postalCode ? errorClass : ""} placeholder="90245" maxLength={10} />
                        {fieldError("postalCode")}
                    </div>
                    <div>
                        <Label htmlFor="phone">Phone Number*</Label>
                        <Input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={formData.phone} onChange={handleChange} className={errors.phone ? errorClass : ""} placeholder="(562) 524-3557" maxLength={14} />
                        {fieldError("phone")}
                    </div>
                    <div className="sm:col-span-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value="United States" readOnly disabled className="bg-neutral-50" />
                        <p className="text-xs text-neutral-500 mt-1">We currently ship within the United States only.</p>
                    </div>
                    <div className="lg:col-span-3">
                        <div className="flex items-center space-x-2">
                            <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <Label htmlFor="isDefault" className="font-normal cursor-pointer">Set as default address</Label>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    {onCancel && <Button type="button" onClick={onCancel} variant="outline" disabled={loading}>Cancel</Button>}
                    <Button type="submit" disabled={loading}>{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{existingAddress ? "Update Address" : "Save Address"}</Button>
                </div>
            </form>
        </div>
    );
}
