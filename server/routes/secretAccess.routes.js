import express from "express";
import { verifyJWTToken } from "../middlewares/auth.middleware.js";
import {
  activateAccess,
  checkAccess,
  verifyActivationToken,
} from "../controllers/secretAccess.controller.js";

const router = express.Router();

// Verify activation token (no auth required - for page display)
router.get("/verify-token", verifyActivationToken);

// All routes below require authentication
router.use(verifyJWTToken);

// Activate Secret Collection access
router.post("/activate", activateAccess);

// Check if user has active Secret Collection access
router.get("/check", checkAccess);

export default router;
