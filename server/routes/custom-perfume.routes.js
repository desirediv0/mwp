import express from "express";
import { getCustomPerfumeOptions } from "../controllers/custom-perfume.controller.js";

const router = express.Router();

// GET /api/custom-perfume/options
router.get("/options", getCustomPerfumeOptions);

export default router;
