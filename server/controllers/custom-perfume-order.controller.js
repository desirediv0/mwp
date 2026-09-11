import crypto from "crypto";
import Razorpay from "razorpay";
import { prisma } from "../config/db.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";

// Helper to get active Razorpay instance
async function getRazorpayInstance() {
  const settings = await prisma.paymentGatewaySetting.findFirst({
    where: { gateway: "RAZORPAY", isActive: true }
  });

  const keyId = settings?.keyId || process.env.RAZORPAY_KEY_ID || "rzp_test_dummy";
  const keySecret = settings?.keySecret || process.env.RAZORPAY_KEY_SECRET || "dummy_secret";

  return {
    razorpay: new Razorpay({ key_id: keyId, key_secret: keySecret }),
    keyId,
    keySecret
  };
}

// Generate unique order number (e.g. RHO-BESPOKE-10023)
function generateOrderNumber() {
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `RHO-BESPOKE-${randomDigits}`;
}

// 1. Create Razorpay Order for Custom Perfume
export const createCustomPerfumeRazorpayOrder = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const {
    baseNotes = [],
    heartNotes = [],
    topNotes = [],
    bottleSilhouette = "Classic Heritage",
    monogramEngraving = "",
    amount = 3999,
    shippingName,
    shippingPhone,
    shippingAddress,
    shippingCity,
    shippingState,
    shippingPincode
  } = req.body;

  if (!shippingName || !shippingPhone || !shippingAddress || !shippingPincode) {
    return res.status(400).json({ success: false, message: "Complete shipping address is required" });
  }

  const numericAmount = parseFloat(amount) || 3999;
  const orderNumber = generateOrderNumber();

  // Create Razorpay Order
  const { razorpay, keyId } = await getRazorpayInstance();
  const options = {
    amount: Math.round(numericAmount * 100), // amount in paise
    currency: "INR",
    receipt: orderNumber,
    notes: {
      type: "CUSTOM_PERFUME",
      userId,
      engraving: monogramEngraving || "None"
    }
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Store Custom Order draft in DB
  const customOrder = await prisma.customPerfumeOrder.create({
    data: {
      orderNumber,
      userId,
      baseNotes: Array.isArray(baseNotes) ? baseNotes : [baseNotes],
      heartNotes: Array.isArray(heartNotes) ? heartNotes : [heartNotes],
      topNotes: Array.isArray(topNotes) ? topNotes : [topNotes],
      bottleSilhouette,
      monogramEngraving,
      amount: numericAmount,
      paymentStatus: "PENDING",
      orderStatus: "ORDER_RECEIVED",
      razorpayOrderId: razorpayOrder.id,
      shippingName,
      shippingPhone,
      shippingAddress,
      shippingCity: shippingCity || "",
      shippingState: shippingState || "",
      shippingPincode
    }
  });

  res.json({
    success: true,
    data: {
      orderId: razorpayOrder.id,
      customOrderId: customOrder.id,
      orderNumber,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId
    }
  });
});

// Helper to send order email notifications
async function sendCustomOrderEmails(order, type = "CONFIRMATION", extraData = {}) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "support@mwpsupplements.com";
    const userEmail = order.user?.email || extraData.userEmail;

    const baseList = Array.isArray(order.baseNotes) ? order.baseNotes.join(", ") : order.baseNotes;
    const heartList = Array.isArray(order.heartNotes) ? order.heartNotes.join(", ") : order.heartNotes;
    const topList = Array.isArray(order.topNotes) ? order.topNotes.join(", ") : order.topNotes;

    if (type === "CONFIRMATION") {
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e4d5f8; padding: 24px; border-radius: 12px;">
          <h2 style="color: #4A2478; margin-top: 0;">MWP SUPPLEMENTS Atelier — Custom Perfume Order Confirmed</h2>
          <p>Dear <strong>${order.shippingName}</strong>,</p>
          <p>Thank you for creating your bespoke 100ml perfume formula with MWP SUPPLEMENTS. Your payment has been verified!</p>

          <div style="background: #faf6ff; padding: 16px; border-radius: 8px; margin: 16px 0; border: 1px solid #e8dafa;">
            <p style="margin: 4px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
            <p style="margin: 4px 0;"><strong>Amount Paid:</strong> ₹${Number(order.amount).toLocaleString()}</p>
            <p style="margin: 4px 0;"><strong>Base Notes:</strong> ${baseList}</p>
            <p style="margin: 4px 0;"><strong>Heart Notes:</strong> ${heartList}</p>
            <p style="margin: 4px 0;"><strong>Top Notes:</strong> ${topList}</p>
            <p style="margin: 4px 0;"><strong>Bottle Silhouette:</strong> ${order.bottleSilhouette}</p>
            ${order.monogramEngraving ? `<p style="margin: 4px 0;"><strong>Custom Label:</strong> ${order.monogramEngraving}</p>` : ""}
          </div>

          <p><strong>Shipping Address:</strong><br/>
          ${order.shippingName}<br/>
          ${order.shippingAddress}, ${order.shippingCity}, ${order.shippingState} - ${order.shippingPincode}<br/>
          Phone: ${order.shippingPhone}</p>

          <p style="font-size: 13px; color: #666; margin-top: 24px;">Our master perfumers will now handcraft 3 sample variations based on your selected notes and deliver them to your address.</p>
        </div>
      `;

      if (userEmail) {
        await sendEmail({
          email: userEmail,
          subject: `MWP SUPPLEMENTS Bespoke Order Confirmed #${order.orderNumber}`,
          html: htmlBody
        });
      }

      await sendEmail({
        email: adminEmail,
        subject: `New Custom Perfume Order #${order.orderNumber} - ₹${order.amount}`,
        html: htmlBody
      });
    } else if (type === "CANCELLED") {
      const cancelHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e4d5f8; padding: 24px; border-radius: 12px;">
          <h2 style="color: #c53030; margin-top: 0;">Bespoke Order Cancelled #${order.orderNumber}</h2>
          <p>Order #${order.orderNumber} for <strong>${order.shippingName}</strong> has been cancelled.</p>
          <p><strong>Reason for Cancellation:</strong> ${extraData.reason || "Cancelled by customer"}</p>
        </div>
      `;

      if (userEmail) {
        await sendEmail({
          email: userEmail,
          subject: `Custom Order Cancelled #${order.orderNumber}`,
          html: cancelHtml
        });
      }

      await sendEmail({
        email: adminEmail,
        subject: `Custom Order Cancelled #${order.orderNumber}`,
        html: cancelHtml
      });
    } else if (type === "STATUS_UPDATE") {
      const statusHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e4d5f8; padding: 24px; border-radius: 12px;">
          <h2 style="color: #4A2478; margin-top: 0;">Order Status Update #${order.orderNumber}</h2>
          <p>Dear <strong>${order.shippingName}</strong>,</p>
          <p>Your bespoke custom perfume order status has been updated to: <strong style="color: #4A2478;">${order.orderStatus.replace(/_/g, " ")}</strong></p>
          ${order.trackingNumber ? `<p><strong>Courier Tracking #:</strong> ${order.trackingNumber}</p>` : ""}
        </div>
      `;

      if (userEmail) {
        await sendEmail({
          email: userEmail,
          subject: `Bespoke Order Status Update #${order.orderNumber}`,
          html: statusHtml
        });
      }
    }
  } catch (err) {
    console.error("Custom order email notification error:", err);
  }
}

