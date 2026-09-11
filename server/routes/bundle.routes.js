import express from "express";
import {
  getActiveBundles,
  getBundleBySlug,
  getBundleProducts,
} from "../controllers/bundle.controller.js";

const router = express.Router();

// Get all active bundles
router.get("/", getActiveBundles);

// Get bundle by slug
router.get("/:slug", getBundleBySlug);

// Get products matching bundle rules
router.get("/:slug/products", getBundleProducts);

export default router;
