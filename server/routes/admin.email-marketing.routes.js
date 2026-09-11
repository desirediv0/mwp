import express from "express";
import {
  getSmtpSettings,
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendTestEmail,
  sendCampaign,
  retryFailedEmails,
  getUserCount,
} from "../controllers/admin.email-marketing.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";

const router = express.Router();

// SMTP Settings
router.get(
  "/email-marketing/smtp-settings",
  verifyAdminJWT,
  hasPermission("settings", "read"),
  getSmtpSettings
);

// User count
router.get(
  "/email-marketing/user-count",
  verifyAdminJWT,
  hasPermission("users", "read"),
  getUserCount
);

// Campaign CRUD
router.get(
  "/email-marketing/campaigns",
  verifyAdminJWT,
  hasPermission("settings", "read"),
  getCampaigns
);

router.get(
  "/email-marketing/campaigns/:campaignId",
  verifyAdminJWT,
  hasPermission("settings", "read"),
  getCampaignById
);

router.post(
  "/email-marketing/campaigns",
  verifyAdminJWT,
  hasPermission("settings", "create"),
  createCampaign
);

router.put(
  "/email-marketing/campaigns/:campaignId",
  verifyAdminJWT,
  hasPermission("settings", "update"),
  updateCampaign
);

router.delete(
  "/email-marketing/campaigns/:campaignId",
  verifyAdminJWT,
  hasPermission("settings", "delete"),
  deleteCampaign
);

// Test email
router.post(
  "/email-marketing/test-email",
  verifyAdminJWT,
  hasPermission("settings", "create"),
  sendTestEmail
);

// Send campaign
router.post(
  "/email-marketing/campaigns/:campaignId/send",
  verifyAdminJWT,
  hasPermission("settings", "update"),
  sendCampaign
);

// Retry failed
router.post(
  "/email-marketing/campaigns/:campaignId/retry",
  verifyAdminJWT,
  hasPermission("settings", "update"),
  retryFailedEmails
);

export default router;
