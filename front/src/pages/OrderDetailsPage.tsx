import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { orders } from "@/api/adminService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShoppingCart,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  Package,
  CreditCard,
  MapPin,
  Clock,
  User,
  Truck,
  CheckCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, debugData, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/LanguageContext";

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();

  interface OrderDetails {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    subTotal: string | number;
    shippingAmount: number;
    taxAmount: number;
    discount?: string | number;
    codCharge?: string | number;
    createdAt: string;
    updatedAt: string;
    cancelledAt?: string;
    cancelReason?: string;
    cancelledBy?: string;
    userId?: string;
    couponCode?: string;
    shippingAddress: {
      name?: string;
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      phone?: string;
    };
    user: {
      name: string;
      email: string;
      phone?: string;
    };
    items: OrderItem[];
    updates?: OrderUpdate[];
    paymentGateway?: string;
    paymentMode?: string;
    paymentMethod?: string;
    razorpayPayment?: {
      paymentMethod: string;
      status: string;
      razorpayPaymentId?: string;
      razorpayOrderId?: string;
    };
    coupon?: {
      discountType: string;
      discountValue: number;
      description?: string;
    };
    tracking?: {
      carrier?: string;
      trackingNumber?: string;
      status?: string;
      estimatedDelivery?: string;
      updates?: OrderUpdate[];
    };
    shiprocket?: {
      orderId?: number;
      shipmentId?: number;
      awbCode?: string;
      courierName?: string;
      status?: string;
    };
    shippingCost?: string | number;
    total?: string | number;
  }

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  interface OrderItem {
    id: string;
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
    imageUrl?: string;
    product?: {
      title: string;
      name: string;
      images: string[];
      imageUrl?: string;
    };
    variant?: {
      sku: string;
      flavor?: {
        name: string;
      };
      weight?: {
        value: number;
        unit: string;
      };
      images?: Array<{
        url: string;
      }>;
    };
    returnRequest?: {
      id: string;
      status: string;
      reason: string;
      customReason?: string;
      createdAt: string;
      processedAt?: string;
    } | null;
    // Flash sale fields
    flashSaleName?: string;
    flashSaleDiscount?: number;
    originalPrice?: number;
  }

  interface OrderUpdate {
    id: string;
    status: string;
    timestamp: string;
    note?: string;
    location?: string;
    description?: string;
  }

  // Define fetchOrderDetails outside of useEffect so it can be reused
  const fetchOrderDetails = useCallback(async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const response = await orders.getOrderById(id);

      // Use the debug utility
      debugData("Order API Response", response, true);
      debugData("Order Data", response?.data?.data, true);

      if (response?.data?.success && response?.data?.data?.order) {
        // Fix: Access the order data correctly from response.data.data.order
        setOrderDetails(response.data.data.order);
      } else {
        setError(response?.data?.message || t('orders.actions.load_error'));
      }
    } catch (error: unknown) {
      console.error("Error fetching order details:", error);

      // Handle axios error properly
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { status: number; data?: { message?: string } } };
        debugData("Error Response", axiosError.response, true);
        setError(
          `API Error (${axiosError.response.status}): ${axiosError.response.data?.message || "Unknown error"}`
        );
      } else if (error && typeof error === 'object' && 'request' in error) {
        const requestError = error as { request: unknown };
        debugData("Error Request", requestError.request, true);
        setError("Network error: No response received from server");
      } else if (error instanceof Error) {
        setError(`Error: ${error.message}`);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    fetchOrderDetails();
  }, [id, fetchOrderDetails]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return t('orders.details.not_available');
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING": return t('orders.status.pending');
      case "PROCESSING": return t('orders.status.processing');
      case "SHIPPED": return t('orders.status.shipped');
      case "DELIVERED": return t('orders.status.delivered');
      case "CANCELLED": return t('orders.status.cancelled');
      case "REFUNDED": return t('orders.status.refunded');
      case "PAID": return t('orders.status.paid');
      case "RETURN_APPROVED": return t('orders.status.return_approved') || "Return Approved";
      case "RETURN_COMPLETED": return t('orders.status.return_completed') || "Return Completed";
      case "APPROVED": return "Approved";
      case "REJECTED": return "Rejected";
      default: return status;
    }
  };

  // Status timeline component
  const StatusTimeline = ({ currentStatus }: { currentStatus: string }) => {
    const steps = [
      { key: "PENDING", label: t('orders.status.placed'), icon: ShoppingCart },
      { key: "PROCESSING", label: t('orders.status.processing'), icon: Package },
      { key: "SHIPPED", label: t('orders.status.shipped'), icon: Truck },
      { key: "DELIVERED", label: t('orders.status.delivered'), icon: CheckCircle },
    ];

    // Handle cancelled or refunded orders
    if (currentStatus === "CANCELLED" || currentStatus === "REFUNDED") {
      return (
        <div className="flex items-center justify-center py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FEF2F2] text-[#EF4444] rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-[#EF4444]">{getStatusLabel(currentStatus)}</p>
              <p className="text-sm text-[#9CA3AF]">
                {currentStatus === "CANCELLED" ? t('orders.status.cancelled') : t('orders.status.refunded')}
              </p>
            </div>
          </div>
        </div>
      );
    }

    const currentStepIndex = steps.findIndex(step => step.key === currentStatus);

    return (
      <div className="w-full py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const IconComponent = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div className="flex items-center w-full">
                  {index > 0 && (
                    <div className={cn(
                      "flex-1 h-0.5",
                      isCompleted ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'
                    )} />
                  )}

                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mx-2",
                    isCompleted
                      ? 'bg-[#22C55E] text-white'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-[#F3F4F6] text-[#9CA3AF]'
                  )}>
                    <IconComponent className="w-5 h-5" />
                  </div>

                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5",
                      index < currentStepIndex ? 'bg-[#22C55E]' : 'bg-[#E5E7EB]'
                    )} />
                  )}
                </div>

                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-xs font-medium",
                    isCompleted
                      ? 'text-[#22C55E]'
                      : isCurrent
                        ? 'text-[#4CAF50]'
                        : 'text-[#9CA3AF]'
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-[#FFFBEB] text-[#F59E0B] border-[#FEF3C7]";
      case "PROCESSING":
        return "bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]";
      case "SHIPPED":
        return "bg-[#EEF2FF] text-[#6366F1] border-[#E0E7FF]";
      case "DELIVERED":
        return "bg-[#ECFDF5] text-[#22C55E] border-[#D1FAE5]";
      case "CANCELLED":
        return "bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]";
      case "REFUNDED":
        return "bg-[#F3E8FF] text-[#A855F7] border-[#E9D5FF]";
      case "RETURN_APPROVED":
        return "bg-[#FFF7ED] text-[#F97316] border-[#FFEDD5]";
      case "RETURN_COMPLETED":
        return "bg-[#F0FDFA] text-[#14B8A6] border-[#CCFBF1]";
      case "APPROVED":
        return "bg-[#ECFDF5] text-[#22C55E] border-[#D1FAE5]";
      case "REJECTED":
        return "bg-[#FEF2F2] text-[#EF4444] border-[#FEE2E2]";
      default:
        return "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]";
    }
  };

  // Handle order status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!id) return;

    try {
      const response = await orders.updateOrderStatus(id, {
        status: newStatus,
      });

      if (response && response.data && response.data.success) {
        toast.success(t('orders.actions.status_update_success', { status: newStatus }));

        // Update the order status in the UI
        setOrderDetails((prev: OrderDetails | null) => ({
          ...prev!,
          status: newStatus,
        }));
      } else {
        toast.error(response.data?.message || t('orders.actions.status_update_error'));
      }
    } catch (error: unknown) {
      console.error("Error updating order status:", error);
      toast.error(t('orders.actions.status_update_error'));
    }
  };

  interface CourierPartner {
    id: number | string;
    name: string;
    rate: number;
    etd: string;
    estimatedDeliveryDays: number;
    rating: number;
    cod: boolean;
  }

  const [availableCouriers, setAvailableCouriers] = useState<CourierPartner[]>([]);
  const [isFetchingCouriers, setIsFetchingCouriers] = useState(false);

  // Warehouse (pickup location) options for this order
  const [warehouseOptions, setWarehouseOptions] = useState<
    { id: string; nickname: string; city?: string; state?: string; pincode?: string; isDefault?: boolean }[]
  >([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [suggestedWarehouseId, setSuggestedWarehouseId] = useState<string>("");

  // Handle manual sync to Shiprocket (with optional specific courierId)
  const handleSyncToShiprocket = async (courierId?: number | string) => {
    if (!id) return;

    try {
      setIsSyncing(true);
      const payload: { courierId?: number | string; warehouseId?: string } = {};
      if (courierId) payload.courierId = courierId;
      if (selectedWarehouseId) payload.warehouseId = selectedWarehouseId;
      const response = await orders.syncToShiprocket(
        id,
        Object.keys(payload).length ? payload : undefined
      );

      if (response && response.data && response.data.success) {
        toast.success("Order synced to Shiprocket successfully!");
        // Refresh order details to show updated Shiprocket data
        await fetchOrderDetails();
      } else {
        toast.error(response.data?.message || "Failed to sync to Shiprocket");
      }
    } catch (error: unknown) {
      console.error("Error syncing to Shiprocket:", error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response: { data?: { message?: string } } };
        toast.error(axiosError.response?.data?.message || "Failed to sync to Shiprocket");
      } else {
        toast.error("Failed to sync to Shiprocket");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Load warehouse options + the auto-suggested one for this order
  useEffect(() => {
    if (!id) return;
    if (orderDetails?.shiprocket?.orderId) return; // already synced
    let cancelled = false;
    orders
      .getOrderWarehouseOptions(id)
      .then((res) => {
        if (cancelled || !res.data?.success) return;
        const d = res.data.data || {};
        const list = d.warehouses || [];
        setWarehouseOptions(list);
        const suggested =
          d.suggestedWarehouseId ||
          list.find((w: { isDefault?: boolean }) => w.isDefault)?.id ||
          list[0]?.id ||
          "";
        setSuggestedWarehouseId(d.suggestedWarehouseId || "");
        setSelectedWarehouseId((prev) => prev || suggested);
      })
      .catch(() => {
        /* warehouse picker is optional; ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [id, orderDetails?.shiprocket?.orderId]);

  // Fetch available courier delivery partners (rates, time) for this order
  const handleFetchCouriers = async () => {
    if (!id || orderDetails?.shiprocket?.orderId || orderDetails?.status === "CANCELLED") return;
    setIsFetchingCouriers(true);
    try {
      const response = await orders.getCouriersForOrder(id);
      if (response.data?.success) {
        const list = response.data.data?.couriers || [];
        setAvailableCouriers(list);
        if (list.length === 0) {
          toast.info("No courier partners available for this address/weight");
        } else {
          toast.success(`Fetched ${list.length} delivery partners!`);
        }
      }
    } catch (error: any) {
      console.error("Error fetching couriers:", error);
      toast.error(error.response?.data?.message || "Failed to fetch courier partners");
    } finally {
      setIsFetchingCouriers(false);
    }
  };

  // Get image URL helper
  const getImageUrl = (image: string | string[] | undefined | null): string => {
    if (!image) return "/images/product-placeholder.jpg";

    // Handle array of images (take first one)
    if (Array.isArray(image)) {
      if (image.length === 0) return "/images/product-placeholder.jpg";
      const firstImage = image[0];
      if (typeof firstImage === "string") {
        return firstImage.startsWith("http")
          ? firstImage
          : `https://desirediv-storage.blr1.digitaloceanspaces.com/${firstImage}`;
      }
      return "/images/product-placeholder.jpg";
    }

    // Handle single image string
    if (typeof image === "string") {
      return image.startsWith("http")
        ? image
        : `https://desirediv-storage.blr1.digitaloceanspaces.com/${image}`;
    }

    return "/images/product-placeholder.jpg";
  };

  // Loading state
  if (isLoading && !orderDetails) {
    return (
      <div className="flex h-full w-full items-center justify-center py-20">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#4CAF50]" />
          <p className="mt-4 text-base text-[#9CA3AF]">
            {t('partners_tab.common.loading').replace('Partners', 'Order details').replace('partners', 'order details').replace('Partner', 'Order').replace('partner', 'order')}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !orderDetails) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center py-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FEF2F2] mb-4">
          <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
        </div>
        <h2 className="text-xl font-semibold text-[#1F2937] mb-1.5">{t('reviews.messages.error_title')}</h2>
        <p className="text-center text-[#9CA3AF] mb-6">{error}</p>
        <Button
          variant="outline"
          className="border-[#4CAF50] text-[#2E7D32] hover:bg-[#E8F5E9]"
          onClick={() => {
            setError(null);
            setIsLoading(true);
            fetchOrderDetails();
          }}
        >
          {t('reviews.messages.try_again')}
        </Button>
      </div>
    );
  }

  // No order or empty order data, but not in error state
  if (
    !isLoading &&
    !error &&
    (!orderDetails || Object.keys(orderDetails).length === 0)
  ) {
    return (
      <div className="space-y-6">
        <Button variant="outline" size="sm" asChild className="mb-2">
          <Link to="/orders">
            <ChevronLeft className="mr-1 h-4 w-4" />
            {t('orders.details.back_to_list')}
          </Link>
        </Button>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {t('orders.details.not_found')}
            </h2>
            <p className="text-center text-muted-foreground mb-4">
              {t('orders.details.not_found_desc')}
            </p>
            <Button
              onClick={() => {
                setIsLoading(true);
                fetchOrderDetails();
              }}
            >
              {t('reviews.messages.try_again')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fix access to order items (may need to adjust based on actual API response structure)
  // Early return if orderDetails is null
  if (!orderDetails) {
    return (
      <div className="flex h-full w-full items-center justify-center py-10">
        <div className="flex flex-col items-center">
          <>
            <AlertTriangle className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">{t('orders.details.not_found')}</h2>
            <p className="text-center text-muted-foreground">
              {t('orders.details.not_found_desc')}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              asChild
            >
              <Link to="/orders">{t('orders.details.back_to_list')}</Link>
            </Button>
          </>
        </div>
      </div>
    );
  }

  const orderItems = orderDetails.items || [];

  return (
    <div className="space-y-8">
      {/* Premium Page Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mb-3 border-[#E5E7EB] hover:bg-[#F3F7F6]"
            >
              <Link to="/orders">
                <ChevronLeft className="mr-1 h-4 w-4" />
                {t('orders.details.back_to_list')}
              </Link>
            </Button>
            <h1 className="text-3xl font-semibold text-[#1F2937] tracking-tight">
              {t('orders.details.title', { number: orderDetails.orderNumber })}
            </h1>
            <p className="text-[#9CA3AF] text-sm mt-1.5">
              {t('orders.details.placed_on', { date: formatDate(orderDetails.createdAt) })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge
              className={cn(
                "text-xs font-medium border px-3 py-1",
                getStatusBadgeClass(orderDetails.status)
              )}
            >
              {getStatusLabel(orderDetails.status)}
            </Badge>

            {/* Status update buttons */}
            {orderDetails.status !== "DELIVERED" &&
              orderDetails.status !== "CANCELLED" &&
              orderDetails.status !== "REFUNDED" && (
                <div className="flex flex-wrap gap-2">
                  {orderDetails.status === "PENDING" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#E5E7EB] hover:bg-[#F3F7F6]"
                      onClick={() => handleStatusUpdate("PROCESSING")}
                    >
                      {t('orders.actions.mark_processing')}
                    </Button>
                  )}

                  {(orderDetails.status === "PROCESSING" ||
                    orderDetails.status === "PAID") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E5E7EB] hover:bg-[#F3F7F6]"
                        onClick={() => handleStatusUpdate("SHIPPED")}
                      >
                        {t('orders.actions.mark_shipped')}
                      </Button>
                    )}

                  {orderDetails.status === "SHIPPED" && (
                    <Button
                      size="sm"
                      className=""
                      onClick={() => handleStatusUpdate("DELIVERED")}
                    >
                      {t('orders.actions.mark_delivered')}
                    </Button>
                  )}

                  {(orderDetails.status === "PENDING" ||
                    orderDetails.status === "PROCESSING") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-[#E5E7EB] hover:bg-[#F3F7F6]"
                        onClick={() => handleStatusUpdate("PAID")}
                      >
                        {t('orders.actions.mark_paid')}
                      </Button>
                    )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                    onClick={() => handleStatusUpdate("CANCELLED")}
                  >
                    {t('orders.actions.cancel')}
                  </Button>
                </div>
              )}
          </div>
        </div>
        <div className="h-px bg-[#E5E7EB]" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Order Status Timeline */}
        <div className="lg:col-span-3">
          <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                <Truck className="mr-2 h-5 w-5 text-[#4CAF50]" />
                {t('orders.details.status_timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <StatusTimeline currentStatus={orderDetails.status} />
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                <Package className="mr-2 h-5 w-5 text-[#4CAF50]" />
                {t('orders.details.items')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="divide-y divide-[#E5E7EB]">
                {orderItems.map((item: OrderItem) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] overflow-hidden flex-shrink-0">
                      <img
                        src={getImageUrl(
                          item.imageUrl ||
                          item.product?.imageUrl ||
                          (Array.isArray(item.product?.images) ? item.product.images[0] : null) ||
                          (item.variant?.images?.[0]?.url) ||
                          null
                        )}
                        alt={item.product?.name || "Product"}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.src =
                            "/images/product-placeholder.jpg";
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[#1F2937] mb-1">
                        {item.product?.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mb-2">
                        {t('orders.details.sku')}: {item.variant?.sku || t('orders.details.not_available')}
                      </p>
                      {item.variant?.flavor && (
                        <div className="text-sm text-[#4B5563]">
                          <span className="text-[#9CA3AF]">{t('orders.details.flavor')}: </span>
                          {item.variant.flavor.name}
                          {item.variant.weight && (
                            <>
                              <span className="text-[#9CA3AF] ml-2">{t('orders.details.weight')}: </span>
                              {`${item.variant.weight.value}${item.variant.weight.unit}`}
                            </>
                          )}
                        </div>
                      )}

                      {/* Flash Sale Badge */}
                      {item.flashSaleName && (
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className="bg-orange-50 text-orange-600 border-orange-200 text-[10px] px-2 py-0 h-5 font-normal">
                            ⚡ {item.flashSaleName}
                          </Badge>
                          <span className="text-xs text-orange-600 font-medium">-{item.flashSaleDiscount}% OFF</span>
                        </div>
                      )}
                      {/* Return Request Badge */}
                      {item.returnRequest && (
                        <div className="mt-2">
                          <Badge
                            className={cn(
                              "text-xs font-medium border",
                              getStatusBadgeClass(item.returnRequest.status)
                            )}
                          >
                            Return: {getStatusLabel(item.returnRequest.status)}
                          </Badge>
                          <p className="text-xs text-[#9CA3AF] mt-1">
                            Reason: {item.returnRequest.reason}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm text-[#9CA3AF] mb-1">{t('orders.details.price')}</p>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <p className="text-xs text-[#9CA3AF] line-through">
                          {formatCurrency(item.originalPrice)}
                        </p>
                      )}
                      <p className="font-semibold text-[#1F2937] mb-3">
                        {formatCurrency(item.price)}
                      </p>
                      <p className="text-sm text-[#9CA3AF] mb-1">{t('orders.details.qty')}</p>
                      <p className="font-semibold text-[#1F2937] mb-3">
                        {item.quantity}
                      </p>
                      <p className="text-sm text-[#9CA3AF] mb-1">{t('orders.details.total')}</p>
                      <p className="  text-lg text-[#1F2937]">
                        {formatCurrency(item.subtotal)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                <User className="mr-2 h-5 w-5 text-[#4CAF50]" />
                {t('orders.details.customer_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">{t('return_requests.common.name')}</p>
                  <p className="font-medium text-[#1F2937]">
                    {orderDetails.user?.name || "Guest"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">{t('return_requests.common.email')}</p>
                  <p className="font-medium text-[#1F2937]">
                    {orderDetails.user?.email || t('orders.details.not_available')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">{t('partners_tab.common.number')}</p>
                  <p className="font-medium text-[#1F2937]">
                    {orderDetails.user?.phone || t('orders.details.not_available')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Information (if order is cancelled) */}
          {orderDetails.status === "CANCELLED" && (
            <Card className="bg-[#FEF2F2] border-2 border-[#FEE2E2] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-lg font-semibold text-[#EF4444] flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  {t('orders.details.cancellation_info')}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{t('orders.details.cancelled_at')}</p>
                    <p className="font-medium text-[#1F2937]">
                      {orderDetails.cancelledAt && formatDate(orderDetails.cancelledAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{t('orders.details.reason')}</p>
                    <p className="font-medium text-[#1F2937]">
                      {orderDetails.cancelReason || t('orders.details.no_reason')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{t('orders.details.cancelled_by')}</p>
                    <p className="font-medium text-[#1F2937]">
                      {orderDetails.cancelledBy === orderDetails.userId
                        ? t('orders.details.by_customer')
                        : t('orders.details.by_admin')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                <CreditCard className="mr-2 h-5 w-5 text-[#4CAF50]" />
                {t('orders.details.payment_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">{t('orders.details.method')}</p>
                  <p className="font-medium text-[#1F2937]">
                    {orderDetails.paymentMethod || orderDetails.razorpayPayment?.paymentMethod || "ONLINE"}
                  </p>
                </div>
                {orderDetails.paymentGateway && (
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{t('orders.details.gateway')}</p>
                    <p className="font-medium text-[#1F2937]">
                      {orderDetails.paymentGateway}
                      {orderDetails.paymentMode && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({orderDetails.paymentMode})
                        </span>
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-[#9CA3AF] mb-1">{t('partners_tab.common.status')}</p>
                  <Badge
                    className={cn(
                      "text-xs font-medium border",
                      orderDetails.razorpayPayment?.status === "CAPTURED" ||
                        orderDetails.razorpayPayment?.status === "PAID" ||
                        orderDetails.status === "PAID"
                        ? "bg-[#ECFDF5] text-[#22C55E] border-[#D1FAE5]"
                        : "bg-[#FFFBEB] text-[#F59E0B] border-[#FEF3C7]"
                    )}
                  >
                    {orderDetails.razorpayPayment?.status || getStatusLabel(orderDetails.status) || t('orders.details.not_available')}
                  </Badge>
                </div>
                {orderDetails.razorpayPayment?.razorpayPaymentId && (
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{t('orders.details.transaction_id')}</p>
                    <p className="font-mono text-xs text-[#1F2937] bg-[#F3F4F6] px-2 py-1 rounded border border-[#E5E7EB]">
                      {orderDetails.razorpayPayment.razorpayPaymentId}
                    </p>
                  </div>
                )}
                {orderDetails.razorpayPayment?.razorpayOrderId && (
                  <div>
                    <p className="text-xs text-[#9CA3AF] mb-1">{t('orders.details.order_id')}</p>
                    <p className="font-mono text-xs text-[#1F2937] bg-[#F3F4F6] px-2 py-1 rounded border border-[#E5E7EB]">
                      {orderDetails.razorpayPayment.razorpayOrderId}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                <MapPin className="mr-2 h-5 w-5 text-[#4CAF50]" />
                {t('orders.details.shipping_address')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              {orderDetails.shippingAddress ? (
                <div className="space-y-2">
                  <p className="font-semibold text-[#1F2937]">
                    {orderDetails.shippingAddress.name}
                  </p>
                  <p className="text-[#4B5563]">{orderDetails.shippingAddress.street}</p>
                  <p className="text-[#4B5563]">
                    {orderDetails.shippingAddress.city},{" "}
                    {orderDetails.shippingAddress.state}{" "}
                    {orderDetails.shippingAddress.postalCode}
                  </p>
                  <p className="text-[#4B5563]">{orderDetails.shippingAddress.country}</p>
                  <p className="text-sm text-[#9CA3AF]">
                    Phone: {orderDetails.shippingAddress.phone || t('orders.details.not_available')}
                  </p>
                </div>
              ) : (
                <p className="text-[#9CA3AF]">No shipping address found</p>
              )}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5 text-[#4CAF50]" />
                {t('orders.details.total')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5563]">{t('orders.details.subtotal')}:</span>
                  <span className="font-medium text-[#1F2937]">
                    {formatCurrency(orderDetails.subTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5563]">{t('orders.details.tax')} (0%):</span>
                  <span className="font-medium text-[#1F2937]">
                    {formatCurrency(0)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#4B5563]">{t('orders.details.shipping')}:</span>
                  <span className="font-medium text-[#1F2937]">
                    {formatCurrency(
                      typeof orderDetails.shippingCost === 'string'
                        ? parseFloat(orderDetails.shippingCost)
                        : (orderDetails.shippingCost || 0)
                    )}
                  </span>
                </div>
                {(typeof orderDetails.codCharge === 'string' ? parseFloat(orderDetails.codCharge) : (orderDetails.codCharge || 0)) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4B5563]">COD Surcharge:</span>
                    <span className="font-medium text-[#1F2937]">
                      {formatCurrency(
                        typeof orderDetails.codCharge === 'string'
                          ? parseFloat(orderDetails.codCharge)
                          : (orderDetails.codCharge || 0)
                      )}
                    </span>
                  </div>
                )}
                {(typeof orderDetails.discount === 'string' ? parseFloat(orderDetails.discount) : (orderDetails.discount || 0)) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#22C55E]">Discount:</span>
                    <span className="font-medium text-[#22C55E]">
                      -{formatCurrency(
                        typeof orderDetails.discount === 'string'
                          ? parseFloat(orderDetails.discount)
                          : (orderDetails.discount || 0)
                      )}
                    </span>
                  </div>
                )}
                {orderDetails.couponCode && (
                  <div className="mt-2 p-3 bg-[#ECFDF5] border border-[#D1FAE5] rounded-lg">
                    <div className="flex items-center text-[#22C55E] font-medium mb-1 text-sm">
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Coupon applied: {orderDetails.couponCode}
                    </div>
                    {orderDetails.coupon && (
                      <div className="text-sm text-[#22C55E]">
                        {orderDetails.coupon.discountType === "PERCENTAGE" ? (
                          <span>
                            {orderDetails.coupon.discountValue}% off the order total
                          </span>
                        ) : (
                          <span>
                            {formatCurrency(orderDetails.coupon.discountValue)} off the order total
                          </span>
                        )}
                        {orderDetails.coupon.description && (
                          <p className="text-xs mt-1 text-[#9CA3AF]">
                            {orderDetails.coupon.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="flex justify-between border-t border-[#E5E7EB] pt-3   text-lg">
                  <span className="text-[#1F2937]">{t('orders.details.grand_total')}:</span>
                  <span className="text-[#1F2937]">
                    {formatCurrency(
                      orderDetails.total ||
                      ((typeof orderDetails.subTotal === 'string' ? parseFloat(orderDetails.subTotal) : orderDetails.subTotal) +
                        (typeof orderDetails.shippingCost === 'string' ? parseFloat(orderDetails.shippingCost) : (orderDetails.shippingCost || 0)) +
                        (typeof orderDetails.codCharge === 'string' ? parseFloat(orderDetails.codCharge) : (orderDetails.codCharge || 0)) -
                        (typeof orderDetails.discount === 'string' ? parseFloat(orderDetails.discount) : (orderDetails.discount || 0)))
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tracking Info */}
          {orderDetails.status === "SHIPPED" ||
            orderDetails.status === "DELIVERED" ? (
            <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-lg font-semibold text-[#1F2937] flex items-center">
                  <Truck className="mr-2 h-5 w-5 text-[#4CAF50]" />
                  Tracking Information
                </CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {orderDetails.tracking ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-1">Carrier</p>
                      <p className="font-medium text-[#1F2937]">
                        {orderDetails.tracking.carrier || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-1">Tracking Number</p>
                      <p className="font-mono text-sm text-[#1F2937] bg-[#F3F4F6] px-2 py-1 rounded border border-[#E5E7EB]">
                        {orderDetails.tracking.trackingNumber || t('orders.details.not_available')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-1">{t('partners_tab.common.status')}</p>
                      <Badge
                        className={cn(
                          "text-xs font-medium border",
                          getStatusBadgeClass(
                            orderDetails.tracking?.status || orderDetails.status
                          )
                        )}
                      >
                        {getStatusLabel(orderDetails.tracking?.status || orderDetails.status)}
                      </Badge>
                    </div>
                    {orderDetails.tracking.estimatedDelivery && (
                      <div>
                        <p className="text-xs text-[#9CA3AF] mb-1">Estimated Delivery</p>
                        <p className="font-medium text-[#1F2937]">
                          {formatDate(orderDetails.tracking.estimatedDelivery)}
                        </p>
                      </div>
                    )}

                    {/* Tracking Updates */}
                    {orderDetails.tracking.updates &&
                      orderDetails.tracking.updates.length > 0 && (
                        <div className="mt-6">
                          <h4 className="mb-3 font-semibold text-[#1F2937]">Tracking Updates</h4>
                          <div className="space-y-3">
                            {orderDetails.tracking.updates.map(
                              (update: OrderUpdate, index: number) => (
                                <div
                                  key={index}
                                  className="rounded-lg border border-[#E5E7EB] bg-[#F3F7F6] p-3"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-[#9CA3AF]" />
                                    <span className="text-sm text-[#9CA3AF]">
                                      {formatDate(update.timestamp)}
                                    </span>
                                  </div>
                                  <p className="font-medium text-[#1F2937] mb-1">
                                    {update.status}
                                  </p>
                                  {update.location && (
                                    <p className="text-sm text-[#4B5563]">
                                      {update.location}
                                    </p>
                                  )}
                                  {update.description && (
                                    <p className="text-sm text-[#4B5563] mt-1">
                                      {update.description}
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#F3F4F6] mb-4">
                      <Truck className="h-8 w-8 text-[#9CA3AF]" />
                    </div>
                    <p className="font-semibold text-[#1F2937] mb-1.5">Shipping in progress</p>
                    <p className="text-sm text-[#9CA3AF] mb-4 max-w-sm mx-auto">
                      {orderDetails.status === "DELIVERED"
                        ? "This order has been marked as delivered, but no detailed tracking information is available."
                        : "This order has been shipped, but detailed tracking information is not yet available."}
                    </p>
                    <Badge
                      className={cn(
                        "text-xs font-medium border",
                        getStatusBadgeClass(orderDetails.status)
                      )}
                    >
                      {getStatusLabel(orderDetails.status)}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Shiprocket Information */}
          {orderDetails.shiprocket && (
            <Card className="bg-[#FFFFFF] border-[#E5E7EB] shadow-[0_1px_2px_rgba(0,0,0,0.04)] rounded-xl">
              <CardHeader className="px-6 pt-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ECFDF5] border border-[#D1FAE5]">
                      <Truck className="h-5 w-5 text-[#22C55E]" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-[#1F2937]">
                        Shiprocket Shipment
                      </CardTitle>
                      <p className="text-sm text-[#9CA3AF]">Courier management & live tracking</p>
                    </div>
                  </div>                  <div className="flex items-center gap-2">
                    {orderDetails.shiprocket.orderId && (
                      <Badge className={cn(
                        "text-xs border",
                        (orderDetails.shiprocket.status === "CANCELLED" || orderDetails.status === "CANCELLED")
                          ? "bg-gray-100 text-gray-500 border-gray-200"
                          : "bg-[#ECFDF5] text-[#22C55E] border-[#D1FAE5]"
                      )}>
                        ✓ Synced to Shiprocket
                      </Badge>
                    )}
                    {orderDetails.shiprocket.status && (
                      <Badge className={cn(
                        "text-xs font-medium border",
                        orderDetails.shiprocket.status === "CANCELLED"
                          ? "bg-red-50 text-red-600 border-red-200"
                          : orderDetails.shiprocket.status === "PICKUP_SCHEDULED"
                          ? "bg-[#FEF3C7] text-[#D97706] border-[#FCD34D]"
                          : orderDetails.shiprocket.status === "AWB_ASSIGNED"
                          ? "bg-[#EFF6FF] text-[#3B82F6] border-[#DBEAFE]"
                          : "bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]"
                      )}>
                        {orderDetails.shiprocket.status.replace(/_/g, " ")}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {orderDetails.shiprocket.orderId ? (
                  <div className="space-y-4">
                    {/* AWB Code with Track Live */}
                    {orderDetails.shiprocket.awbCode && (
                      <div className={cn(
                        "p-4 border rounded-xl",
                        (orderDetails.shiprocket.status === "CANCELLED" || orderDetails.status === "CANCELLED")
                          ? "bg-gray-50 border-gray-200"
                          : "bg-[#ECFDF5] border-[#D1FAE5]"
                      )}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={cn(
                              "text-xs font-medium mb-1",
                              (orderDetails.shiprocket.status === "CANCELLED" || orderDetails.status === "CANCELLED")
                                ? "text-gray-500"
                                : "text-[#22C55E]"
                            )}>
                              AWB / TRACKING NUMBER {(orderDetails.shiprocket.status === "CANCELLED" || orderDetails.status === "CANCELLED") && "(CANCELLED)"}
                            </p>
                            <p className="font-mono text-xl font-bold text-[#1F2937]">
                              {orderDetails.shiprocket.awbCode}
                            </p>
                          </div>
                          {orderDetails.shiprocket.status !== "CANCELLED" && orderDetails.status !== "CANCELLED" && (
                            <a
                              href={`https://shiprocket.co/tracking/${orderDetails.shiprocket.awbCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#22C55E] text-white rounded-lg hover:bg-[#16A34A] transition-colors"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Track Live
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-3 gap-4">
                      {orderDetails.shiprocket.courierName && (
                        <div className="p-3 bg-[#F9FAFB] rounded-lg">
                          <p className="text-xs text-[#9CA3AF] mb-1">COURIER</p>
                          <p className="font-medium text-[#1F2937]">{orderDetails.shiprocket.courierName}</p>
                        </div>
                      )}
                      {orderDetails.shiprocket.orderId && (
                        <div className="p-3 bg-[#F9FAFB] rounded-lg">
                          <p className="text-xs text-[#9CA3AF] mb-1">SR ORDER ID</p>
                          <p className="font-mono text-sm font-medium text-[#1F2937]">{orderDetails.shiprocket.orderId}</p>
                        </div>
                      )}
                      {orderDetails.shiprocket.shipmentId && (
                        <div className="p-3 bg-[#F9FAFB] rounded-lg">
                          <p className="text-xs text-[#9CA3AF] mb-1">SHIPMENT ID</p>
                          <p className="font-mono text-sm font-medium text-[#1F2937]">{orderDetails.shiprocket.shipmentId}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {orderDetails.shiprocket.status !== "CANCELLED" && orderDetails.status !== "CANCELLED" ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await orders.getShippingLabel(id!);
                                if (response.data.success && response.data.data.label?.label_url) {
                                  window.open(response.data.data.label.label_url, '_blank');
                                } else {
                                  toast.error("Failed to generate label");
                                }
                              } catch (error) {
                                toast.error("Failed to download label");
                              }
                            }}
                            className="border-[#E5E7EB] hover:bg-[#F3F7F6]"
                          >
                            Download Label
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const response = await orders.getOrderInvoice(id!);
                                if (response.data.success && response.data.data.invoice?.invoice_url) {
                                  window.open(response.data.data.invoice.invoice_url, '_blank');
                                } else {
                                  toast.error("Failed to generate invoice");
                                }
                              } catch (error) {
                                toast.error("Failed to download invoice");
                              }
                            }}
                            className="border-[#E5E7EB] hover:bg-[#F3F7F6]"
                          >
                            Print Invoice
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!confirm("Are you sure you want to cancel this shipment?")) return;
                              try {
                                const response = await orders.cancelShiprocketShipment(id!);
                                if (response.data.success) {
                                  toast.success("Shipment cancelled successfully");
                                  await fetchOrderDetails();
                                } else {
                                  toast.error(response.data?.message || "Failed to cancel shipment");
                                }
                              } catch (error) {
                                toast.error("Failed to cancel shipment");
                              }
                            }}
                            className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                          >
                            Cancel Shipment
                          </Button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" disabled className="bg-red-50 text-red-600 border-red-200 cursor-not-allowed">
                            Shipment Cancelled
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Info Note */}
                    {orderDetails.shiprocket.status === "CANCELLED" || orderDetails.status === "CANCELLED" ? (
                      <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700 font-medium">
                          This shipment has been cancelled. Pickup and dispatch are stopped.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 p-3 bg-[#EFF6FF] border border-[#DBEAFE] rounded-lg">
                        <CheckCircle className="h-4 w-4 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-[#1E40AF]">
                          Shipment booked in Shiprocket. AWB assigned. Click "Track Live" for live location updates.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-4 space-y-4">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-50 mb-3 border border-emerald-100">
                        <Truck className="h-7 w-7 text-emerald-600" />
                      </div>
                      <p className="font-semibold text-[#1F2937] text-base mb-1">Not Synced to Shiprocket Yet</p>
                      <p className="text-sm text-[#6B7280] mb-4 max-w-md mx-auto">
                        In Manual Mode, you can fetch available courier partners to compare rates &amp; estimated delivery time, or auto-assign the best courier directly.
                      </p>

                      {warehouseOptions.length > 1 && (
                        <div className="max-w-sm mx-auto mb-4 text-left">
                          <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                            Ship from warehouse
                          </label>
                          <select
                            value={selectedWarehouseId}
                            onChange={(e) => setSelectedWarehouseId(e.target.value)}
                            className="w-full border border-[#D1D5DB] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]/30"
                          >
                            {warehouseOptions.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.nickname}
                                {w.city ? ` — ${w.city}` : ""}
                                {w.pincode ? ` (${w.pincode})` : ""}
                                {w.id === suggestedWarehouseId ? "  · nearest" : ""}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-[#9CA3AF] mt-1">
                            {suggestedWarehouseId
                              ? "Pre-selected the warehouse nearest the delivery pincode. Change it if needed."
                              : "Pick which warehouse this order ships from."}
                          </p>
                        </div>
                      )}

                      <div className="flex flex-wrap justify-center gap-3">
                        <Button
                          onClick={handleFetchCouriers}
                          disabled={isFetchingCouriers || isSyncing}
                          variant="outline"
                          className="border-[#3B82F6] text-[#3B82F6] hover:bg-[#EFF6FF]"
                        >
                          {isFetchingCouriers ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Fetching Rates &amp; Couriers...
                            </>
                          ) : (
                            <>
                              <Truck className="mr-2 h-4 w-4" />
                              View Delivery Partners (Rates &amp; Speed)
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => handleSyncToShiprocket()}
                          disabled={isSyncing}
                          className="bg-[#22C55E] hover:bg-[#16A34A] text-white"
                        >
                          {isSyncing ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Auto-Assign Best Courier
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {availableCouriers.length > 0 && (
                      <div className="mt-4 border rounded-xl p-4 bg-gray-50/60 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-emerald-600" />
                            Available Courier Partners ({availableCouriers.length})
                          </h4>
                          <span className="text-xs text-gray-500">Sorted by lowest rate</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                          {availableCouriers.map((courier) => (
                            <div key={courier.id} className="p-3 bg-white border border-gray-200 rounded-lg hover:border-emerald-500 flex items-center justify-between transition-colors shadow-sm">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{courier.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  ⚡ Delivery: <span className="font-medium text-gray-700">{courier.etd || `${courier.estimatedDeliveryDays} Days`}</span>
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">₹{courier.rate}</span>
                                  {courier.rating > 0 && <span className="text-xs text-amber-600 font-medium">★ {courier.rating}</span>}
                                  {courier.cod && <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">COD Available</span>}
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSyncToShiprocket(courier.id)}
                                disabled={isSyncing}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3"
                              >
                                {isSyncing ? "Booking..." : "Book Shipment"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
