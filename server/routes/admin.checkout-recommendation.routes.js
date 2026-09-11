import express from "express";
import {
  getAdminCheckoutRecommendations,
  setAdminCheckoutRecommendations,
} from "../controllers/checkout-recommendation.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";

const router = express.Router();

router.get(
  "/checkout-recommendations",
  verifyAdminJWT,
  hasPermission("products", "read"),
  getAdminCheckoutRecommendations
);

router.put(
  "/checkout-recommendations",
  verifyAdminJWT,
  hasPermission("products", "update"),
  setAdminCheckoutRecommendations
);

export default router;