// 2. Verify Razorpay Payment Signature
export const verifyCustomPerfumePayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customOrderId } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !customOrderId) {
    return res.status(400).json({ success: false, message: "Missing payment verification parameters" });
  }

  const { keySecret } = await getRazorpayInstance();

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    await prisma.customPerfumeOrder.update({
      where: { id: customOrderId },
      data: { paymentStatus: "FAILED" }
    });
    return res.status(400).json({ success: false, message: "Payment verification failed" });
  }

  const updatedOrder = await prisma.customPerfumeOrder.update({
    where: { id: customOrderId },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId: razorpay_payment_id,
      orderStatus: "ORDER_RECEIVED"
    },
    include: {
      user: { select: { email: true, name: true } }
    }
  });

  // Trigger Confirmation Emails
  await sendCustomOrderEmails(updatedOrder, "CONFIRMATION");

  res.json({
    success: true,
    message: "Bespoke perfume order placed & payment verified successfully!",
    data: updatedOrder
  });
});

// 3. Get Authenticated User's Custom Perfume Orders
export const getUserCustomPerfumeOrders = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const orders = await prisma.customPerfumeOrder.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    data: orders
  });
});

// 3b. User Cancel Custom Perfume Order with Reason
export const cancelUserCustomPerfumeOrder = asyncHandler(async (req, res) => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { reason = "No reason provided" } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const order = await prisma.customPerfumeOrder.findUnique({
    where: { id },
    include: { user: { select: { email: true, name: true } } }
  });

  if (!order || order.userId !== userId) {
    return res.status(404).json({ success: false, message: "Custom order not found" });
  }

  if (order.orderStatus === "DELIVERED" || order.orderStatus === "CANCELLED") {
    return res.status(400).json({ success: false, message: `Order cannot be cancelled as it is already ${order.orderStatus}` });
  }

  const updatedOrder = await prisma.customPerfumeOrder.update({
    where: { id },
    data: {
      orderStatus: "CANCELLED",
      cancelReason: reason
    }
  });

  // Trigger Cancelled Emails to User & Admin
  await sendCustomOrderEmails(updatedOrder, "CANCELLED", { reason, userEmail: order.user?.email });

  res.json({
    success: true,
    message: "Order cancelled successfully",
    data: updatedOrder
  });
});

// 4. Admin: Get All Custom Perfume Orders
export const getAdminCustomPerfumeOrders = asyncHandler(async (req, res) => {
  const orders = await prisma.customPerfumeOrder.findMany({
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  res.json({
    success: true,
    data: orders
  });
});

// 5. Admin: Update Custom Order Progress & Tracking
export const updateAdminCustomOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { orderStatus, trackingNumber, notes } = req.body;

  const order = await prisma.customPerfumeOrder.update({
    where: { id },
    data: {
      ...(orderStatus && { orderStatus }),
      ...(trackingNumber !== undefined && { trackingNumber }),
      ...(notes !== undefined && { notes })
    },
    include: {
      user: { select: { email: true, name: true } }
    }
  });

  // Trigger status update email to user
  if (orderStatus || trackingNumber) {
    await sendCustomOrderEmails(order, "STATUS_UPDATE");
  }

  res.json({
    success: true,
    message: "Custom order status updated successfully",
    data: order
  });
});
