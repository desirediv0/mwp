import { Router } from "express";
import {
  adminListIngredients,
  adminGetIngredient,
  adminCreateIngredient,
  adminUpdateIngredient,
  adminDeleteIngredient,
  adminReorderIngredients,
  adminGetProductIngredients as adminGetProductIngredientLinks,
  adminSetProductIngredients as adminSetProductIngredientLinks,
} from "../controllers/ingredient.controller.js";
import {
  adminGetProductIngredients,
  adminCreateProductIngredient,
  adminUpdateProductIngredient,
  adminDeleteProductIngredient,
  adminReorderProductIngredients,
} from "../controllers/productIngredient.controller.js";
import { verifyAdminJWT } from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

const router = Router();

router.use(verifyAdminJWT);

// Master ingredient library (unused by current admin UI, kept for compatibility)
router.get("/", adminListIngredients);
router.post("/", uploadFiles.single("image"), adminCreateIngredient);
router.put("/reorder", adminReorderIngredients);
router.get("/library-links/:productId", adminGetProductIngredientLinks);
router.put("/library-links/:productId", adminSetProductIngredientLinks);
router.get("/:id", adminGetIngredient);
router.put("/:id", uploadFiles.single("image"), adminUpdateIngredient);
router.delete("/:id", adminDeleteIngredient);

export default router;

// -------------------------------------------------------------------
// Standalone per-product ingredients (name/type/image/description).
// Mounted separately below so its paths never collide with the
// master-library routes above.
export const productIngredientAdminRouter = Router();
productIngredientAdminRouter.use(verifyAdminJWT);

productIngredientAdminRouter.get("/product/:productId", adminGetProductIngredients);
productIngredientAdminRouter.post(
  "/product/:productId",
  uploadFiles.single("image"),
  adminCreateProductIngredient
);
productIngredientAdminRouter.put(
  "/product/:productId/reorder",
  adminReorderProductIngredients
);
productIngredientAdminRouter.put(
  "/item/:itemId",
  uploadFiles.single("image"),
  adminUpdateProductIngredient
);
productIngredientAdminRouter.delete("/item/:itemId", adminDeleteProductIngredient);
