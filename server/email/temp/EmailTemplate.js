import { getStoreConfig } from "../../utils/storeConfig.js";

/* ─── Shared styles ──────────────────────────────────────────────────── */
/* ─── Shared styles ──────────────────────────────────────────────────── */
const BASE_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111111; background-color: #0d0d11; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.3); border: 1px solid #27272a; }
  .header { background: linear-gradient(135deg, #09090b, #18181b); color: #ffffff; text-align: center; padding: 40px 30px; border-bottom: 3px solid #ef4444; }
  .header.danger-header { background: linear-gradient(135deg, #7f1d1d, #991b1b); border-bottom: 3px solid #ef4444; }
  .header-accent { display: inline-block; background: rgba(239,68,68,0.15); color: #f87171; font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; padding: 5px 14px; border-radius: 4px; margin-bottom: 14px; border: 1px solid rgba(239,68,68,0.3); }
  .content { padding: 36px 32px; background-color: #ffffff; }
  h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.02em; color: #ffffff; text-transform: uppercase; }
  h2 { color: #111111; font-size: 20px; margin-top: 0; font-weight: 700; letter-spacing: -0.01em; }
  p { margin-bottom: 18px; font-size: 14px; color: #3f3f46; line-height: 1.7; }
  .button-container { text-align: center; margin: 28px 0; }
  .button { display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #dc2626, #991b1b); color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 4px 14px rgba(220,38,38,0.3); }
  .info-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 22px 0; }
  .info-box h3 { margin-top: 0; color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  .feature-item { margin-bottom: 8px; padding-left: 22px; position: relative; color: #334155; font-weight: 500; font-size: 13px; }
  .feature-item:before { content: '✓'; position: absolute; left: 0; color: #ef4444; font-weight: bold; font-size: 12px; }
  .footer { text-align: center; padding: 28px 24px; font-size: 12px; color: #71717a; background: #f4f4f5; border-top: 1px solid #e4e4e7; }
  .footer a { color: #ef4444; text-decoration: none; font-weight: 600; }
  .wa-cta { display: inline-block; margin-top: 10px; padding: 8px 18px; background: #09090b; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; border: 1px solid #3f3f46; }
`;

const HEADER_HTML = (title, accent, store, isDanger = false) => `
  <div class="header ${isDanger ? 'danger-header' : ''}">
    <div style="margin-bottom: 14px;">
      <h2 style="color: #ffffff; font-size: 26px; font-weight: 900; letter-spacing: 0.15em; text-transform: uppercase; margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">MWP</h2>
      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.25em; color: #cbd5e1; display: block; margin-top: 4px; font-weight: 600;">MEN | WOMEN | POWER &bull; SUPPLEMENTS</span>
    </div>
    ${accent ? `<div class="header-accent">${accent}</div>` : ""}
    <h1>${title}</h1>
  </div>
`;

const FOOTER_HTML = (store) => `
  <div class="footer">
    <strong style="color: #18181b; font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase;">MWP SUPPLEMENTS &bull; MEN | WOMEN | POWER</strong><br>
    <a href="mailto:${store.storeEmail || 'support@mwpsupplements.com'}">${store.storeEmail || 'support@mwpsupplements.com'}</a> &nbsp;·&nbsp; ${store.storePhone || '+91 76783 36268'}<br>
    <a href="https://wa.me/${store.socialWhatsapp || '917678336268'}" class="wa-cta">Support via WhatsApp</a><br><br>
    <span style="font-size: 11px; color: #a1a1aa;">© ${new Date().getFullYear()} MWP SUPPLEMENTS. All rights reserved. Clean formulations &bull; Lab tested.</span>
  </div>
`;

/* ─── Verification Email ─────────────────────────────────────────────── */
export const getVerificationTemplate = (verificationLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - MWP SUPPLEMENTS</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML(`Welcome to MWP SUPPLEMENTS`, "MEN | WOMEN | POWER", store)}
        <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Welcome Athlete,</p>
            <p>Thank you for creating an account with <strong>MWP SUPPLEMENTS</strong> — engineered for peak physical performance, strength, endurance, and wellness.</p>
            <p>Please verify your email address to activate your account and start your performance regimen:</p>
            <div class="button-container">
                <a href="${verificationLink}" class="button">Verify My Email</a>
            </div>
            <p style="font-size: 13px; color: #888888;">If the button doesn't work, copy this link: ${verificationLink}</p>
            <div class="info-box">
                <h3>The MWP Supplements Standard:</h3>
                <div class="feature-item">Clinically Dosed Active Ingredients & Standardized Extracts</div>
                <div class="feature-item">100% Transparent Formulations & Zero Proprietary Blends</div>
                <div class="feature-item">GMP Certified & FSSAI Compliant Manufacturing</div>
                <div class="feature-item">Express Pan-India Shipping & Fresh Batch Guarantee</div>
                <div class="feature-item">100% Encrypted & Secure Checkout</div>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── OTP Email ──────────────────────────────────────────────────────── */
export const getEmailOtpTemplate = (otp, expiresInMinutes = 10, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your OTP - MWP SUPPLEMENTS</title>
    <style>
        ${BASE_STYLES}
        .otp { font-size: 38px; letter-spacing: 12px; font-weight: 900; color: #ffffff; background: #09090b; padding: 18px 24px; border-radius: 8px; display: inline-block; margin: 18px 0; border: 1px solid #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Authentication Code", "Security Access", store)}
        <div class="content" style="text-align: center;">
            <p>Use the confidential code below to authenticate your account at <strong>MWP SUPPLEMENTS</strong>:</p>
            <div class="otp">${otp}</div>
            <p style="font-size: 14px; color: #dc2626; font-weight: 600;">This security code expires in ${expiresInMinutes} minutes.</p>
            <p style="font-size: 13px; color: #888888;">If you did not request this code, please ignore this notification.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Account Deletion ───────────────────────────────────────────────── */
export const getDeleteTemplate = (deletionLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Account Deletion - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .danger-btn { background: #dc2626; }
    </style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Account Deletion Request", "Account Security", store, true)}
        <div class="content">
            <p>Hi,</p>
            <p>We received a request to permanently delete your <strong>${store.storeName}</strong> account. This action will remove all your order history and personal data.</p>
            <p>If you wish to proceed, click the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${deletionLink}" style="display:inline-block;padding:15px 35px;background:#dc2626;color:#fff!important;text-decoration:none;border-radius:12px;font-weight:700;">Confirm Account Deletion</a>
            </div>
            <p style="color: #ef4444; font-size: 14px;"><strong>Warning:</strong> This action cannot be undone.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Reset Password ─────────────────────────────────────────────────── */
export const getResetTemplate = (resetLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Reset Your Password", "Account Security", store)}
        <div class="content" style="text-align: center;">
            <p>Forgot your password? Click the button below to set a new one for your <strong>${store.storeName}</strong> account:</p>
            <div class="button-container">
                <a href="${resetLink}" class="button">Reset My Password</a>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">Link expires in 15 minutes. If you didn't request this, please ignore this email.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Partner Reset Password ─────────────────────────────────────────── */
export const getPartnerResetTemplate = (resetLink, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Partner Password - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .security-note { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 14px 18px; border-radius: 10px; margin-top: 20px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Reset Partner Password", "Partner Portal", store)}
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Dear Partner,</p>
            <p>We received a request to reset the password for your <strong>${store.storeName}</strong> Partner account. Click below to create a new password:</p>
            <div class="button-container">
                <a href="${resetLink}" class="button">Reset Partner Password</a>
            </div>
            <p style="font-size: 13px; color: #9ca3af;">If you can't click the button, paste this link in your browser: <br><strong>${resetLink}</strong></p>
            <div class="security-note">
                <strong>Security Note:</strong> This link expires in 1 hour. If you didn't request this reset, contact our support team immediately.
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Order Confirmation ─────────────────────────────────────────────── */
export const getOrderConfirmationTemplate = (data, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    const hasDiscount = data.discount && parseFloat(data.discount) > 0;
    const hasCoupon = data.couponCode && data.couponCode.trim() !== "";
    const hasTracking = data.awbCode && data.awbCode.trim() !== "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-table th { background: #003E29; color: #fff; padding: 12px 10px; text-align: left; font-size: 13px; }
        .order-table td { padding: 12px 10px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
        .product-name { font-weight: 600; color: #002216; }
        .product-variant { font-size: 12px; color: #666; margin-top: 4px; }
        .original-price { text-decoration: line-through; color: #999; font-size: 12px; }
        .sale-price { color: #003E29; font-weight: 600; }
        .summary-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #E5E7EB; }
        .summary-row:last-child { border-bottom: none; }
        .total-row { font-size: 18px; font-weight: bold; padding-top: 14px; margin-top: 8px; border-top: 2px solid #002216; }
        .total-row .summary-value { color: #D4AF37; }
        .discount-row { color: #D4AF37; }
        .savings-box { background: rgba(212,175,55,0.08); border: 1px solid rgba(212,175,55,0.3); border-radius: 10px; padding: 14px; margin: 14px 0; text-align: center; }
        .savings-text { color: #003E29; font-weight: 600; font-size: 15px; }
        .coupon-badge { display: inline-block; background: rgba(0,62,41,0.08); color: #003E29; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-left: 8px; }
        .detail-label { font-weight: bold; display: inline-block; width: 150px; }
        .tracking-box { background: linear-gradient(135deg, #003E29, #005a3c); color: #ffffff; border-radius: 14px; padding: 24px; margin: 24px 0; text-align: center; }
        .tracking-box h3 { color: #D4AF37; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 10px 0; }
        .tracking-box .awb-code { font-size: 28px; font-weight: 900; letter-spacing: 0.1em; font-family: 'Courier New', monospace; margin: 10px 0; }
        .tracking-box .courier-name { font-size: 14px; color: #9ca3af; margin-bottom: 16px; }
        .tracking-btn { display: inline-block; padding: 12px 30px; background: #D4AF37; color: #000000 !important; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Thank You For Your Order!", "Order Confirmed", store)}
        <div class="content">
            <h2>Order Summary</h2>
            <p>Dear ${data.userName},</p>
            <p>We've received your order and our team is now processing it. Here's a summary:</p>

            <div class="info-box">
                <div style="margin-bottom:8px;"><span class="detail-label">Order Number:</span> <strong>${data.orderNumber}</strong></div>
                <div style="margin-bottom:8px;"><span class="detail-label">Order Date:</span> ${new Date(data.orderDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</div>
                <div style="margin-bottom:8px;"><span class="detail-label">Payment Method:</span> ${data.paymentMethod}</div>
                ${hasCoupon ? `<div><span class="detail-label">Coupon Applied:</span> <span class="coupon-badge">🎉 ${data.couponCode}</span></div>` : ""}
            </div>

            ${hasTracking ? `
            <div class="tracking-box">
                <h3>📦 Your Shipment is On Its Way!</h3>
                <div class="awb-code">${data.awbCode}</div>
                <div class="courier-name">${data.courierName || "Shiprocket"}</div>
                <a href="https://shiprocket.co/tracking/${data.awbCode}" class="tracking-btn">Track Your Order</a>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 12px;">Click above to track your shipment in real-time</p>
            </div>
            ` : ""}

            <table class="order-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item) => `
                    <tr>
                        <td>
                            <div class="product-name">${item.name}</div>
                            ${item.variant ? `<div class="product-variant">${item.variant}</div>` : ""}
                        </td>
                        <td style="text-align:center;">${item.quantity}</td>
                        <td style="text-align:right;">
                            ${item.originalPrice && parseFloat(item.originalPrice) > parseFloat(item.price)
                                ? `<div class="original-price">₹${parseFloat(item.originalPrice).toFixed(2)}</div>` : ""}
                            <div class="sale-price">₹${parseFloat(item.price).toFixed(2)}</div>
                        </td>
                    </tr>`).join("")}
                </tbody>
            </table>

            <div class="info-box">
                <div class="summary-row"><span style="color:#666;">Subtotal</span><span>₹${parseFloat(data.subtotal).toFixed(2)}</span></div>
                ${hasDiscount ? `<div class="summary-row discount-row"><span>Discount ${hasCoupon ? `(${data.couponCode})` : ""}</span><span>-₹${parseFloat(data.discount).toFixed(2)}</span></div>` : ""}
                <div class="summary-row"><span style="color:#666;">Shipping</span><span>${parseFloat(data.shipping) > 0 ? `₹${parseFloat(data.shipping).toFixed(2)}` : "FREE"}</span></div>
                <div class="summary-row"><span style="color:#666;">Tax</span><span>₹${parseFloat(data.tax).toFixed(2)}</span></div>
                ${parseFloat(data.codCharge) > 0 ? `<div class="summary-row"><span style="color:#666;">COD Surcharge</span><span>₹${parseFloat(data.codCharge).toFixed(2)}</span></div>` : ""}
                <div class="summary-row total-row"><span>Total</span><span class="summary-value">₹${parseFloat(data.total).toFixed(2)}</span></div>
            </div>

            ${hasDiscount ? `<div class="savings-box"><span class="savings-text">🎉 You saved ₹${parseFloat(data.discount).toFixed(2)} on this order!</span></div>` : ""}

            <div class="info-box">
                <h3>Shipping Address</h3>
                <p style="margin-bottom:0;">
                    <strong>${data.shippingAddress.name}</strong><br>
                    ${data.shippingAddress.street}<br>
                    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                    ${data.shippingAddress.country}
                    ${data.shippingAddress.phone ? `<br>📞 ${data.shippingAddress.phone}` : ""}
                </p>
            </div>

            <p>Track your order status in your account dashboard:</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account/orders" class="button">Track Your Order</a>
            </div>
            <p style="font-size:12px;color:#999;">If you can't click the button: ${process.env.FRONTEND_URL}/account/orders</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Payment Receipt ────────────────────────────────────────────────── */
export const getFeeReceiptTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payment Receipt - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Payment Receipt", "Payment Confirmed", store)}
        <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your payment has been received successfully.</p>
            <div class="info-box">
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E5E7EB;"><strong>Amount:</strong> <span>₹${data.amount}</span></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #E5E7EB;"><strong>Transaction ID:</strong> <span>${data.paymentId}</span></div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;"><strong>Date:</strong> <span>${new Date(data.date).toLocaleDateString()}</span></div>
            </div>
            <p>Your order is now being processed. We'll notify you once it's dispatched!</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Order Notification ─────────────────────────────────────────────── */
export const getFeeNotificationTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Update - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Order Notification", "Order Update", store)}
        <div class="content">
            <h2>${data.title}</h2>
            <p>${data.description || `You have a new update regarding your recent order at ${store.storeName}.`}</p>
            <div class="info-box">
                <p><strong>Amount:</strong> ₹${data.amount}</p>
                <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
            </div>
            <p>Please check your dashboard for more details.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Payment Success ────────────────────────────────────────────────── */
export const getPaymentSuccessTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Successful - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Order Confirmed!", "Payment Successful", store)}
        <div class="content">
            <p>Hi ${data.userName},</p>
            <p>Your order has been confirmed and payment processed successfully.</p>
            <div class="info-box">
                <p><strong>Amount:</strong> ₹${data.amount}</p>
                <p><strong>Order ID:</strong> ${data.paymentId}</p>
                <p><strong>Date:</strong> ${new Date(data.date).toLocaleString()}</p>
            </div>
            <p>Thank you for choosing <strong>${store.storeName}</strong> for your performance nutrition and supplement needs!</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Payment Failure ────────────────────────────────────────────────── */
export const getPaymentFailureTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Payment Failed - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Payment Failed", "Transaction Issue", store, true)}
        <div class="content">
            <p>Unfortunately your payment could not be processed.</p>
            <div class="info-box">
                <p><strong>Order:</strong> ${data.feeTitle}</p>
                <p><strong>Error:</strong> ${data.error || "Transaction could not be completed"}</p>
            </div>
            <p>Possible reasons: insufficient funds, bank server issues, network connectivity, or transaction timeout.</p>
            <p>Please try again or contact your bank. You can also reach us on WhatsApp for assistance.</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account/orders" class="button">Try Again</a>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Fee Update ─────────────────────────────────────────────────────── */
export const getFeeUpdateTemplate = ({ name, feeTitle, oldAmount, newAmount, oldDate, newDate, reason }) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Order Update - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Fee Update Notification", "Order Update", store)}
        <div class="content">
            <p>Dear ${name},</p>
            <p>There has been an update to your order fee: <strong>${feeTitle}</strong></p>
            <div class="info-box">
                <h3>Update Details</h3>
                <p><strong>Amount:</strong> ₹${oldAmount} → ₹${newAmount}</p>
                <p><strong>Due Date:</strong> ${oldDate} → ${newDate}</p>
                <p><strong>Reason:</strong> ${reason}</p>
            </div>
            <p>If you have any questions, please contact our support team via WhatsApp.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Contact Form ───────────────────────────────────────────────────── */
export const getContactFormTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>New Inquiry - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("New Contact Inquiry", "Customer Inquiry", store)}
        <div class="content">
            <h2>${data.subject || "Product & Supplement Inquiry"}</h2>
            <div class="info-box">
                <p>${data.message}</p>
            </div>
            <div class="info-box">
                <h3>Contact Details</h3>
                <p><strong>Name:</strong> ${data.name}</p>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Phone:</strong> ${data.phone || "Not provided"}</p>
            </div>
            <p>Please respond to this inquiry at your earliest convenience.</p>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Certificate Generated (kept for compatibility) ─────────────────── */
export const getCertificateGeneratedTemplate = (data) => {
    const store = getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Notification - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Account Update", "Notification", store)}
        <div class="content">
            <p>Dear ${data.userName},</p>
            <p>You have a new update on your ${store.storeName} account.</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account" class="button">View Account</a>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Secret Collection Access Email ─────────────────────────────────── */
export const getSecretAccessEmailTemplate = (data, storeConfig = null) => {
  const store = storeConfig || getStoreConfig();
  const { customerName, displayCode, activationUrl, orderNumber, expiryDate } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Secret Collection Access</title>
  <style>
    ${BASE_STYLES}
    .secret-hero {
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
      color: #ffffff;
      text-align: center;
      padding: 50px 40px;
      position: relative;
      overflow: hidden;
    }
    .secret-hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%);
    }
    .secret-hero h1 {
      color: #ffffff;
      font-size: 28px;
      margin-bottom: 8px;
      position: relative;
    }
    .gold-accent {
      color: #D4AF37;
      font-weight: 900;
    }
    .secret-badge {
      display: inline-block;
      background: linear-gradient(135deg, #D4AF37, #B8860B);
      color: #000000;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      padding: 8px 20px;
      border-radius: 30px;
      margin-bottom: 20px;
      position: relative;
    }
    .code-display {
      background: #0a0a0a;
      border: 2px solid #D4AF37;
      border-radius: 16px;
      padding: 24px 32px;
      text-align: center;
      margin: 30px 0;
      position: relative;
    }
    .code-label {
      color: #9ca3af;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
    }
    .code-value {
      color: #D4AF37;
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 0.1em;
      font-family: 'Courier New', monospace;
    }
    .activate-btn {
      display: inline-block;
      padding: 18px 50px;
      background: linear-gradient(135deg, #D4AF37, #B8860B);
      color: #000000 !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 900;
      font-size: 16px;
      letter-spacing: 0.05em;
      box-shadow: 0 8px 30px rgba(212,175,55,0.4);
      text-transform: uppercase;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #E5E7EB;
      font-size: 14px;
    }
    .detail-label { color: #6b7280; }
    .detail-value { color: #111827; font-weight: 600; }
    .notice-box {
      background: rgba(212,175,55,0.06);
      border: 1px solid rgba(212,175,55,0.2);
      border-radius: 12px;
      padding: 20px;
      margin: 24px 0;
    }
    .notice-box h4 {
      color: #B8860B;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 0;
    }
    .notice-box p {
      color: #6b7280;
      font-size: 13px;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="container" style="border: none; box-shadow: 0 20px 60px rgba(0,0,0,0.15);">
    <div class="secret-hero">
      <div style="margin-bottom: 20px; position: relative;">
        <img src="${store.websiteUrl}/logo.png" alt="${store.storeName}" style="max-height: 50px; width: auto; display: inline-block; filter: brightness(1.2);" />
      </div>
      <div class="secret-badge">Exclusive Invitation</div>
      <h1>The <span class="gold-accent">Secret Collection</span> Awaits</h1>
      <p style="color: #9ca3af; font-size: 15px; margin-top: 8px; position: relative;">An exclusive selection, reserved for our most distinguished clients</p>
    </div>

    <div class="content">
      <p style="font-size: 16px; color: #374151;">Dear <strong>${customerName}</strong>,</p>
      <p>Congratulations. Your recent order has unlocked access to the <strong>MWP VIP Elite Performance Stack</strong> — exclusive limited-run formulations and high-potency stacks available by invitation only.</p>

      <div class="code-display">
        <div class="code-label">Your VIP Access Pass</div>
        <div class="code-value">${displayCode}</div>
      </div>

      <div class="button-container">
        <a href="${activationUrl}" class="activate-btn">Activate VIP Access</a>
      </div>

      <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
        <div class="detail-row">
          <span class="detail-label">Order Number</span>
          <span class="detail-value">#${orderNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Access Code</span>
          <span class="detail-value" style="font-family: monospace; color: #D4AF37;">${displayCode}</span>
        </div>
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">Valid Until</span>
          <span class="detail-value">${expiryDate}</span>
        </div>
      </div>

      <div class="notice-box">
        <h4>Important</h4>
        <p>This invitation is linked directly to your MWP athlete account and cannot be transferred.</p>
        <p>Click the button above to activate your access. You must be logged into your MWP account.</p>
      </div>
    </div>

    <div class="footer" style="background: #0a0a0a; color: #6b7280; border-top: 1px solid #222;">
      <div style="margin-bottom: 12px;">
        <img src="${store.websiteUrl}/logo.png" alt="${store.storeName}" style="max-height: 30px; opacity: 0.6;" />
      </div>
      © ${new Date().getFullYear()} ${store.storeName} | ${store.storeTagline}<br>
      <a href="mailto:${store.storeEmail}" style="color: #D4AF37;">${store.storeEmail}</a> &nbsp;·&nbsp; ${store.storePhone}<br>
      <a href="https://wa.me/${store.socialWhatsapp}" class="wa-cta" style="background: #D4AF37; color: #000;">Message us on WhatsApp</a><br><br>
      This is a confidential invitation. Please do not share.
    </div>
  </div>
</body>
</html>`;
};

/* ─── Admin New Order Notification ───────────────────────────────────── */
export const getAdminNewOrderTemplate = (data, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Received - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-table th { background: #1e40af; color: #fff; padding: 12px 10px; text-align: left; font-size: 13px; }
        .order-table td { padding: 12px 10px; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
        .alert-badge { display: inline-block; background: #dc2626; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    </style>
</head>
<body>
    <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #1e40af, #1e3a8a);">
            <div style="margin-bottom: 18px;">
                <img src="${store.websiteUrl}/logo.png" alt="${store.storeName}" style="max-height: 55px; width: auto; display: inline-block;" />
            </div>
            <div class="header-accent" style="background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.2);">🔔 New Order Alert</div>
            <h1>New Order Received!</h1>
        </div>
        <div class="content">
            <div style="text-align: center; margin-bottom: 20px;">
                <span class="alert-badge">ACTION REQUIRED</span>
            </div>

            <div class="info-box">
                <h3 style="color: #1e40af;">Order Details</h3>
                <div style="margin-bottom:8px;"><strong>Order Number:</strong> #${data.orderNumber}</div>
                <div style="margin-bottom:8px;"><strong>Customer:</strong> ${data.customerName}</div>
                <div style="margin-bottom:8px;"><strong>Email:</strong> ${data.customerEmail}</div>
                ${data.customerPhone ? `<div style="margin-bottom:8px;"><strong>Phone:</strong> ${data.customerPhone}</div>` : ""}
                <div style="margin-bottom:8px;"><strong>Order Date:</strong> ${new Date(data.orderDate).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                <div style="margin-bottom:8px;"><strong>Payment Method:</strong> ${data.paymentMethod}</div>
                <div><strong>Total Amount:</strong> <span style="color: #D4AF37; font-size: 18px; font-weight: bold;">₹${parseFloat(data.total).toFixed(2)}</span></div>
            </div>

            <table class="order-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style="text-align:center;">Qty</th>
                        <th style="text-align:right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item) => `
                    <tr>
                        <td>
                            <div style="font-weight: 600;">${item.name}</div>
                            ${item.variant ? `<div style="font-size: 12px; color: #666;">${item.variant}</div>` : ""}
                        </td>
                        <td style="text-align:center;">${item.quantity}</td>
                        <td style="text-align:right; font-weight: 600;">₹${parseFloat(item.price).toFixed(2)}</td>
                    </tr>`).join("")}
                </tbody>
            </table>

            <div class="info-box">
                <h3 style="color: #1e40af;">Shipping Address</h3>
                <p style="margin-bottom:0;">
                    <strong>${data.shippingAddress.name}</strong><br>
                    ${data.shippingAddress.street}<br>
                    ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                    ${data.shippingAddress.country}
                    ${data.shippingAddress.phone ? `<br>📞 ${data.shippingAddress.phone}` : ""}
                </p>
            </div>

            <div class="button-container">
                <a href="${process.env.ADMIN_URL || process.env.FRONTEND_URL}/orders" class="button" style="background: linear-gradient(135deg, #1e40af, #1e3a8a);">View Order in Dashboard</a>
            </div>
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} ${store.storeName} | Admin Notification<br>
            <a href="mailto:${store.storeEmail}">${store.storeEmail}</a><br><br>
            This is an automated admin notification.
        </div>
    </div>
</body>
</html>`;
};

/* ─── Order Cancelled Email (User) ──────────────────────────────────── */
export const getOrderCancelledTemplate = (data, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Cancelled - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .cancel-icon { font-size: 60px; margin-bottom: 20px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Order Cancelled", "Cancellation", store, true)}
        <div class="content" style="text-align: center;">
            <div class="cancel-icon">❌</div>
            <h2 style="color: #dc2626;">Your Order Has Been Cancelled</h2>
            <p>Dear ${data.userName},</p>
            <p>Your order <strong>#${data.orderNumber}</strong> has been successfully cancelled as per your request.</p>

            <div class="info-box" style="text-align: left;">
                <div class="detail-row">
                    <span class="detail-label">Order Number</span>
                    <span class="detail-value">#${data.orderNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Cancelled On</span>
                    <span class="detail-value">${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                ${data.reason ? `<div class="detail-row">
                    <span class="detail-label">Reason</span>
                    <span class="detail-value">${data.reason}</span>
                </div>` : ""}
                ${data.refundAmount ? `<div class="detail-row">
                    <span class="detail-label">Refund Amount</span>
                    <span class="detail-value" style="color: #22c55e;">₹${parseFloat(data.refundAmount).toFixed(2)}</span>
                </div>` : ""}
            </div>

            ${data.refundAmount ? `<p style="color: #22c55e; font-weight: 600;">Your refund of ₹${parseFloat(data.refundAmount).toFixed(2)} will be processed within 5-7 business days.</p>` : ""}

            <p>If you have any questions, please contact our support team.</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account/orders" class="button">View Your Orders</a>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};

/* ─── Admin Order Cancelled Notification ────────────────────────────── */
export const getAdminOrderCancelledTemplate = (data, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Cancelled - ${store.storeName}</title>
    <style>${BASE_STYLES}</style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Order Cancelled", "Cancellation Alert", store, true)}
        <div class="content">
            <h2 style="color: #dc2626;">Order #${data.orderNumber} Has Been Cancelled</h2>
            <p>An order has been cancelled${data.cancelledBy === "user" ? " by the customer" : " by admin"}.</p>

            <div class="info-box">
                <div style="margin-bottom:8px;"><strong>Order Number:</strong> #${data.orderNumber}</div>
                <div style="margin-bottom:8px;"><strong>Customer:</strong> ${data.customerName}</div>
                <div style="margin-bottom:8px;"><strong>Email:</strong> ${data.customerEmail}</div>
                <div style="margin-bottom:8px;"><strong>Cancelled On:</strong> ${new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                ${data.reason ? `<div style="margin-bottom:8px;"><strong>Reason:</strong> ${data.reason}</div>` : ""}
                <div><strong>Total Amount:</strong> ₹${parseFloat(data.total).toFixed(2)}</div>
            </div>

            <div class="button-container">
                <a href="${process.env.ADMIN_URL || process.env.FRONTEND_URL}/orders" class="button" style="background: linear-gradient(135deg, #dc2626, #b91c1c);">View in Dashboard</a>
            </div>
        </div>
        <div class="footer">
            © ${new Date().getFullYear()} ${store.storeName} | Admin Notification<br>
            This is an automated admin notification.
        </div>
    </div>
</body>
</html>`;
};

/* ─── Shipped / Tracking Email (User) ───────────────────────────────── */
export const getOrderShippedTemplate = (data, storeConfig = null) => {
    const store = storeConfig || getStoreConfig();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Shipped - ${store.storeName}</title>
    <style>
        ${BASE_STYLES}
        .tracking-box { background: linear-gradient(135deg, #003E29, #005a3c); color: #ffffff; border-radius: 14px; padding: 30px; margin: 24px 0; text-align: center; }
        .tracking-box h3 { color: #D4AF37; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 10px 0; }
        .tracking-box .awb-code { font-size: 32px; font-weight: 900; letter-spacing: 0.1em; font-family: 'Courier New', monospace; margin: 10px 0; }
        .tracking-box .courier-name { font-size: 16px; color: #d1d5db; margin-bottom: 8px; }
        .tracking-box .courier-service { font-size: 13px; color: #9ca3af; margin-bottom: 20px; }
        .tracking-btn { display: inline-block; padding: 14px 36px; background: #D4AF37; color: #000000 !important; text-decoration: none; border-radius: 10px; font-weight: 800; font-size: 15px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; font-size: 14px; }
        .detail-label { color: #6b7280; }
        .detail-value { color: #111827; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        ${HEADER_HTML("Your Order Has Been Shipped!", "Shipment Update", store)}
        <div class="content">
            <p>Dear ${data.userName},</p>
            <p>Great news! Your order <strong>#${data.orderNumber}</strong> has been shipped and is on its way to you.</p>

            <div class="tracking-box">
                <h3>📦 Track Your Shipment</h3>
                <div class="awb-code">${data.awbCode}</div>
                <div class="courier-name">${data.courierName || "Shiprocket"}</div>
                ${data.courierService ? `<div class="courier-service">${data.courierService}</div>` : ""}
                <a href="https://shiprocket.co/tracking/${data.awbCode}" class="tracking-btn">Track Live</a>
                <p style="font-size: 12px; color: #9ca3af; margin-top: 14px;">Click above to track your shipment in real-time</p>
            </div>

            <div class="info-box">
                <h3>Shipment Details</h3>
                <div class="detail-row">
                    <span class="detail-label">AWB / Tracking Number</span>
                    <span class="detail-value" style="font-family: monospace;">${data.awbCode}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Courier Partner</span>
                    <span class="detail-value">${data.courierName || "Shiprocket"}</span>
                </div>
                ${data.estimatedDelivery ? `<div class="detail-row">
                    <span class="detail-label">Estimated Delivery</span>
                    <span class="detail-value">${data.estimatedDelivery}</span>
                </div>` : ""}
                <div class="detail-row">
                    <span class="detail-label">Ship To</span>
                    <span class="detail-value">${data.shippingAddress?.city || ""}, ${data.shippingAddress?.state || ""}</span>
                </div>
            </div>

            <p>You can also track your order from your account dashboard:</p>
            <div class="button-container">
                <a href="${process.env.FRONTEND_URL}/account/orders" class="button">View My Orders</a>
            </div>
        </div>
        ${FOOTER_HTML(store)}
    </div>
</body>
</html>`;
};
