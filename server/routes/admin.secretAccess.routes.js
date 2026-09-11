import express from "express";
import { verifyAdminJWT, hasRole } from "../middlewares/admin.middleware.js";
import {
  getPendingOrders,
  grantAccess,
  listAccess,
  getAccessById,
  revokeAccess,
  reactivateAccess,
  extendExpiry,
  increaseUsageLimit,
  resendEmail,
  getDashboardStats,
} from "../controllers/secretAccess.controller.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyAdminJWT);

// Dashboard
router.get("/dashboard", getDashboardStats);

// Pending orders eligible for Secret Collection
router.get("/pending-orders", getPendingOrders);

// Grant access
router.post("/grant", hasRole("SUPER_ADMIN"), grantAccess);

// List all access records
router.get("/", listAccess);

// Get single access record
router.get("/:id", getAccessById);

// Revoke access
router.patch("/:id/revoke", hasRole("SUPER_ADMIN"), revokeAccess);

// Reactivate access
router.patch("/:id/reactivate", hasRole("SUPER_ADMIN"), reactivateAccess);

// Extend expiry
router.patch("/:id/extend-expiry", hasRole("SUPER_ADMIN"), extendExpiry);

// Increase usage limit
router.patch("/:id/usage-limit", hasRole("SUPER_ADMIN"), increaseUsageLimit);

// Resend email
router.post("/:id/resend-email", hasRole("SUPER_ADMIN"), resendEmail);

export default router;
