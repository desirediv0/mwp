"use client";
import { formatUsPhone, formatCityLine, formatCountry } from "@/lib/us";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { fetchApi, formatCurrency } from "@/lib/utils";
import { playSuccessSound, fireConfetti } from "@/lib/sound-utils";
import { trackEvent } from "@/lib/track";
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
    Truck,
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
    if (!image) return "/mwp-logo.png";
    if (image.startsWith("http") || image.startsWith("/")) return image;
    return `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
};

export default function CheckoutPage() {
    const { isAuthenticated, user, loading: authLoading } = useAuth();
    const router = useRouter();
    const { cart, coupon, getCartTotals, clearCart, loading: cartLoading, mergeProgress } = useCart();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [paymentSettings, setPaymentSettings] = useState({
        stripeEnabled: false,
    });
    const [paymentMethod, setPaymentMethod] = useState("");
    const [loadingPaymentSettings, setLoadingPaymentSettings] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [orderCreated, setOrderCreated] = useState(false);
    const [orderId, setOrderId] = useState("");
    const [error, setError] = useState("");
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [orderNumber, setOrderNumber] = useState("");
    const purchaseTracked = useRef(false);
    const checkoutTracked = useRef(false);
    const [successAnimation, setSuccessAnimation] = useState(false);
    const [redirectCountdown, setRedirectCountdown] = useState(2);
    const [confettiCannon, setConfettiCannon] = useState(false);

    const totals = getCartTotals();

    // Shipping options from the carrier (USPS / UPS / FedEx) for the chosen address
    const [shippingQuote, setShippingQuote] = useState(null);
    const [selectedRateId, setSelectedRateId] = useState("");
    const [loadingRates, setLoadingRates] = useState(false);
    const [ratesError, setRatesError] = useState("");
    const selectedRate = shippingQuote?.rates?.find((r) => r.id === selectedRateId) || null;
    const shippingPrice = selectedRate ? selectedRate.price : 0;
    const checkoutTotal = totals.subtotal - totals.discount + shippingPrice;
    const prettyService = (service) => String(service || "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");

    // Stripe sends the customer back to /checkout?stripe_session=... after paying.
    // Keep that flag so the empty-cart redirect below does not fire (the order may already have cleared the cart).
    const [returningFromStripe] = useState(
        () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("stripe_session")
    );
    const confirmStarted = useRef(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/auth?redirect=checkout");
        }
    }, [isAuthenticated, authLoading, router]);

    useEffect(() => {
        if (!cartLoading && !mergeProgress && isAuthenticated && cart.items?.length === 0 && !orderCreated && !returningFromStripe) {
            router.push("/cart");
        }
    }, [isAuthenticated, cart, cartLoading, mergeProgress, router, orderCreated, returningFromStripe]);

    useEffect(() => {
        const fetchPaymentSettings = async () => {
            try {
                const response = await fetchApi("/payment/settings", { credentials: "include" });
                if (response.success) {
                    setPaymentSettings({ stripeEnabled: !!response.data.stripeEnabled });
                    setPaymentMethod(response.data.stripeEnabled ? "STRIPE" : "");
                }
            } catch (error) {
                console.error("Error fetching payment settings:", error);
                setPaymentMethod("");
                setError("Payment options could not be loaded. Please refresh and try again.");
            } finally {
                setLoadingPaymentSettings(false);
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

    const cartSignature = (cart.items || []).map((i) => `${i.id}:${i.quantity}`).join(",");
    useEffect(() => {
        if (checkoutTracked.current || !isAuthenticated || !cart.items?.length || returningFromStripe) return;
        checkoutTracked.current = true;
        trackEvent("begin_checkout", {
            value: totals.subtotal - totals.discount,
            items: cart.items.map((i) => ({ item_id: i.variant?.sku || i.variantId || i.id, item_name: i.product?.name || i.name, price: parseFloat(i.price || i.variant?.price || 0), quantity: i.quantity })),
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, cartSignature]);
    useEffect(() => {
        if (!isAuthenticated || !selectedAddressId || !cartSignature || returningFromStripe) return;
        let cancelled = false;
        setLoadingRates(true);
        setRatesError("");
        setShippingQuote(null);
        setSelectedRateId("");
        fetchApi("/shipping/rates", {
            method: "POST",
            credentials: "include",
            body: JSON.stringify({ shippingAddressId: selectedAddressId, couponId: coupon?.id || null }),
        })
            .then((res) => {
                if (cancelled) return;
                if (!res.success) throw new Error(res.message || "Could not load shipping options");
                setShippingQuote(res.data);
                setSelectedRateId(res.data.rates?.[0]?.id || "");
            })
            .catch((err) => {
                if (!cancelled) setRatesError(err.message || "Could not load shipping options");
            })
            .finally(() => {
                if (!cancelled) setLoadingRates(false);
            });
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, selectedAddressId, cartSignature, coupon?.id, returningFromStripe]);

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
        if (orderData?.analytics && !purchaseTracked.current) {
            purchaseTracked.current = true;
            trackEvent("purchase", {
                value: orderData.analytics.value,
                eventId: orderData.orderId,
                items: orderData.analytics.items,
                extra: { transaction_id: orderData.orderNumber, tax: orderData.analytics.tax, shipping: orderData.analytics.shipping, coupon: orderData.analytics.coupon },
            });
        }
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

    // Back from Stripe: confirm the paid session and show the success screen
    useEffect(() => {
        if (!isAuthenticated || confirmStarted.current || typeof window === "undefined") return;
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get("stripe_session");

        if (params.get("canceled")) {
            toast.info("Payment was canceled. Your cart is still here.");
            window.history.replaceState({}, "", "/checkout");
            return;
        }
        if (!sessionId) return;

        confirmStarted.current = true;
        setProcessing(true);
        (async () => {
            try {
                const response = await fetchApi("/payment/confirm", {
                    method: "POST",
                    credentials: "include",
                    body: JSON.stringify({ sessionId }),
                });
                if (!response.success) throw new Error(response.message || "Could not confirm your payment");
                window.history.replaceState({}, "", "/checkout");
                setOrderId(response.data.orderId);
                handleSuccessfulPayment(null, response.data);
            } catch (err) {
                console.error("Payment confirmation error:", err);
                setError(err.message || "Could not confirm your payment. If you were charged, please contact support.");
                toast.error(err.message || "Could not confirm your payment.");
            } finally {
                setProcessing(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated]);

    const handleCheckout = async () => {
        if (processing || loadingPaymentSettings || !paymentMethod) return;
        if (!selectedAddressId) {
            toast.error("Please select a shipping address");
            return;
        }
        if (!selectedRateId) {
            toast.error("Please choose a shipping option");
            return;
        }

        setProcessing(true);
        setError("");
        let redirecting = false;

        try {
            toast.loading("Preparing secure payment...", { id: "order-creation", duration: 10000 });
            const response = await fetchApi("/payment/checkout", {
                method: "POST",
                credentials: "include",
                body: JSON.stringify({
                    currency: "USD",
                    shippingAddressId: selectedAddressId,
                    billingAddressSameAsShipping: true,
                    couponCode: coupon?.code || null,
                    couponId: coupon?.id || null,
                    discountAmount: totals.discount || 0,
                    shipmentId: shippingQuote?.shipmentId || null,
                    rateId: selectedRateId,
                }),
            });
            toast.dismiss("order-creation");
            if (!response.success || !response.data?.url) throw new Error(response.message || "Could not start the payment");

            redirecting = true;
            window.location.href = response.data.url;
        } catch (error) {
            console.error("Checkout error:", error);
            toast.dismiss("order-creation");
            setError(error.message || "Checkout failed");
            toast.error(error.message || "Checkout failed. Please try again.");
        } finally {
            if (!redirecting) setProcessing(false);
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
        <div className="mwp-checkout min-h-screen bg-white pb-20 sm:pb-24">
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
                    <h1 className="text-3xl sm:text-4xl font-semibold text-black tracking-tight">Checkout</h1>
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
                        <div className="bg-white border border-[#e6ded2] rounded-2xl p-5 sm:p-6">
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
                                <div className="mb-5 p-5 border border-[#e6ded2] rounded-2xl bg-white">
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
                                                        <span className="text-[8px] uppercase tracking-[0.15em] bg-[#12213F] text-white px-2 py-0.5 rounded-sm font-medium">
                                                            Default
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-black/40 leading-relaxed mb-3">
                                                    <p>{address.street}</p>
                                                    <p>{formatCityLine(address)}</p>
                                                    <p>{formatCountry(address.country)}</p>
                                                    {address.phone && <p className="mt-1 text-black/50 font-medium">{formatUsPhone(address.phone)}</p>}
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

                        {/* Shipping method */}
                        <div className="bg-white border border-[#e6ded2] rounded-2xl p-5 sm:p-6">
                            <h2 className="text-sm uppercase tracking-[0.15em] text-black font-medium mb-5 pb-4 border-b border-black/5 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-black/40" strokeWidth={1.5} />
                                Shipping Method
                            </h2>
                            {!selectedAddressId ? (
                                <p className="text-[12px] text-black/40">Choose a shipping address to see delivery options.</p>
                            ) : loadingRates ? (
                                <div className="flex items-center gap-2 text-[12px] text-black/40">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Getting live rates from USPS, UPS and FedEx…
                                </div>
                            ) : ratesError ? (
                                <p className="text-[12px] text-neutral-700">{ratesError}</p>
                            ) : (
                                <div className="space-y-2.5">
                                    {shippingQuote?.rates?.map((rate, idx) => {
                                        const selected = selectedRateId === rate.id;
                                        return (
                                            <label
                                                key={rate.id}
                                                className={`flex items-center justify-between gap-3 border rounded-lg p-4 cursor-pointer transition-all ${
                                                    selected ? "border-black bg-black/[0.02]" : "border-black/10 hover:border-black/30"
                                                }`}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="shipping-rate"
                                                        checked={selected}
                                                        onChange={() => setSelectedRateId(rate.id)}
                                                        className="h-4 w-4 accent-neutral-900"
                                                    />
                                                    <span>
                                                        <span className="block text-[12px] font-medium text-black">
                                                            {rate.carrier} {prettyService(rate.service)}
                                                            {idx === 0 && <span className="ml-2 text-[9px] uppercase tracking-wider bg-[#12213F] text-white px-1.5 py-0.5 rounded-sm">Best value</span>}
                                                        </span>
                                                        <span className="block text-[11px] text-black/40 mt-0.5">
                                                            {rate.days ? `Delivery in about ${rate.days} business day${rate.days === 1 ? "" : "s"}` : "Standard delivery"}
                                                        </span>
                                                    </span>
                                                </span>
                                                <span className="text-[12px] font-medium text-black">
                                                    {rate.price > 0 ? formatCurrency(rate.price) : "Free"}
                                                </span>
                                            </label>
                                        );
                                    })}
                                    {shippingQuote?.freeShipping && (
                                        <p className="text-[10px] text-green-600">Your order qualifies for free shipping on the first option.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Payment */}
                        <div className="bg-white border border-[#e6ded2] rounded-2xl p-5 sm:p-6">
                            <h2 className="text-sm uppercase tracking-[0.15em] text-black font-medium mb-5 pb-4 border-b border-black/5">
                                Payment Method
                            </h2>
                            {paymentSettings.stripeEnabled && (
                                <div className="border border-black rounded-lg p-4 bg-black/[0.02]">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center">
                                            <div className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
                                        </div>
                                        <CreditCard className="h-4 w-4 text-black/40" strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-[11px] uppercase tracking-wider text-black/70 font-medium">Credit / Debit Card</h3>
                                    <p className="text-[10px] text-black/30 mt-1 font-light">
                                        You will pay on Stripe&apos;s secure page, then come straight back here. All prices are in USD.
                                    </p>
                                </div>
                            )}
                        </div>

                        {!loadingPaymentSettings && !paymentSettings.stripeEnabled && <p className="text-sm text-neutral-600">Checkout is temporarily unavailable. Please contact us for help.</p>}

                        {/* Recommended products */}
                        <CheckoutRecommendations title="Add to Your Order" />
                    </div>

                    {/* Right Column - Summary */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-[#e6ded2] rounded-2xl p-5 sm:p-6 sticky top-24">
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
                                            <div className="relative w-10 h-12 bg-white border border-[#e6ded2] rounded-md overflow-hidden flex-shrink-0">
                                                <Image src={getImageUrl(img)} alt="" fill className="object-contain p-1" />
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
                                    <span className="font-medium text-black">$0.00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-black/40 uppercase tracking-wider">Shipping</span>
                                    {!selectedRate ? (
                                        <span className="font-medium text-black/40 text-[10px] uppercase tracking-widest">{loadingRates ? "Calculating…" : "Choose option"}</span>
                                    ) : selectedRate.price > 0 ? (
                                        <span className="font-medium text-black">{formatCurrency(selectedRate.price)}</span>
                                    ) : (
                                        <span className="font-medium text-green-600 uppercase tracking-widest text-[10px]">Free</span>
                                    )}
                                </div>
                                {selectedRate && (
                                    <p className="text-[9px] text-black/40 text-right">{selectedRate.carrier} {prettyService(selectedRate.service)}</p>
                                )}
                            </div>

                            {/* Total */}
                            <div className="flex justify-between items-baseline mb-5">
                                <span className="text-[11px] uppercase tracking-[0.15em] text-black/50 font-medium">Total</span>
                                <span className="text-xl font-light text-black">{formatCurrency(checkoutTotal)}</span>
                            </div>

                            {/* Pay Button */}
                            <button
                                onClick={handleCheckout}
                                disabled={processing || !selectedAddressId || !selectedRateId || loadingRates || loadingPaymentSettings || !paymentMethod || cartLoading || !!mergeProgress}
                                className="w-full bg-neutral-900 text-white text-[13px] font-semibold py-4 rounded-full hover:bg-neutral-800 transition-colors disabled:opacity-40 active:scale-[0.99]"
                            >
                                {processing ? "Processing…" : loadingPaymentSettings ? "Loading payment options…" : `Pay ${formatCurrency(checkoutTotal)}`}
                            </button>

                            <p className="text-[9px] text-black/20 text-center mt-3">
                                Secure payment by Stripe · SSL encrypted
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
