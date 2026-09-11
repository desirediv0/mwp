import { Router } from "express";
import {
  adminListIngredients,
  adminGetIngredient,
  adminCreateIngredient,
  adminUpdateIngredient,
  adminDeleteIngredient,
  adminReorderIngredients,
  adminGetProductIngredients,
  adminSetProductIngredients,
} from "../controllers/ingredient.controller.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

const router = Router();

router.use(verifyAdminJWT);

router.get("/", adminListIngredients);
router.post("/", uploadFiles.single("image"), adminCreateIngredient);
router.put("/reorder", adminReorderIngredients);
router.get("/product/:productId", adminGetProductIngredients);
router.put("/product/:productId", adminSetProductIngredients);
router.get("/:id", adminGetIngredient);
router.put("/:id", uploadFiles.single("image"), adminUpdateIngredient);
router.delete("/:id", adminDeleteIngredient);

export default router;
