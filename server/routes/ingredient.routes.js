import { Router } from "express";
import {
  getPublicIngredients,
  getPublicIngredientBySlug,
} from "../controllers/ingredient.controller.js";
import { getPublicProductIngredients } from "../controllers/productIngredient.controller.js";

const router = Router();

router.get("/", getPublicIngredients);
// Permanent per-product ingredients page: /ingredients/<productId>
// This URL never changes, so a QR printed on that product's packaging
// keeps working forever even as ingredients are added/edited/removed.
router.get("/product/:productId", getPublicProductIngredients);
router.get("/:slug", getPublicIngredientBySlug);

export default router;
