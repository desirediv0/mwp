import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
  getSettings,
  saveSettings,
  getConnectUrl,
  oauthCallback,
  disconnectQb,
  testConnection,
  syncOneOrder,
  refundOneOrder,
  syncPending,
} from "../controllers/admin.quickbooks.controller.js";

const router = express.Router();

// Public on purpose: Intuit redirects the browser here. The signed "state" proves an admin started it.
router.get("/callback", oauthCallback);

router.get("/settings", isAdmin, getSettings);
router.put("/settings", isAdmin, saveSettings);
router.get("/connect-url", isAdmin, getConnectUrl);
router.post("/disconnect", isAdmin, disconnectQb);
router.post("/test-connection", isAdmin, testConnection);
router.post("/sync-pending", isAdmin, syncPending);
router.post("/orders/:orderId/sync", isAdmin, syncOneOrder);
router.post("/orders/:orderId/refund", isAdmin, refundOneOrder);

export default router;
