import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

const MAX_RECOMMENDATIONS = 6;

// Shape a product for the storefront recommendation strip.
const formatProduct = (product) => {
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    product.variants?.[0]?.images?.[0]?.url ||
    null;

  const firstVariant =
    product.variants?.find((v) => v.isActive && (v.quantity ?? 0) > 0) ||
    product.variants?.[0] ||
    null;

  const price = firstVariant
    ? parseFloat(firstVariant.salePrice || firstVariant.price || 0)
    : 0;
  const regularPrice = firstVariant ? parseFloat(firstVariant.price || 0) : 0;
  const hasSale = !!(firstVariant?.salePrice && regularPrice > price);

  const totalStock = (product.variants || [])
    .filter((v) => v.isActive)
    .reduce((sum, v) => sum + (v.quantity ?? 0), 0);

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: primaryImage ? getFileUrl(primaryImage) : null,
    basePrice: price,
    regularPrice,
    hasSale,
    inStock: totalStock > 0,
    variantId: firstVariant?.id || null,
    variants: (product.variants || []).map((v) => ({
      id: v.id,
      price: v.price,
      salePrice: v.salePrice,
      quantity: v.quantity,
      isActive: v.isActive,
    })),
  };
};

/* -------------------- PUBLIC -------------------- */

// GET /api/public/checkout-recommendations
export const getPublicCheckoutRecommendations = asyncHandler(async (req, res) => {
  const rows = await prisma.checkoutRecommendation.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
    take: MAX_RECOMMENDATIONS,
  });

  if (rows.length === 0) {
    return res
      .status(200)
      .json(new ApiResponsive(200, { products: [] }, "No recommendations"));
  }

  const productIds = rows.map((r) => r.productId);
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
      isDeleted: false,
      visibility: "PUBLIC",
    },
    include: {
      images: { orderBy: { isPrimary: "desc" } },
      variants: {
        where: { isActive: true },
        include: { images: { orderBy: { order: "asc" } } },
        orderBy: { price: "asc" },
      },
    },
  });

  // Preserve the admin-defined order.
  const byId = new Map(products.map((p) => [p.id, p]));
  const ordered = productIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map(formatProduct);

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { products: ordered },
        "Checkout recommendations fetched"
      )
    );
});

/* -------------------- ADMIN -------------------- */

// GET /api/admin/checkout-recommendations
export const getAdminCheckoutRecommendations = asyncHandler(async (req, res) => {
  const rows = await prisma.checkoutRecommendation.findMany({
    orderBy: { position: "asc" },
  });

  const productIds = rows.map((r) => r.productId);
  const products = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          images: { orderBy: { isPrimary: "desc" }, take: 1 },
          variants: {
            take: 1,
            orderBy: { price: "asc" },
            select: { price: true, salePrice: true, quantity: true },
          },
        },
      })
    : [];

  const byId = new Map(products.map((p) => [p.id, p]));

  const items = rows.map((row) => {
    const p = byId.get(row.productId);
    return {
      id: row.id,
      productId: row.productId,
      position: row.position,
      isActive: row.isActive,
      product: p
        ? {
            id: p.id,
            name: p.name,
            slug: p.slug,
            image: p.images?.[0]?.url ? getFileUrl(p.images[0].url) : null,
            price: p.variants?.[0]
              ? parseFloat(p.variants[0].salePrice || p.variants[0].price || 0)
              : 0,
            missing: false,
          }
        : { id: row.productId, name: "(product not found)", missing: true },
    };
  });

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { items, max: MAX_RECOMMENDATIONS },
        "Checkout recommendations fetched"
      )
    );
});

// PUT /api/admin/checkout-recommendations  { productIds: string[] }
// Replaces the whole list in the given order.
export const setAdminCheckoutRecommendations = asyncHandler(async (req, res) => {
  const { productIds } = req.body;

  if (!Array.isArray(productIds)) {
    throw new ApiError(400, "productIds must be an array");
  }

  // De-dupe, keep order.
  const unique = [...new Set(productIds.filter(Boolean))];

  if (unique.length > MAX_RECOMMENDATIONS) {
    throw new ApiError(
      400,
      `You can recommend at most ${MAX_RECOMMENDATIONS} products`
    );
  }

  // Validate the products exist.
  if (unique.length > 0) {
    const found = await prisma.product.findMany({
      where: { id: { in: unique } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((p) => p.id));
    const invalid = unique.filter((id) => !foundIds.has(id));
    if (invalid.length > 0) {
      throw new ApiError(400, "Some selected products do not exist");
    }
  }

  await prisma.$transaction([
    prisma.checkoutRecommendation.deleteMany({}),
    ...unique.map((productId, index) =>
      prisma.checkoutRecommendation.create({
        data: { productId, position: index, isActive: true },
      })
    ),
  ]);

  res
    .status(200)
    .json(
      new ApiResponsive(
        200,
        { count: unique.length },
        "Checkout recommendations updated"
      )
    );
});
