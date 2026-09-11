/**
 * Shiprocket Admin Controller
 * Handles admin operations for Shiprocket integration
 */

import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import sendEmail from "../utils/sendEmail.js";
import { getOrderCancelledTemplate } from "../email/temp/EmailTemplate.js";
import {
    authenticate,
    getShiprocketSettings,
    checkServiceability,
    processOrderForShipping,
    trackShipment,
    trackByOrderId,
    cancelShiprocketOrder,
    generateLabel,
    printInvoice,
    getPickupLocations,
    addPickupLocation,
    pickWarehouseForOrder,
} from "../utils/shiprocket.js";

// Get Shiprocket settings
export const getSettings = asyncHandler(async (req, res) => {
    const settings = await getShiprocketSettings();

    // Mask password for security
    const maskedSettings = {
        ...settings,
        password: settings.password ? "********" : null,
        token: settings.token ? "********" : null,
    };

    res.status(200).json(
        new ApiResponsive(200, { settings: maskedSettings }, "Settings fetched successfully")
    );
});

// Update Shiprocket settings
export const updateSettings = asyncHandler(async (req, res) => {
    const {
        isEnabled,
        email,
        password,
        bookingMode,
        defaultLength,
        defaultBreadth,
        defaultHeight,
        defaultWeight,
        shippingCharge,
        freeShippingThreshold,
    } = req.body;

    const settings = await getShiprocketSettings();

    const updateData = {};

    if (typeof isEnabled === "boolean") {
        updateData.isEnabled = isEnabled;
    }

    if (email !== undefined) {
        updateData.email = email.trim();
    }

    if (password && password !== "********") {
        // Encrypt password before storing
        updateData.password = "enc:" + encrypt(password.trim());
        // Clear token to force re-authentication
        updateData.token = null;
        updateData.tokenExpiry = null;
    }

    if (bookingMode !== undefined && (bookingMode === "AUTO" || bookingMode === "MANUAL")) {
        updateData.bookingMode = bookingMode;
        if (bookingMode === "AUTO") {
            updateData.isEnabled = true;
        }
    }

    if (defaultLength !== undefined) {
        updateData.defaultLength = parseFloat(defaultLength);
    }
    if (defaultBreadth !== undefined) {
        updateData.defaultBreadth = parseFloat(defaultBreadth);
    }
    if (defaultHeight !== undefined) {
        updateData.defaultHeight = parseFloat(defaultHeight);
    }
    if (defaultWeight !== undefined) {
        updateData.defaultWeight = parseFloat(defaultWeight);
    }

    if (shippingCharge !== undefined) {
        updateData.shippingCharge = parseFloat(shippingCharge);
    }

    if (freeShippingThreshold !== undefined) {
        updateData.freeShippingThreshold = parseFloat(freeShippingThreshold);
    }

    updateData.updatedBy = req.admin?.id;

    const updatedSettings = await prisma.shiprocketSettings.update({
        where: { id: settings.id },
        data: updateData,
    });

    // Mask sensitive data
    const maskedSettings = {
        ...updatedSettings,
        password: updatedSettings.password ? "********" : null,
        token: updatedSettings.token ? "********" : null,
    };

    res.status(200).json(
        new ApiResponsive(200, { settings: maskedSettings }, "Settings updated successfully")
    );
});

// Test Shiprocket connection
export const testConnection = asyncHandler(async (req, res) => {
    try {
        const token = await authenticate();

        if (token) {
            res.status(200).json(
                new ApiResponsive(200, { connected: true }, "Connection successful")
            );
        } else {
            throw new Error("Failed to get authentication token");
        }
    } catch (error) {
        throw new ApiError(400, `Connection failed: ${error.message}`);
    }
});

// Get all pickup addresses
export const getPickupAddresses = asyncHandler(async (req, res) => {
    const addresses = await prisma.shiprocketPickupAddress.findMany({
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });

    res.status(200).json(
        new ApiResponsive(200, { addresses }, "Pickup addresses fetched successfully")
    );
});

