import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { processAndUploadImage, getFileUrl } from "../middlewares/multer.middlerware.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";
import slugify from "slugify";

const makeSlug = (name) =>
  slugify(String(name || ""), { lower: true, strict: true }).slice(0, 80);

const format = (ing) => ({
  ...ing,
  image: ing.image ? getFileUrl(ing.image) : null,
});

/* -------------------- PUBLIC -------------------- */

export const getPublicIngredients = asyncHandler(async (req, res) => {
  const ingredients = await prisma.ingredient.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  res
    .status(200)
    .json(new ApiResponsive(200, { ingredients: ingredients.map(format) }, "Ingredients fetched"));
});

export const getPublicIngredientBySlug = asyncHandler(async (req, res) => {
  const ingredient = await prisma.ingredient.findFirst({
    where: { slug: req.params.slug, isActive: true },
  });
  if (!ingredient) throw new ApiError(404, "Ingredient not found");
  res.status(200).json(new ApiResponsive(200, { ingredient: format(ingredient) }, "Ingredient fetched"));
});

/* -------------------- ADMIN -------------------- */

export const adminListIngredients = asyncHandler(async (req, res) => {
  const ingredients = await prisma.ingredient.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  res.status(200).json(new ApiResponsive(200, { ingredients: ingredients.map(format) }, "Ingredients fetched"));
});

export const adminGetIngredient = asyncHandler(async (req, res) => {
  const ingredient = await prisma.ingredient.findUnique({ where: { id: req.params.id } });
  if (!ingredient) throw new ApiError(404, "Ingredient not found");
  res.status(200).json(new ApiResponsive(200, { ingredient: format(ingredient) }, "Ingredient fetched"));
});

export const adminCreateIngredient = asyncHandler(async (req, res) => {
  const { name, benefit, displayOrder, isActive } = req.body;
  if (!name || !benefit) throw new ApiError(400, "Name and benefit are required");

  const slug = makeSlug(name);
  const exists = await prisma.ingredient.findFirst({ where: { OR: [{ name }, { slug }] } });
  if (exists) throw new ApiError(409, "An ingredient with this name already exists");

  let image = null;
  if (req.file) image = await processAndUploadImage(req.file, "ingredients");

  const ingredient = await prisma.ingredient.create({
    data: {
      name,
      slug,
      benefit,
      image,
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) || 0 : 0,
      isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
    },
  });
  res.status(201).json(new ApiResponsive(201, { ingredient: format(ingredient) }, "Ingredient created"));
});

export const adminUpdateIngredient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.ingredient.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Ingredient not found");

  const { name, benefit, displayOrder, isActive } = req.body;
  const data = {};
  if (name && name !== existing.name) {
    data.name = name;
    data.slug = makeSlug(name);
  }
  if (benefit !== undefined) data.benefit = benefit;
  if (displayOrder !== undefined) data.displayOrder = parseInt(displayOrder) || 0;
  if (isActive !== undefined) data.isActive = isActive === "true" || isActive === true;

  if (req.file) {
    if (existing.image) await deleteFromS3(existing.image).catch(() => {});
    data.image = await processAndUploadImage(req.file, "ingredients");
  }

  const ingredient = await prisma.ingredient.update({ where: { id }, data });
  res.status(200).json(new ApiResponsive(200, { ingredient: format(ingredient) }, "Ingredient updated"));
});

export const adminDeleteIngredient = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.ingredient.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Ingredient not found");
  if (existing.image) await deleteFromS3(existing.image).catch(() => {});
  await prisma.ingredient.delete({ where: { id } });
  res.status(200).json(new ApiResponsive(200, {}, "Ingredient deleted"));
});

export const adminReorderIngredients = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{ id, displayOrder }]
  if (!Array.isArray(order)) throw new ApiError(400, "order must be an array");
  await prisma.$transaction(
    order.map((o) =>
      prisma.ingredient.update({ where: { id: o.id }, data: { displayOrder: parseInt(o.displayOrder) || 0 } })
    )
  );
  res.status(200).json(new ApiResponsive(200, {}, "Order updated"));
});

/* -------------------- PRODUCT <-> INGREDIENT LINKS -------------------- */

// Admin: get the ingredients linked to a product
export const adminGetProductIngredients = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const links = await prisma.productIngredient.findMany({
    where: { productId },
    orderBy: { displayOrder: "asc" },
    include: { ingredient: true },
  });
  res.status(200).json(
    new ApiResponsive(
      200,
      {
        ingredients: links.map((l) => ({
          ...format(l.ingredient),
          displayOrder: l.displayOrder,
          linkId: l.id,
        })),
      },
      "Product ingredients fetched"
    )
  );
});

// Admin: replace the full set of ingredients for a product.
// Body: { ingredientIds: string[] }  (order = array order)
export const adminSetProductIngredients = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { ingredientIds } = req.body;
  if (!Array.isArray(ingredientIds)) throw new ApiError(400, "ingredientIds must be an array");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, "Product not found");

  const uniqueIds = [...new Set(ingredientIds.filter(Boolean))];

  await prisma.$transaction([
    prisma.productIngredient.deleteMany({ where: { productId } }),
    ...uniqueIds.map((ingredientId, idx) =>
      prisma.productIngredient.create({
        data: { productId, ingredientId, displayOrder: idx },
      })
    ),
  ]);

  const links = await prisma.productIngredient.findMany({
    where: { productId },
    orderBy: { displayOrder: "asc" },
    include: { ingredient: true },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        ingredients: links.map((l) => ({ ...format(l.ingredient), displayOrder: l.displayOrder })),
      },
      "Product ingredients updated"
    )
  );
});
