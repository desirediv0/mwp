import express from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  getPublicSettings,
  previewSubscription,
  startSubscriptionCheckout,
  confirmSubscription,
  listMySubscriptions,
  cancelMySubscription,
  skipMyNextShipment,
  changeMyAddress,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.get("/settings", getPublicSettings);

router.use(verifyJWTToken);
router.get("/mine", listMySubscriptions);
router.post("/preview", previewSubscription);
router.post("/checkout", startSubscriptionCheckout);
router.post("/confirm", confirmSubscription);
router.post("/:id/cancel", cancelMySubscription);
router.post("/:id/skip", skipMyNextShipment);
router.post("/:id/address", changeMyAddress);

export default router;