// Create pickup address
export const createPickupAddress = asyncHandler(async (req, res) => {
    const {
        nickname,
        name,
        email,
        phone,
        address,
        address2,
        city,
        state,
        country,
        pincode,
        isDefault,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !address || !city || !state || !pincode) {
        throw new ApiError(400, "All required fields must be provided");
    }

    // If setting as default, unset other defaults
    if (isDefault) {
        await prisma.shiprocketPickupAddress.updateMany({
            where: { isDefault: true },
            data: { isDefault: false },
        });
    }

    const pickupAddress = await prisma.shiprocketPickupAddress.create({
        data: {
            nickname: nickname || "Warehouse",
            name,
            email,
            phone,
            address,
            address2: address2 || null,
            city,
            state,
            country: country || "India",
            pincode,
            isDefault: isDefault ?? true,
        },
    });

    res.status(201).json(
        new ApiResponsive(201, { address: pickupAddress }, "Pickup address created successfully")
    );
});

// Update pickup address
export const updatePickupAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const existing = await prisma.shiprocketPickupAddress.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new ApiError(404, "Pickup address not found");
    }

    // If setting as default, unset other defaults
    if (updateData.isDefault) {
        await prisma.shiprocketPickupAddress.updateMany({
            where: { isDefault: true, id: { not: id } },
            data: { isDefault: false },
        });
    }

    const updated = await prisma.shiprocketPickupAddress.update({
        where: { id },
        data: updateData,
    });

    res.status(200).json(
        new ApiResponsive(200, { address: updated }, "Pickup address updated successfully")
    );
});

// Delete pickup address
export const deletePickupAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.shiprocketPickupAddress.findUnique({
        where: { id },
    });

    if (!existing) {
        throw new ApiError(404, "Pickup address not found");
    }

    await prisma.shiprocketPickupAddress.delete({
        where: { id },
    });

    res.status(200).json(
        new ApiResponsive(200, null, "Pickup address deleted successfully")
    );
});

// Check serviceability for an order
export const checkOrderServiceability = asyncHandler(async (req, res) => {
    const { pickupPincode, deliveryPincode, weight, cod } = req.body;

    if (!pickupPincode || !deliveryPincode || !weight) {
        throw new ApiError(400, "Pickup pincode, delivery pincode, and weight are required");
    }

    const result = await checkServiceability({
        pickupPincode,
        deliveryPincode,
        weight: parseFloat(weight),
        cod: cod || false,
    });

    res.status(200).json(
        new ApiResponsive(200, { serviceability: result }, "Serviceability checked successfully")
    );
});


// Sync order to Shiprocket (supports manual sync & courier selection)
export const syncOrderToShiprocket = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { courierId, warehouseId } = req.body || {};

    const order = await prisma.order.findUnique({
        where: { id: orderId },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.shiprocketOrderId) {
        throw new ApiError(400, "Order already synced to Shiprocket");
    }

    const result = await processOrderForShipping(
        orderId,
        courierId || null,
        true,
        warehouseId || null
    );

    if (!result) {
        throw new ApiError(400, "Shiprocket is disabled or configuration is missing");
    }

    // Fetch updated order
    const updatedOrder = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            shiprocketOrderId: true,
            shiprocketShipmentId: true,
            awbCode: true,
            courierName: true,
            shiprocketStatus: true,
            warehouseId: true,
            warehouseNickname: true,
            warehouseAssignedBy: true,
        },
    });

    res.status(200).json(
        new ApiResponsive(200, { order: updatedOrder, shiprocketResponse: result }, "Order synced to Shiprocket successfully")
    );
});

