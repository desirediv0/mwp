import express from "express";
import {
  getBundleCampaigns,
  getBundleCampaignById,
  createBundleCampaign,
  updateBundleCampaign,
  deleteBundleCampaign,
  toggleBundleCampaignStatus,
  duplicateBundleCampaign,
  previewBundleProducts,
  getBundleAnalytics,
} from "../controllers/admin.bundle.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";
import multer from "multer";

const router = express.Router();

// Configure multer for banner uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([{ name: "banner", maxCount: 1 }]);

// All routes require admin authentication
router.use(verifyAdminJWT);

// Get all bundle campaigns
router.get(
  "/",
  hasPermission("products", "read"),
  getBundleCampaigns
);

// Get bundle analytics
router.get(
  "/analytics",
  hasPermission("products", "read"),
  getBundleAnalytics
);

// Get bundle campaign by ID
router.get(
  "/:id",
  hasPermission("products", "read"),
  getBundleCampaignById
);

// Create bundle campaign
router.post(
  "/",
  hasPermission("products", "create"),
  upload,
  createBundleCampaign
);

// Update bundle campaign
router.patch(
  "/:id",
  hasPermission("products", "update"),
  upload,
  updateBundleCampaign
);

// Delete bundle campaign
router.delete(
  "/:id",
  hasPermission("products", "delete"),
  deleteBundleCampaign
);

// Toggle bundle campaign status
router.patch(
  "/:id/toggle-status",
  hasPermission("products", "update"),
  toggleBundleCampaignStatus
);

// Duplicate bundle campaign
router.post(
  "/:id/duplicate",
  hasPermission("products", "create"),
  duplicateBundleCampaign
);

// Preview products matching bundle rules
router.get(
  "/:id/preview-products",
  hasPermission("products", "read"),
  previewBundleProducts
);

export default router;
