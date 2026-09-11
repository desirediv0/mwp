import express from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";
import {
  createCustomPerfumeRazorpayOrder,
  verifyCustomPerfumePayment,
  getUserCustomPerfumeOrders,
  cancelUserCustomPerfumeOrder,
  getAdminCustomPerfumeOrders,
  updateAdminCustomOrderStatus
} from "../controllers/custom-perfume-order.controller.js";

const router = express.Router();

// User Endpoints
router.post("/custom-perfume-order/create-razorpay", verifyJWTToken, createCustomPerfumeRazorpayOrder);
router.post("/custom-perfume-order/verify-payment", verifyJWTToken, verifyCustomPerfumePayment);
router.get("/custom-perfume-order/user-orders", verifyJWTToken, getUserCustomPerfumeOrders);
router.patch("/custom-perfume-order/user-orders/:id/cancel", verifyJWTToken, cancelUserCustomPerfumeOrder);

// Admin Endpoints
router.get("/admin/custom-perfume-orders", verifyAdminJWT, getAdminCustomPerfumeOrders);
router.patch("/admin/custom-perfume-orders/:id/status", verifyAdminJWT, updateAdminCustomOrderStatus);

export default router;
