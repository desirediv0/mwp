import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateUsAddress } from "../utils/usValidation.js";
import { priceCart } from "./payment.controller.js";
import { quoteRates, applyTrackerUpdate } from "../utils/shipping.js";
import { getShippingSettings, verifyWebhookSignature } from "../utils/easypost.js";
import { decrypt } from "../utils/encryption.js";

// Customer: shipping options (carrier, service, price, delivery time) for the cart and chosen address
export const getShippingRates = asyncHandler(async (req, res) => {
  const { shippingAddressId, couponId } = req.body;
  const userId = req.user.id;
  if (!shippingAddressId) throw new ApiError(400, "Choose a shipping address first");

  const address = await prisma.address.findFirst({ where: { id: shippingAddressId, userId } });
  if (!address) throw new ApiError(404, "Shipping address not found");
  const checked = validateUsAddress(address);
  if (checked.errors) throw new ApiError(400, `Please update your shipping address: ${Object.values(checked.errors)[0]}`);

  const { subTotal, parcelItems } = await priceCart(userId, couponId || null);
  const quote = await quoteRates({ address, subTotal, parcelItems });

  res.status(200).json(new ApiResponsive(200, quote, "Shipping options fetched"));
});

// EasyPost -> server webhook (tracking updates). Raw body so the signature can be verified.
export const easypostWebhook = async (req, res) => {
  try {
    const settings = await getShippingSettings();
    if (settings.webhookSecret) {
      let secret = null;
      try {
        secret = decrypt(settings.webhookSecret);
      } catch {
        secret = null;
      }
      if (!verifyWebhookSignature(req.body, req.headers["x-hmac-signature"], secret)) {
        return res.status(401).send("Invalid signature");
      }
    }

    const event = JSON.parse(req.body.toString("utf8"));
    if (event.description === "tracker.updated" || event.description === "tracker.created") {
      await applyTrackerUpdate(event.result || {});
    }
    return res.json({ received: true });
  } catch (err) {
    console.error("EasyPost webhook error:", err.message);
    return res.status(500).send("Webhook handler failed");
  }
};
