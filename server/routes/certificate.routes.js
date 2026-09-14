import { Router } from "express";
import { getPublicCertificates } from "../controllers/certificate.controller.js";

const router = Router();

router.get("/", getPublicCertificates);

export default router;
