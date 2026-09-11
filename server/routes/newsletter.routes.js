import express from "express";
import { subscribeNewsletter } from "../controllers/newsletter.controller.js";

const router = express.Router();

// Public endpoint for newsletter subscription
router.post("/subscribe", subscribeNewsletter);

export default router;
