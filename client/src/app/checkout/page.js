"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { fetchApi, formatCurrency, loadScript } from "@/lib/utils";
import { playSuccessSound, fireConfetti } from "@/lib/sound-utils";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    AlertCircle,
    Loader2,
    CheckCircle,
    MapPin,
    Plus,
    ShoppingBag,
    PartyPopper,
    Gift,
    Wallet,
    ArrowLeft,
    X,
    Tag,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import AddressForm from "@/components/AddressForm";
import Image from "next/image";
import CheckoutRecommendations from "@/components/sections/CheckoutRecommendations";

const getImageUrl = (image) => {
    if (!image) return "/logo.png";
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export default function CheckoutPage() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();
    const { cart, coupon, getCartTotals, clearCart } = useCart();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [paymentSettings, setPaymentSettings] = useState({
        cashEnabled: false,
        razorpayEnabled: true,
        codCharge: 0,
    });
    const [paymentMethod, setPaymentMethod] = useState("RAZORPAY");
    const [processing, setProcessing] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [paymentId, setPaymentId] = useState("");
    const [razorpayKey, setRazorpayKey] = useState("");
    const [error, setError] = useState("");
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const [successAnimation, setSuccessAnimation] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(2);
    const [confettiCannon, setConfettiCannon] = useState(false);

    const totals = getCartTotals();

    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/auth?redirect=checkout");
        }
    }, [isAuthenticated, router]);

    useEffect(() => {
        if (isAuthenticated && cart.items?.length === 0 && !orderCreated) {
            router.push("/cart");
        }
    }, [isAuthenticated, cart, router, orderCreated]);

    useEffect(() => {
        const fetchPaymentSettings = async () => {
            try {
                const response = await fetchApi("/payment/settings", { credentials: "include" });
                if (response.success) {
                    setPaymentSettings({
                        cashEnabled: false,
                        razorpayEnabled: response.data.razorpayEnabled ?? true,
                        codCharge: response.data.codCharge ?? 0,
                    });
                    if (response.data.razorpayEnabled ?? true) {
                        setPaymentMethod("RAZORPAY");
                    }
                }
            } catch (error) {
                console.error("Error fetching payment settings:", error);
                setPaymentMethod("RAZORPAY");
            }
        };
        fetchPaymentSettings();
    }, []);

    const fetchAddresses = useCallback(async () => {
        if (!isAuthenticated) return;
        setLoadingAddresses(true);
        try {
            const response = await fetchApi("/users/addresses", { credentials: "include" });
            if (response.success) {
                setAddresses(response.data.addresses || []);
                if (response.data.addresses?.length > 0) {
                    const defaultAddress = response.data.addresses.find((addr) => addr.isDefault);
                    setSelectedAddressId(defaultAddress ? defaultAddress.id : response.data.addresses[0].id);
                }
            }
        } catch (error) {
            console.error("Error fetching addresses:", error);
            toast.error("Failed to load your addresses");
        } finally {
            setLoadingAddresses(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    useEffect(() => {
        const fetchRazorpayKey = async () => {
            try {
                const response = await fetchApi("/payment/razorpay-key", { credentials: "include" });
                if (response.success) {
                    setRazorpayKey(response.data.key);
                }
            } catch (error) {
                console.error("Error fetching Razorpay key:", error);
            }
        };
        if (isAuthenticated) fetchRazorpayKey();
    }, [isAuthenticated]);

    const handleAddressSelect = (id) => setSelectedAddressId(id);
    const handlePaymentMethodSelect = (method) => setPaymentMethod(method);
    const handleAddressFormSuccess = () => {
        setShowAddressForm(false);
        fetchAddresses();
    };

    useEffect(() => {
        if (orderCreated && redirectCountdown > 0) {
            const timer = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000);
            return () => clearTimeout(timer);
        } else if (orderCreated && redirectCountdown === 0) {
            router.push("/account/orders");
        }
    }, [orderCreated, redirectCountdown, router]);

    useEffect(() => {
        if (successAnimation) {
            fireConfetti.celebration();
            const timer = setTimeout(() => {
                setConfettiCannon(true);
                fireConfetti.sides();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [successAnimation]);

    const handleSuccessfulPayment = (paymentResponse = null, orderData = null) => {
        if (paymentResponse?.razorpay_payment_id) setPaymentId(paymentResponse.razorpay_payment_id);
        if (orderData?.orderNumber) setOrderNumber(orderData.orderNumber);
        setSuccessAnimation(true);
        playSuccessSound();
        clearCart();
        const orderNum = orderData?.orderNumber || orderNumber || "";
        toast.success("Order confirmed!", {
            duration: 4000,
            icon: <PartyPopper className="h-5 w-5 text-green-500" />,
            description: orderNum ? `Order #${orderNum} confirmed. Redirecting…` : "Redirecting to your orders…",
        });
        setTimeout(() => setOrderCreated(true), 100);
    };

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            toast.error("Please select a shipping address");
            return;
        }

        setProcessing(true);
        setError("");

        try {
            const calculatedAmount = totals.total;
            const amount = Math.max(parseFloat(calculatedAmount.toFixed(2)), 1);

            if (calculatedAmount < 1) {
                toast.info("Minimum order amount is ₹1. Your total has been adjusted.");
            }

            if (paymentMethod === "CASH") {
                toast.loading("Creating your order...", { id: "order-creation", duration: 10000 });
                const orderResponse = await fetchApi("/payment/cash-order", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        shippingAddressId: selectedAddressId,
                        billingAddressSameAsShipping: true,
                        couponCode: coupon?.code || null,
                        couponId: coupon?.id || null,
                        discountAmount: totals.discount || 0,
                    }),
                });
                toast.dismiss("order-creation");
                if (!orderResponse.success) throw new Error(orderResponse.message || "Failed to create order");
                const orderData = {
                    orderNumber: orderResponse.data.orderNumber,
                    orderId: orderResponse.data.orderId,
                    paymentMethod: orderResponse.data.paymentMethod || "CASH",
                };
                setOrderNumber(orderResponse.data.orderNumber);
                setOrderId(orderResponse.data.orderId || "");
                handleSuccessfulPayment(null, orderData);
                return;
            } else if (paymentMethod === "RAZORPAY") {
                if (!razorpayKey) {
                    try {
                        const keyResponse = await fetchApi("/payment/razorpay-key", { method: "GET", credentials: "include" });
                        if (keyResponse.success && keyResponse.data?.key) {
                            setRazorpayKey(keyResponse.data.key);
                        } else {
                            throw new Error("Payment gateway key missing.");
                        }
                    } catch {
                        throw new Error("Failed to initialize payment gateway.");
                    }
                }

                toast.loading("Creating your order...", { id: "order-creation", duration: 10000 });
                const orderResponse = await fetchApi("/payment/checkout", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({
                        amount,
                        currency: "INR",
                        paymentGateway: "RAZORPAY",
                        couponCode: coupon?.code || null,
                        couponId: coupon?.id || null,
                        discountAmount: totals.discount || 0,
                    }),
                });
                toast.dismiss("order-creation");
                if (!orderResponse.success) throw new Error(orderResponse.message || "Failed to create order");

                toast.success("Order created! Redirecting to payment…", { duration: 2000 });
                const razorpayOrder = orderResponse.data;
                setOrderId(razorpayOrder.id);

                toast.loading("Loading payment gateway...", { id: "payment-gateway", duration: 5000 });
                const loaded = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
                toast.dismiss("payment-gateway");
                if (!loaded) throw new Error("Payment gateway failed to load.");

                let currentKey = razorpayKey;
                if (!currentKey) {
                    try {
                        const keyResponse = await fetchApi("/payment/razorpay-key", { method: "GET", credentials: "include" });
                        if (keyResponse.success && keyResponse.data?.key) {
                            currentKey = keyResponse.data.key;
                            setRazorpayKey(currentKey);
                        }
                    } catch (err) {
                        console.error("Failed to fetch Razorpay key:", err);
                    }
                }
                if (!currentKey) throw new Error("Razorpay gateway keys are misconfigured.");

                const options = {
                    key: currentKey,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    name: "MWP SUPPLEMENTS",
                    description: "MWP SUPPLEMENTS - Men | Women | Power",
                    order_id: razorpayOrder.id,
                    prefill: {
                        name: user?.name || "",
                        email: user?.email || "",
                        contact: user?.phone || "",
                    },
                    handler: async function (response) {
                        setProcessing(true);
                        toast.loading("Verifying payment...", { id: "payment-verification", duration: 10000 });
                        try {
                            const verificationResponse = await fetchApi("/payment/verify", {
                                method: "POST",
                                credentials: "include",
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpaySignature: response.razorpay_signature,
                                    shippingAddressId: selectedAddressId,
                                    billingAddressSameAsShipping: true,
                                    couponCode: coupon?.code || null,
                                    couponId: coupon?.id || null,
                                    discountAmount: totals.discount || 0,
                                    notes: "",
                                }),
                            });
                            toast.dismiss("payment-verification");
                            if (verificationResponse.success) {
                                toast.success("Payment verified!", { duration: 3000 });
                                setOrderId(verificationResponse.data.orderId);
                                handleSuccessfulPayment(response, verificationResponse.data);
                            } else {
                                throw new Error(verificationResponse.message || "Payment verification failed");
                            }
                        } catch (error) {
                            console.error("Payment verification error:", error);
                            toast.dismiss("payment-verification");
                            setError(error.message || "Payment verification failed");
                            toast.error(error.message || "Verification failed. Please contact support.");
                            setProcessing(false);
                        }
                    },
                    theme: { color: "#000000" },
                    modal: { ondismiss: () => setProcessing(false) },
                };

                const razorpay = new window.Razorpay(options);
                razorpay.open();
            }
        } catch (error) {
            console.error("Checkout error:", error);
            toast.dismiss("order-creation");
            toast.dismiss("payment-gateway");
            toast.dismiss("payment-verification");
            setError(error.message || "Checkout failed");
            toast.error(error.message || "Checkout failed. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    if (!isAuthenticated || loadingAddresses) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="w-8 h-8 border border-black/10 border-t-black rounded-full animate-spin" />
                <p className="text-[10px] text-black/30 uppercase tracking-[0.2em] font-medium">Loading Checkout</p>
            </div>
        );
    }

    if (orderCreated) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center py-20 px-4">
                <div className="max-w-lg w-full text-center">
                    <div className="w-20 h-20 mx-auto mb-8 border border-green-100 rounded-full flex items-center justify-center bg-green-50/50">
                        <PartyPopper className="h-10 w-10 text-green-600" strokeWidth={1} />
                    </div>
                    <h1 className="text-3xl font-light text-black mb-2 tracking-tight">Order Confirmed</h1>
                    {orderNumber && (
                        <p className="text-[11px] text-black/40 uppercase tracking-[0.2em] font-medium mb-4">
                            Order #{orderNumber}
                        </p>
                    )}
                    <div className="inline-flex items-center gap-2 bg-green-50/50 border border-green-100 px-4 py-2 rounded-full mb-6">
                        <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        <span className="text-[10px] font-medium text-green-700 uppercase tracking-wider">Payment Received</span>
                    </div>
                    <p className="text-[13px] text-black/40 font-light leading-relaxed max-w-sm mx-auto mb-8">
                        Thank you for your order. A confirmation email has been sent to your registered address.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-black/30 mb-8">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Redirecting in {redirectCountdown}s · <Link href="/account/orders" className="underline hover:text-black">Go now</Link></span>
                    </div>
                    <div className="flex justify-center gap-3">
                        <Link href="/account/orders">
                            <button className="bg-neutral-900 text-white text-[11px] uppercase tracking-[0.15em] font-bold px-6 py-3 rounded-xl hover:bg-neutral-900 transition-all">
                                My Orders
                            </button>
                        </Link>
                        <Link href="/products">
                            <button className="border border-black/10 text-black text-[10px] uppercase tracking-[0.2em] font-medium px-6 py-3 hover:border-black/30 transition-all">
                                Continue Shopping
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-20 sm:pb-24">
            {/* Processing Overlay */}
            {processing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white p-8 max-w-sm mx-4 text-center space-y-4 border border-black/5 rounded-lg">
                        <div className="w-12 h-12 mx-auto border border-black/10 rounded-full flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-black animate-spin" />
                        </div>
                        <h3 className="text-sm uppercase tracking-[0.15em] text-black font-medium">Processing</h3>
                        <p className="text-[11px] text-black/40 font-light">Do not close this window</p>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">
                {/* Header */}
                <div className="mb-8 sm:mb-12">
                    <Link href="/cart" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-black/30 hover:text-black transition-colors mb-4 sm:mb-6">
                        <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
                        Back to Cart
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-light text-black tracking-tight">Checkout</h1>
                    <p className="text-[11px] text-black/30 mt-1 uppercase tracking-widest">Secure · Encrypted · SSL</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-neutral-100/50 border border-neutral-200 rounded-lg flex items-start gap-3 text-xs text-neutral-800">
                        <AlertCircle className="flex-shrink-0 mt-0.5 h-4 w-4" />
                        <div>
                            <p className="font-medium uppercase tracking-wider text-[10px]">Payment Error</p>
                            <p className="mt-0.5 text-[11px]">{error}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                    {/* Left Column */}
                    <div className="lg:col-span-8 space-y-5">
                        {/* Address */}
                        <div className="bg-white border border-black/5 rounded-lg p-5 sm:p-6">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-black/5">
                                <h2 className="text-sm uppercase tracking-[0.15em] text-black font-medium flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-black/40" strokeWidth={1.5} />
                                    Shipping Address
                                </h2>
                                <button
                                    onClick={() => setShowAddressForm(!showAddressForm)}
                                    className="text-[10px] uppercase tracking-widest text-black/40 hover:text-black transition-colors flex items-center gap-1 font-medium"
                                >
                                    {showAddressForm ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                    {showAddressForm ? "Cancel" : "Add New"}
                                </button>
                            </div>

                            {showAddressForm && (
                                <div className="mb-5 p-5 border border-black/5 rounded-lg bg-black/[0.01]">
                                    <AddressForm
                                        onSuccess={handleAddressFormSuccess}
                                        onCancel={() => setShowAddressForm(false)}
                                        isInline={true}
                                    />
                                </div>
                            )}

                            {addresses.length === 0 && !showAddressForm ? (
                                <div className="text-center py-8 text-[12px] text-black/30 font-light">
                                    No addresses found. Please add one to continue.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {addresses.map((address) => {
                                        const selected = selectedAddressId === address.id;
                                        return (
                                            <div
                                                key={address.id}
                                                onClick={() => handleAddressSelect(address.id)}
                                                className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                                    selected
                                                        ? "border-black bg-black/[0.02]"
                                                        : "border-black/5 hover:border-black/20 bg-white"
                                                }`}
                                            >
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[11px] text-black/70 uppercase tracking-wider font-medium">{address.name}</span>
                                                    {address.isDefault && (
                                                        <span className="text-[8px] uppercase tracking-[0.15em] bg-black text-white px-2 py-0.5 rounded-sm font-medium">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-black/40 leading-relaxed mb-3">
                                                    <p>{address.street}</p>
                                                    <p>{address.city}, {address.state} {address.postalCode}</p>
                                                    <p>{address.country}</p>
                                                    {address.phone && <p className="mt-1 text-black/50 font-medium">{address.phone}</p>}
                                                </div>
                                                <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                                                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${selected ? "border-black" : "border-black/20"}`}>
                                                        {selected && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />}
                                                    </div>
                                                    <span className="text-[10px] text-black/40 font-medium">Ship here</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Payment */}
                        <div className="bg-white border border-black/5 rounded-lg p-5 sm:p-6">
                            <h2 className="text-sm uppercase tracking-[0.15em] text-black font-medium mb-5 pb-4 border-b border-black/5">
                                Payment Method
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {paymentSettings.razorpayEnabled && (
                                    <div
                                        onClick={() => handlePaymentMethodSelect("RAZORPAY")}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                            paymentMethod === "RAZORPAY"
                                                ? "border-black bg-black/[0.02]"
                                                : "border-black/5 hover:border-black/20 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMethod === "RAZORPAY" ? "border-black" : "border-black/20"}`}>
                                                {paymentMethod === "RAZORPAY" && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />}
                                            </div>
                                            <CreditCard className="h-4 w-4 text-black/40" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-[11px] uppercase tracking-wider text-black/70 font-medium">Card / UPI / NetBanking</h3>
                                        <p className="text-[10px] text-black/30 mt-1 font-light">Secure payment via Razorpay</p>
                                    </div>
                                )}
                                {paymentSettings.cashEnabled && (
                                    <div
                                        onClick={() => handlePaymentMethodSelect("CASH")}
                                        className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                            paymentMethod === "CASH"
                                                ? "border-black bg-black/[0.02]"
                                                : "border-black/5 hover:border-black/20 bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${paymentMethod === "CASH" ? "border-black" : "border-black/20"}`}>
                                                {paymentMethod === "CASH" && <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />}
                                            </div>
                                            <Wallet className="h-4 w-4 text-black/40" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-[11px] uppercase tracking-wider text-black/70 font-medium">Cash on Delivery</h3>
                                        <p className="text-[10px] text-black/30 mt-1 font-light">Pay upon delivery</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recommended products */}
                        <CheckoutRecommendations title="Add to Your Order" />
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-black/5 rounded-lg p-5 sm:p-6 sticky top-24">
                            <h2 className="text-sm uppercase tracking-[0.15em] text-black font-medium mb-5 pb-4 border-b border-black/5">
                                Order Summary
                            </h2>

                            {/* Items */}
                            <div className="max-h-52 overflow-y-auto space-y-3 mb-5 pb-5 border-b border-black/5">
                                {cart.items?.map((item) => {
                                    const isBundle = item.cartItemType === "BUNDLE";
                                    let img, name;

                                    if (isBundle) {
                                        img = item.bundleData?.selectedProducts?.[0]?.image || item.bundleCampaign?.banner;
                                        name = item.bundleCampaign?.title || "Bundle";
                                    } else {
                                        img = item.variant?.images?.[0]?.url || item.product?.image || item.image;
                                        name = item.productName || item.product?.name;
                                    }

                                    return (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <div className="relative w-10 h-12 bg-black/[0.02] border border-black/5 rounded-md overflow-hidden flex-shrink-0">
                                                <Image src={getImageUrl(img)} alt="" fill className="object-cover" />
                                                {isBundle && (
                                                    <div className="absolute top-0 left-0 bg-neutral-900 text-white text-[5px] font-bold px-1 py-0.5 rounded-br-sm">
                                                        BUNDLE
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[10px] text-black/70 uppercase tracking-wider truncate font-medium">{name}</h4>
                                                {isBundle && item.bundleData?.selectedProducts?.length > 0 && (
                                                    <p className="text-[9px] text-black/30 mt-0.5">{item.bundleData.selectedProducts.length} items</p>
                                                )}
                                                {!isBundle && (
                                                    <p className="text-[9px] text-black/30 mt-0.5">Qty: {item.quantity}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[11px] text-black font-medium">{formatCurrency(item.subtotal)}</span>
                                                {isBundle && item.bundleData?.actualPrice > item.bundleData?.bundlePrice && (
                                                    <p className="text-[8px] text-black/20 line-through">{formatCurrency(item.bundleData.actualPrice)}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Coupon */}
                            {coupon && (
                                <div className="flex items-center justify-between bg-green-50/50 border border-green-100 p-2.5 rounded-md mb-4">
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-3 w-3 text-green-600" />
                                        <span className="text-[10px] text-green-700 font-medium uppercase tracking-wider">{coupon.code}</span>
                                    </div>
                                    <span className="text-[10px] text-green-600 font-medium">-{formatCurrency(totals.discount)}</span>
                                </div>
                            )}

                            {/* Breakdown */}
                            <div className="space-y-2.5 text-[11px] mb-4 pb-4 border-b border-black/5">
                                <div className="flex justify-between">
                                    <span className="text-black/40 uppercase tracking-wider">Subtotal</span>
                                    <span className="font-medium text-black">{formatCurrency(totals.subtotal)}</span>
                                </div>
                                {totals.discount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span className="uppercase tracking-wider">Discount</span>
                                        <span className="font-medium">-{formatCurrency(totals.discount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-black/40 uppercase tracking-wider">Tax (0%)</span>
                                    <span className="font-medium text-black">₹0.00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black/40 uppercase tracking-wider">Shipping</span>
                                    {totals.shipping > 0 ? (
                                        <span className="font-medium text-black">{formatCurrency(totals.shipping)}</span>
                                    ) : (
                                        <span className="font-medium text-green-600 uppercase tracking-widest text-[10px]">Free</span>
                                    )}
                                </div>
                                {totals.shipping === 0 && cart.freeShippingThreshold > 0 && (
                                    <p className="text-[9px] text-green-600 text-right">🎉 Free shipping applied!</p>
                                )}
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-baseline mb-5">
                                <span className="text-[11px] uppercase tracking-[0.15em] text-black/50 font-medium">Total</span>
                                <span className="text-xl font-light text-black">{formatCurrency(totals.total)}</span>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={processing || !selectedAddressId}
                                className="w-full bg-gradient-to-r from-neutral-900 to-neutral-800 text-white text-[12px] uppercase tracking-[0.15em] font-bold py-4 rounded-xl hover:from-neutral-800 hover:to-neutral-900 shadow-lg shadow-neutral-900/25 transition-all disabled:opacity-40 active:scale-[0.99]"
                            >
                                {processing ? "Processing…" : `Pay ${formatCurrency(totals.total)}`}
                            </button>

                            <p className="text-[9px] text-black/20 text-center mt-3">
                                256-bit SSL encrypted
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
