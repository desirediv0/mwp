import { Router } from "express";
import {
  adminListCertificates,
  adminCreateCertificate,
  adminUpdateCertificate,
  adminDeleteCertificate,
  adminReorderCertificates,
} from "../controllers/certificate.controller.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

const router = Router();

router.use(verifyAdminJWT);

router.get("/", adminListCertificates);
router.post("/", uploadFiles.fields([{ name: "file", maxCount: 1 }, { name: "logo", maxCount: 1 }]), adminCreateCertificate);
router.put("/reorder", adminReorderCertificates);
router.put("/:id", uploadFiles.fields([{ name: "file", maxCount: 1 }, { name: "logo", maxCount: 1 }]), adminUpdateCertificate);
router.delete("/:id", adminDeleteCertificate);

export default router;
