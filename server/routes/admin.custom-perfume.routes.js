import express from "express";
import {
  getAdminCustomPerfumeNotes,
  createCustomPerfumeNote,
  createCustomPerfumeBottle,
  deleteCustomPerfumeNote,
  deleteCustomPerfumeBottle
} from "../controllers/admin.custom-perfume.controller.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

const router = express.Router();

router.use(verifyAdminJWT);

router.get("/custom-perfume/notes", getAdminCustomPerfumeNotes);
router.post("/custom-perfume/notes", uploadFiles.single("image"), createCustomPerfumeNote);
router.post("/custom-perfume/bottles", uploadFiles.single("image"), createCustomPerfumeBottle);
router.delete("/custom-perfume/notes/:id", deleteCustomPerfumeNote);
router.delete("/custom-perfume/bottles/:id", deleteCustomPerfumeBottle);

export default router;
