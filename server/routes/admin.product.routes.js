import express from "express";
import {
  getProducts,
  getProductById,
  getProductsByType,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  deleteProductImage,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  uploadVariantImage,
  deleteVariantImage,
  setVariantImageAsPrimary,
  reorderVariantImages,
  bulkVariantOperations,
} from "../controllers/admin.product.controller.js";
import {
  verifyAdminJWT,
  hasPermission,
} from "../middlewares/admin.middleware.js";
import { uploadFiles } from "../middlewares/multer.middlerware.js";

const router = express.Router();

// Product routes
router.get(
  "/products",
  verifyAdminJWT,
  hasPermission("products", "read"),
  getProducts
);

router.get(
  "/products/:productId",
  verifyAdminJWT,
  hasPermission("products", "read"),
  getProductById
);

// Get products by type (featured, bestseller, trending, new, etc.)
router.get(
  "/products/type/:productType",
  verifyAdminJWT,
  hasPermission("products", "read"),
  getProductsByType
);

router.post(
  "/products",
  verifyAdminJWT,
  hasPermission("products", "create"),
  uploadFiles.fields([
    { name: "images", maxCount: 20 },
    { name: "lifestyleImage", maxCount: 1 },
    { name: "variantImages_0", maxCount: 10 },
    { name: "variantImages_1", maxCount: 10 },
    { name: "variantImages_2", maxCount: 10 },
    { name: "variantImages_3", maxCount: 10 },
    { name: "variantImages_4", maxCount: 10 },
    { name: "variantImages_5", maxCount: 10 },
    { name: "noteImages_0", maxCount: 1 },
    { name: "noteImages_1", maxCount: 1 },
    { name: "noteImages_2", maxCount: 1 },
    { name: "noteImages_3", maxCount: 1 },
    { name: "noteImages_4", maxCount: 1 },
    { name: "noteImages_5", maxCount: 1 },
    { name: "noteImages_6", maxCount: 1 },
    { name: "noteImages_7", maxCount: 1 },
    { name: "noteImages_8", maxCount: 1 },
    { name: "noteImages_9", maxCount: 1 },
    { name: "noteImages_10", maxCount: 1 },
    { name: "noteImages_11", maxCount: 1 },
    { name: "noteImages_12", maxCount: 1 },
    { name: "noteImages_13", maxCount: 1 },
    { name: "noteImages_14", maxCount: 1 },
    { name: "noteImages_15", maxCount: 1 },
    { name: "noteImages_16", maxCount: 1 },
    { name: "noteImages_17", maxCount: 1 },
    { name: "noteImages_18", maxCount: 1 },
    { name: "noteImages_19", maxCount: 1 },
  ]),
  createProduct
);

router.patch(
  "/products/:productId",
  verifyAdminJWT,
  hasPermission("products", "update"),
  uploadFiles.fields([
    { name: "images", maxCount: 20 },
    { name: "lifestyleImage", maxCount: 1 },
    { name: "variantImages_0", maxCount: 10 },
    { name: "variantImages_1", maxCount: 10 },
    { name: "variantImages_2", maxCount: 10 },
    { name: "variantImages_3", maxCount: 10 },
    { name: "variantImages_4", maxCount: 10 },
    { name: "variantImages_5", maxCount: 10 },
    { name: "noteImages_0", maxCount: 1 },
    { name: "noteImages_1", maxCount: 1 },
    { name: "noteImages_2", maxCount: 1 },
    { name: "noteImages_3", maxCount: 1 },
    { name: "noteImages_4", maxCount: 1 },
    { name: "noteImages_5", maxCount: 1 },
    { name: "noteImages_6", maxCount: 1 },
    { name: "noteImages_7", maxCount: 1 },
    { name: "noteImages_8", maxCount: 1 },
    { name: "noteImages_9", maxCount: 1 },
    { name: "noteImages_10", maxCount: 1 },
    { name: "noteImages_11", maxCount: 1 },
    { name: "noteImages_12", maxCount: 1 },
    { name: "noteImages_13", maxCount: 1 },
    { name: "noteImages_14", maxCount: 1 },
    { name: "noteImages_15", maxCount: 1 },
    { name: "noteImages_16", maxCount: 1 },
    { name: "noteImages_17", maxCount: 1 },
    { name: "noteImages_18", maxCount: 1 },
    { name: "noteImages_19", maxCount: 1 },
  ]),
  updateProduct
);

router.delete(
  "/products/:productId",
  verifyAdminJWT,
  hasPermission("products", "delete"),
  deleteProduct
);

// Product image routes
router.post(
  "/products/:productId/images",
  verifyAdminJWT,
  hasPermission("products", "update"),
  uploadFiles.single("image"),
  uploadProductImage
);

router.delete(
  "/products/images/:imageId",
  verifyAdminJWT,
  hasPermission("products", "update"),
  deleteProductImage
);

// Product variant routes
router.post(
  "/products/:productId/variants",
  verifyAdminJWT,
  hasPermission("products", "update"),
  createProductVariant
);

// New bulk variant operations route
router.post(
  "/products/:productId/bulk-variants",
  verifyAdminJWT,
  hasPermission("products", "update"),
  bulkVariantOperations
);

router.patch(
  "/variants/:variantId",
  verifyAdminJWT,
  hasPermission("products", "update"),
  updateProductVariant
);

router.delete(
  "/variants/:variantId",
  verifyAdminJWT,
  hasPermission("products", "update"),
  deleteProductVariant
);

// Variant image routes
router.post(
  "/variants/:variantId/images",
  verifyAdminJWT,
  hasPermission("products", "update"),
  uploadFiles.single("image"),
  uploadVariantImage
);

router.delete(
  "/variants/images/:imageId",
  verifyAdminJWT,
  hasPermission("products", "update"),
  deleteVariantImage
);

router.patch(
  "/variants/images/:imageId/set-primary",
  verifyAdminJWT,
  hasPermission("products", "update"),
  setVariantImageAsPrimary
);

router.patch(
  "/variants/:variantId/images/reorder",
  verifyAdminJWT,
  hasPermission("products", "update"),
  reorderVariantImages
);

export default router;
