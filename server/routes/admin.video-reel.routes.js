import express from "express";
import {
  getVideoReels,
  getVideoReelById,
  createVideoReel,
  updateVideoReel,
  deleteVideoReel,
  toggleActiveVideoReel,
  getVideoReelsByProductId,
} from "../controllers/admin.video-reel.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

const router = express.Router();

router.get(
  "/video-reels",
  verifyAdminJWT,
  hasPermission("banners", "read"),
  getVideoReels
);

router.get(
  "/video-reels/product/:productId",
  verifyAdminJWT,
  hasPermission("banners", "read"),
  getVideoReelsByProductId
);

router.get(
  "/video-reels/:reelId",
  verifyAdminJWT,
  hasPermission("banners", "read"),
  getVideoReelById
);

// Create - only video upload, no thumbnail
router.post(
  "/video-reels",
  verifyAdminJWT,
  hasPermission("banners", "create"),
  uploadFiles.fields([{ name: "video", maxCount: 1 }]),
  createVideoReel
);

// Update - only video upload, no thumbnail
router.put(
  "/video-reels/:reelId",
  verifyAdminJWT,
  hasPermission("banners", "update"),
  uploadFiles.fields([{ name: "video", maxCount: 1 }]),
  updateVideoReel
);

router.delete(
  "/video-reels/:reelId",
  verifyAdminJWT,
  hasPermission("banners", "delete"),
  deleteVideoReel
);

router.patch(
  "/video-reels/:reelId/toggle-active",
  verifyAdminJWT,
  hasPermission("banners", "update"),
  toggleActiveVideoReel
);

export default router;