// Which warehouse would be used for this order (auto-pick preview) + full list
export const getOrderWarehouseOptions = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { shippingAddress: true },
    });
    if (!order) throw new ApiError(404, "Order not found");

    const warehouses = await prisma.shiprocketPickupAddress.findMany({
        orderBy: [{ isDefault: "desc" }, { nickname: "asc" }],
    });

    let suggested = null;
    if (warehouses.length > 0) {
        try {
            const { warehouse } = await pickWarehouseForOrder(order, null);
            suggested = warehouse?.id || null;
        } catch {
            suggested = null;
        }
    }

    res.status(200).json(
        new ApiResponsive(
            200,
            {
                warehouses: warehouses.map((w) => ({
                    id: w.id,
                    nickname: w.nickname,
                    city: w.city,
                    state: w.state,
                    pincode: w.pincode || w.pinCode,
                    isDefault: w.isDefault,
                })),
                suggestedWarehouseId: suggested,
                currentWarehouseId: order.warehouseId || null,
                currentWarehouseNickname: order.warehouseNickname || null,
                assignedBy: order.warehouseAssignedBy || null,
            },
            "Warehouse options fetched"
        )
    );
});

// Fetch available courier delivery partners for a specific order
export const getCouriersForOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            shippingAddress: true,
            items: {
                include: { variant: true }
            }
        }
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    // If order already has AWB or is cancelled, return empty to prevent duplicate fetching
    if (order.shiprocketOrderId || order.status === "CANCELLED") {
        return res.status(200).json(
            new ApiResponsive(200, { couriers: [], alreadySynced: true }, "Order is already processed or cancelled")
        );
    }

    const settings = await getShiprocketSettings();
    const pickupAddress = await prisma.shiprocketPickupAddress.findFirst({
        where: { isDefault: true }
    }) || await prisma.shiprocketPickupAddress.findFirst();

    if (!pickupAddress || !order.shippingAddress?.postalCode) {
        throw new ApiError(400, "Pickup address or shipping pincode missing");
    }

    let totalWeight = 0;
    for (const item of order.items) {
        totalWeight += (item.variant?.shippingWeight || settings.defaultWeight || 0.5) * item.quantity;
    }

    try {
        const result = await checkServiceability({
            pickupPincode: pickupAddress.pinCode,
            deliveryPincode: order.shippingAddress.postalCode,
            weight: totalWeight,
            cod: order.paymentMethod === "CASH"
        });

        const availableCompanies = result?.data?.available_courier_companies || [];
        const couriers = availableCompanies.map((c) => ({
            id: c.courier_company_id,
            name: c.courier_name,
            rate: c.rate,
            etd: c.etd,
            estimatedDeliveryDays: c.estimated_delivery_days,
            rating: c.rating,
            cod: c.cod === 1
        })).sort((a, b) => a.rate - b.rate);

        return res.status(200).json(
            new ApiResponsive(200, { couriers, count: couriers.length }, "Available courier partners fetched successfully")
        );
    } catch (error) {
        console.error("Error checking couriers:", error);
        throw new ApiError(500, `Failed to fetch courier partners: ${error.message}`);
    }
});

// Get tracking info for an order
export const getOrderTracking = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            awbCode: true,
            shiprocketOrderId: true,
        },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    let trackingData = null;

    if (order.awbCode) {
        trackingData = await trackShipment(order.awbCode);
    } else if (order.shiprocketOrderId) {
        trackingData = await trackByOrderId(order.shiprocketOrderId);
    } else {
        throw new ApiError(400, "Order not yet synced to Shiprocket");
    }

    res.status(200).json(
        new ApiResponsive(200, { tracking: trackingData }, "Tracking info fetched successfully")
    );
});

// Cancel Shiprocket shipment & send email notification to customer
export const cancelShipment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            user: true,
            items: {
                include: { product: true }
            }
        }
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    let result = null;
    if (order.shiprocketOrderId) {
        try {
            result = await cancelShiprocketOrder(order.shiprocketOrderId);
        } catch (err) {
            console.warn("Shiprocket cancellation warning:", err);
        }
    }

    // Update order status in database to CANCELLED
    const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
            shiprocketStatus: "CANCELLED",
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelledBy: req.user?.id || "ADMIN",
            cancelReason: req.body?.reason || "Cancelled by admin"
        },
    });

    // Send cancellation email to customer
    if (order.user?.email) {
        try {
            await sendEmail({
                email: order.user.email,
                subject: `Your Order #${order.orderNumber} has been Cancelled — MWP SUPPLEMENTS`,
                html: getOrderCancelledTemplate({
                    userName: order.user.name || "Customer",
                    orderNumber: order.orderNumber,
                    reason: req.body?.reason || "Cancelled by admin",
                    refundAmount: order.paymentMethod !== "CASH" ? parseFloat(order.total || 0) : null,
                }),
            });
            console.log(`Cancellation email sent to ${order.user.email} for order #${order.orderNumber}`);
        } catch (emailErr) {
            console.error("Error sending order cancellation email:", emailErr);
        }
    }

    res.status(200).json(
        new ApiResponsive(200, { result, order: updatedOrder }, "Order and shipment cancelled successfully and email sent to customer")
    );
});

