import { Router } from "express";
import { publicVerify } from "../controllers/verification.controller.js";
import { verificationRateLimiter } from "../middlewares/rateLimiter.js";

const router = Router();

// GET /api/public/verify/:verificationCode — no auth, rate limited.
router.get("/:verificationCode", verificationRateLimiter, publicVerify);

export default router;
