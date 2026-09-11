import { Router } from "express";
import {
  getPublicIngredients,
  getPublicIngredientBySlug,
} from "../controllers/ingredient.controller.js";

const router = Router();

router.get("/", getPublicIngredients);
router.get("/:slug", getPublicIngredientBySlug);

export default router;
