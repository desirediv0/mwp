import express from "express";
import {
  getStripeSettings,
  saveStripeSettings,
  deleteStripeSettings,
} from "../controllers/admin.payment-gateway.controller.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdminJWT);

// Stripe keys (secret + webhook secret are stored encrypted and returned masked)
router.get("/stripe-settings", getStripeSettings);
router.put("/stripe-settings", saveStripeSettings);
router.delete("/stripe-settings", deleteStripeSettings);

export default router;
