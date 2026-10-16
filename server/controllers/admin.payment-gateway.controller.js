import Stripe from "stripe";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { encrypt, decrypt, maskSecret } from "../utils/encryption.js";

// Stripe is the only payment gateway. The admin saves the Stripe keys here; the secret key
// and webhook secret are stored encrypted and never sent back in full.

// PaymentGatewaySetting belongs to a User row, so use (or create) the one for the admin's email.
async function getOwnerUserId(admin) {
  let user = await prisma.user.findUnique({ where: { email: admin.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: admin.email,
        name: `${admin.firstName || ""} ${admin.lastName || ""}`.trim() || admin.email,
        role: "CUSTOMER",
        isActive: true,
      },
    });
  }
  return user.id;
}

const webhookUrl = (req) => {
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0];
  const base = process.env.API_PUBLIC_URL || `${proto}://${req.get("host")}`;
  return `${base.replace(/\/$/, "")}/api/webhooks/stripe`;
};

const present = (setting, req) => {
  if (!setting) {
    return {
      configured: false,
      isActive: false,
      mode: "TEST",
      publishableKey: "",
      secretKeyMasked: null,
      webhookSecretMasked: null,
      webhookUrl: webhookUrl(req),
    };
  }
  const safeMask = (value) => {
    if (!value) return null;
    try {
      return maskSecret(decrypt(value));
    } catch {
      return null;
    }
  };
  return {
    configured: !!setting.stripeSecretKey,
    isActive: setting.isActive,
    mode: setting.mode,
    publishableKey: setting.stripePublishableKey || "",
    secretKeyMasked: safeMask(setting.stripeSecretKey),
    webhookSecretMasked: safeMask(setting.stripeWebhookSecret),
    webhookUrl: webhookUrl(req),
  };
};

const findStripeSetting = () => prisma.paymentGatewaySetting.findFirst({ where: { gateway: "STRIPE" } });

export const getStripeSettings = asyncHandler(async (req, res) => {
  const setting = await findStripeSetting();
  res.status(200).json(new ApiResponsive(200, present(setting, req), "Stripe settings fetched"));
});

export const saveStripeSettings = asyncHandler(async (req, res) => {
  const admin = req.admin;
  if (!admin) throw new ApiError(403, "Unauthorized");

  const { publishableKey, secretKey, webhookSecret, mode, isActive } = req.body;
  const existing = await findStripeSetting();

  const nextMode = mode === "LIVE" ? "LIVE" : "TEST";
  const newSecret = typeof secretKey === "string" ? secretKey.trim() : "";
  const newWebhook = typeof webhookSecret === "string" ? webhookSecret.trim() : "";
  const newPublishable = typeof publishableKey === "string" ? publishableKey.trim() : "";

  if (!existing && !newSecret) throw new ApiError(400, "Stripe Secret Key is required");

  if (newSecret) {
    if (!/^(sk|rk)_(test|live)_/.test(newSecret)) {
      throw new ApiError(400, "The Secret Key must start with sk_test_ or sk_live_ (or rk_ for a restricted key)");
    }
    const keyIsLive = newSecret.includes("_live_");
    if (keyIsLive !== (nextMode === "LIVE")) {
      throw new ApiError(400, `This is a ${keyIsLive ? "live" : "test"} key but the mode is set to ${nextMode}. Change the mode or use the matching key.`);
    }
    // Make sure the key really works before saving it
    try {
      await new Stripe(newSecret).balance.retrieve();
    } catch (err) {
      throw new ApiError(400, `Stripe rejected this key: ${err.message}`);
    }
  }
  if (newWebhook && !newWebhook.startsWith("whsec_")) {
    throw new ApiError(400, "The Webhook Signing Secret must start with whsec_");
  }
  if (newPublishable && !/^pk_(test|live)_/.test(newPublishable)) {
    throw new ApiError(400, "The Publishable Key must start with pk_test_ or pk_live_");
  }

  const data = {
    mode: nextMode,
    isActive: isActive !== undefined ? !!isActive : existing ? existing.isActive : true,
    ...(newPublishable && { stripePublishableKey: newPublishable }),
    ...(newSecret && { stripeSecretKey: encrypt(newSecret) }),
    ...(newWebhook && { stripeWebhookSecret: encrypt(newWebhook) }),
  };

  let saved;
  if (existing) {
    saved = await prisma.paymentGatewaySetting.update({ where: { id: existing.id }, data });
  } else {
    saved = await prisma.paymentGatewaySetting.create({
      data: { ...data, userId: await getOwnerUserId(admin), gateway: "STRIPE" },
    });
  }

  // Keep the checkout switch in step: saving active keys turns Stripe on, deactivating turns it off
  const settings = await prisma.paymentSettings.findFirst();
  const stripeEnabled = !!saved.isActive && !!saved.stripeSecretKey;
  if (settings) {
    await prisma.paymentSettings.update({ where: { id: settings.id }, data: { stripeEnabled, cashEnabled: false, razorpayEnabled: false } });
  } else {
    await prisma.paymentSettings.create({ data: { stripeEnabled, cashEnabled: false, razorpayEnabled: false, codCharge: 0 } });
  }

  res.status(200).json(new ApiResponsive(200, present(saved, req), "Stripe settings saved"));
});

export const deleteStripeSettings = asyncHandler(async (req, res) => {
  const existing = await findStripeSetting();
  if (existing) await prisma.paymentGatewaySetting.delete({ where: { id: existing.id } });
  const settings = await prisma.paymentSettings.findFirst();
  if (settings) await prisma.paymentSettings.update({ where: { id: settings.id }, data: { stripeEnabled: false } });
  res.status(200).json(new ApiResponsive(200, present(null, req), "Stripe settings removed"));
});
