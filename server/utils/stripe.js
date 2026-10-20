import Stripe from "stripe";
import { prisma } from "../config/db.js";
import { decrypt } from "./encryption.js";
import { ApiError } from "./ApiError.js";

// Stripe is configured from the admin panel (Payment Gateway Settings); keys are stored
// encrypted in the database. Everything here works in USD.

export async function getStripeContext() {
  const settings = await prisma.paymentGatewaySetting.findFirst({
    where: { gateway: "STRIPE", isActive: true, stripeSecretKey: { not: null } },
  });
  if (!settings) {
    throw new ApiError(
      400,
      "Stripe is not configured or not active. Add your Stripe keys in Admin > Payment Gateway Settings."
    );
  }

  let secretKey;
  try {
    secretKey = decrypt(settings.stripeSecretKey);
  } catch {
    throw new ApiError(400, "Could not read the saved Stripe secret key. Please save your Stripe keys again.");
  }

  let webhookSecret = null;
  if (settings.stripeWebhookSecret) {
    try {
      webhookSecret = decrypt(settings.stripeWebhookSecret);
    } catch {
      webhookSecret = null;
    }
  }

  // STRIPE_API_HOST is only for local tests against a fake Stripe server
  const options = process.env.STRIPE_API_HOST
    ? { host: process.env.STRIPE_API_HOST, port: Number(process.env.STRIPE_API_PORT || 80), protocol: process.env.STRIPE_API_PROTOCOL || "http" }
    : undefined;
  return { stripe: new Stripe(secretKey, options), settings, webhookSecret };
}

export function mapStripeCardMethod(session) {
  const types = session?.payment_method_types || [];
  if (types.includes("card")) return "CARD";
  return "OTHER";
}

// Refunds a captured Stripe payment (full or partial) and records it.
export async function refundStripePayment(payment, amountUsd, reason = "requested_by_customer") {
  if (!payment?.paymentIntentId) throw new ApiError(400, "This payment has no Stripe payment to refund");
  const { stripe } = await getStripeContext();
  const total = parseFloat(payment.amount);
  const amount = Math.min(parseFloat(amountUsd) || total, total);

  const refund = await stripe.refunds.create({
    payment_intent: payment.paymentIntentId,
    amount: Math.round(amount * 100),
    reason,
  });

  const status = refund.status === "succeeded" ? "PROCESSED" : refund.status === "failed" ? "FAILED" : "PENDING";
  await prisma.$transaction([
    prisma.stripeRefund.create({
      data: {
        paymentIntentId: payment.paymentIntentId,
        amount: amount.toFixed(2),
        stripeRefundId: refund.id,
        status,
        reason,
        notes: { id: refund.id, status: refund.status, currency: refund.currency },
      },
    }),
    prisma.stripePayment.update({
      where: { id: payment.id },
      data: { status: amount >= total ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    }),
  ]);
  return refund;
}