// Get shipping label for order
export const getShippingLabel = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            shiprocketShipmentId: true,
        },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.shiprocketShipmentId) {
        throw new ApiError(400, "Order not synced to Shiprocket");
    }

    const result = await generateLabel(order.shiprocketShipmentId);

    res.status(200).json(
        new ApiResponsive(200, { label: result }, "Shipping label generated successfully")
    );
});

// Get invoice for order
export const getOrderInvoice = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
            shiprocketOrderId: true,
        },
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (!order.shiprocketOrderId) {
        throw new ApiError(400, "Order not synced to Shiprocket");
    }

    const result = await printInvoice(order.shiprocketOrderId);

    res.status(200).json(
        new ApiResponsive(200, { invoice: result }, "Invoice generated successfully")
    );
});

// Webhook handler for Shiprocket tracking updates
export const handleWebhook = asyncHandler(async (req, res) => {
    const {
        awb,
        current_status,
        current_status_id,
        order_id,
        sr_order_id,
        courier_name,
        etd,
        scans,
    } = req.body;

    console.log("Shiprocket webhook received:", {
        awb,
        current_status,
        order_id,
    });

    // Find order by AWB code or Shiprocket order ID
    let order = null;

    if (awb) {
        order = await prisma.order.findFirst({
            where: { awbCode: awb },
        });
    }

    if (!order && sr_order_id) {
        order = await prisma.order.findFirst({
            where: { shiprocketOrderId: sr_order_id },
        });
    }

    if (!order && order_id) {
        // order_id from webhook is in format "orderNumber_shiprocketId"
        const orderNumber = order_id.split("_")[0];
        order = await prisma.order.findUnique({
            where: { orderNumber },
        });
    }

    if (!order) {
        console.log("Order not found for webhook:", { awb, order_id, sr_order_id });
        // Return success anyway to prevent retries
        return res.status(200).json({ status: "ok" });
    }

    // Update order with tracking status
    const updateData = {
        shiprocketStatus: current_status,
    };

    if (courier_name) {
        updateData.courierName = courier_name;
    }

    // Map Shiprocket status to our order status
    const statusMapping = {
        PICKED_UP: "SHIPPED",
        SHIPPED: "SHIPPED",
        IN_TRANSIT: "SHIPPED",
        OUT_FOR_DELIVERY: "SHIPPED",
        DELIVERED: "DELIVERED",
        CANCELLED: "CANCELLED",
        RTO_INITIATED: "CANCELLED",
        RTO_DELIVERED: "CANCELLED",
    };

    if (statusMapping[current_status]) {
        updateData.status = statusMapping[current_status];
    }

    await prisma.order.update({
        where: { id: order.id },
        data: updateData,
    });

    // Also update tracking table if exists
    if (order.tracking) {
        const latestScan = scans && scans.length > 0 ? scans[scans.length - 1] : null;

        await prisma.tracking.update({
            where: { orderId: order.id },
            data: {
                status: current_status === "DELIVERED" ? "DELIVERED" : "IN_TRANSIT",
                ...(current_status === "DELIVERED" && { deliveredAt: new Date() }),
            },
        });

        // Add tracking update if we have scan data
        if (latestScan) {
            await prisma.trackingUpdate.create({
                data: {
                    trackingId: order.tracking.id,
                    status: current_status,
                    location: latestScan.location || "",
                    description: latestScan.activity || current_status,
                },
            });
        }
    }

    res.status(200).json({ status: "ok" });
});
