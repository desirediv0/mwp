import { Router } from "express";
import {
  adminListVerifications,
  adminGetVerification,
  adminGetVerificationByCode,
  adminCreateVerification,
  adminUpdateVerification,
  adminUpdateVerificationStatus,
  adminDeleteVerification,
  adminReactivateVerification,
} from "../controllers/verification.controller.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

const router = Router();
router.use(verifyAdminJWT);

const fileFields = uploadFiles.fields([
  { name: "productImage", maxCount: 1 },
  { name: "badgeImage", maxCount: 1 },
  { name: "coa", maxCount: 1 },
  { name: "certificate", maxCount: 1 },
]);

router.get("/", adminListVerifications);
router.post("/", fileFields, adminCreateVerification);
router.get("/code/:verificationCode", adminGetVerificationByCode);
router.get("/:id", adminGetVerification);
router.patch("/:id", fileFields, adminUpdateVerification);
router.patch("/:id/status", adminUpdateVerificationStatus);
router.patch("/:id/reactivate", adminReactivateVerification);
router.delete("/:id", adminDeleteVerification);

export default router;
