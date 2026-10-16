import express from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  getPaymentSettings,
  checkout,
  confirmStripePayment,
  getOrderHistory,
  getOrderDetails,
  cancelOrder,
} from "../controllers/payment.controller.js";

const router = express.Router();

// Public route - Get payment settings
router.get("/settings", getPaymentSettings);

// All other payment routes require authentication
router.use(verifyJWTToken);

// Start a Stripe Checkout Session (returns the hosted payment URL)
router.post("/checkout", checkout);

// Confirm a paid Stripe Checkout Session and create the order
router.post("/confirm", confirmStripePayment);

// Order history
router.get("/orders", getOrderHistory);

// Order details
router.get("/orders/:orderId", getOrderDetails);

// Cancel order
router.post("/orders/:orderId/cancel", cancelOrder);

export default router;
