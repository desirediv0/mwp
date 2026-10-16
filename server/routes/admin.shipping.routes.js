import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
  getSettings,
  saveSettings,
  testConnection,
  getOrderRates,
  createOrderLabel,
  voidOrderLabel,
  syncOrderTracking,
} from "../controllers/admin.shipping.controller.js";

const router = express.Router();

router.get("/settings", isAdmin, getSettings);
router.put("/settings", isAdmin, saveSettings);
router.post("/test-connection", isAdmin, testConnection);

router.get("/orders/:orderId/rates", isAdmin, getOrderRates);
router.post("/orders/:orderId/label", isAdmin, createOrderLabel);
router.post("/orders/:orderId/void-label", isAdmin, voidOrderLabel);
router.post("/orders/:orderId/sync", isAdmin, syncOrderTracking);

export default router;
