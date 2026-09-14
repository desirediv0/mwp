import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { processAndUploadImage, getFileUrl } from "../middlewares/multer.middlerware.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

const formatItem = (i) => ({
  ...i,
  image: i.image ? getFileUrl(i.image) : null,
});

/* -------------------- PUBLIC -------------------- */
// Permanent page: /ingredients/[productId] — URL never changes, so a QR
// printed on a product's packaging keeps working even as ingredients are
// added, edited, or removed later.
export const getPublicProductIngredients = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await prisma.product.findFirst({
    where: { id: productId, isActive: true, visibility: "PUBLIC" },
    include: {
      images: { orderBy: { isPrimary: "desc" }, take: 1 },
      categories: { include: { category: true }, take: 1 },
      ingredientItems: { orderBy: { displayOrder: "asc" } },
    },
  });

  if (!product) throw new ApiError(404, "Product not found");

  const primaryImage = product.images?.[0]?.url ? getFileUrl(product.images[0].url) : null;

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: primaryImage,
          category: product.categories?.[0]?.category?.name || null,
        },
        ingredients: product.ingredientItems.map(formatItem),
      },
      "Product ingredients fetched"
    )
  );
});

/* -------------------- ADMIN -------------------- */

export const adminGetProductIngredients = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      images: { orderBy: { isPrimary: "desc" }, take: 1 },
    },
  });
  if (!product) throw new ApiError(404, "Product not found");

  const items = await prisma.productIngredientItem.findMany({
    where: { productId },
    orderBy: { displayOrder: "asc" },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          image: product.images?.[0]?.url ? getFileUrl(product.images[0].url) : null,
        },
        ingredients: items.map(formatItem),
      },
      "Product ingredients fetched"
    )
  );
});

export const adminCreateProductIngredient = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { name, scientificName, type, keyBenefit, source, description, displayOrder } = req.body;
  if (!name || !description) throw new ApiError(400, "Name and description are required");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Product not found");

  let image = null;
  if (req.file) image = await processAndUploadImage(req.file, "product-ingredients");

  const item = await prisma.productIngredientItem.create({
    data: {
      productId,
      name,
      scientificName: scientificName || null,
      type: type || null,
      keyBenefit: keyBenefit || null,
      source: source || null,
      description,
      image,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) || 0 : 0,
    },
  });

  res.status(201).json(new ApiResponsive(201, { ingredient: formatItem(item) }, "Ingredient added"));
});

export const adminUpdateProductIngredient = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const existing = await prisma.productIngredientItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new ApiError(404, "Ingredient not found");

  const { name, scientificName, type, keyBenefit, source, description, displayOrder } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (scientificName !== undefined) data.scientificName = scientificName || null;
  if (type !== undefined) data.type = type || null;
  if (keyBenefit !== undefined) data.keyBenefit = keyBenefit || null;
  if (source !== undefined) data.source = source || null;
  if (description !== undefined) data.description = description;
  if (displayOrder !== undefined) data.displayOrder = parseInt(displayOrder) || 0;

  if (req.file) {
    if (existing.image) await deleteFromS3(existing.image).catch(() => {});
    data.image = await processAndUploadImage(req.file, "product-ingredients");
  }

  const item = await prisma.productIngredientItem.update({ where: { id: itemId }, data });
  res.status(200).json(new ApiResponsive(200, { ingredient: formatItem(item) }, "Ingredient updated"));
});

export const adminDeleteProductIngredient = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const existing = await prisma.productIngredientItem.findUnique({ where: { id: itemId } });
  if (!existing) throw new ApiError(404, "Ingredient not found");
  if (existing.image) await deleteFromS3(existing.image).catch(() => {});
  await prisma.productIngredientItem.delete({ where: { id: itemId } });
  res.status(200).json(new ApiResponsive(200, {}, "Ingredient deleted"));
});

export const adminReorderProductIngredients = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { order } = req.body; // [{ id, displayOrder }]
  if (!Array.isArray(order)) throw new ApiError(400, "order must be an array");
  await prisma.$transaction(
    order.map((o) =>
      prisma.productIngredientItem.update({
        where: { id: o.id, productId },
        data: { displayOrder: parseInt(o.displayOrder) || 0 },
      })
    )
  );
  res.status(200).json(new ApiResponsive(200, {}, "Order updated"));
});
