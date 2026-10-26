import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import {
  adminListSubscriptions,
  adminGetSubscription,
  adminCancelSubscription,
  adminRunJobs,
  adminForecast,
  adminListPrices,
  adminSetPrice,
  adminGetSettings,
  adminSaveSettings,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.get("/settings", isAdmin, adminGetSettings);
router.put("/settings", isAdmin, adminSaveSettings);
router.post("/run", isAdmin, adminRunJobs);
router.get("/forecast", isAdmin, adminForecast);
router.get("/prices", isAdmin, adminListPrices);
router.put("/prices/:variantId", isAdmin, adminSetPrice);
router.get("/", isAdmin, adminListSubscriptions);
router.get("/:id", isAdmin, adminGetSubscription);
router.post("/:id/cancel", isAdmin, adminCancelSubscription);

export default router;
