import express from "express";
import {
  getNewsletterSubscribers,
  deleteNewsletterSubscriber,
  toggleSubscriberStatus,
} from "../controllers/newsletter.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";

const router = express.Router();

router.use(verifyAdminJWT);

// Get all subscribers (paginated + searchable)
router.get("/newsletter/subscribers", hasPermission("users", "read"), getNewsletterSubscribers);

// Toggle subscriber active status
router.patch("/newsletter/subscribers/:id/status", hasPermission("users", "update"), toggleSubscriberStatus);

// Delete subscriber
router.delete("/newsletter/subscribers/:id", hasPermission("users", "delete"), deleteNewsletterSubscriber);

export default router;
