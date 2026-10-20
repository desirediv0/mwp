import express from "express";
import { isAdmin } from "../middlewares/auth.middleware.js";
import { getSettings, saveSettings, getPublicConfig } from "../controllers/admin.tracking.controller.js";

export const publicTrackingRouter = express.Router();
publicTrackingRouter.get("/", getPublicConfig);

const adminTrackingRouter = express.Router();
adminTrackingRouter.get("/settings", isAdmin, getSettings);
adminTrackingRouter.put("/settings", isAdmin, saveSettings);
export default adminTrackingRouter;
