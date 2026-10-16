import express from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { getShippingRates } from "../controllers/shipping.controller.js";

const router = express.Router();

// Shipping options for the logged-in customer's cart and chosen address
router.post("/rates", verifyJWTToken, getShippingRates);

export default router;
