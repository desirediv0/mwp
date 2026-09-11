import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl } from "../utils/deleteFromS3.js";

// Get all active bundles for website
export const getActiveBundles = asyncHandler(async (req, res, next) => {
  // Cache for 5 minutes
  res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");

  const bundles = await prisma.bundleCampaign.findMany({
    where: {
      isActive: true,
      isDeleted: false,
      showOnWebsite: true,
      OR: [
        { startDate: null },
        { startDate: { lte: new Date() } },
      ],
      AND: [
        { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] },
      ],
    },
    include: {
      pricingSlabs: {
        orderBy: { itemCount: "asc" },
      },
    },
    orderBy: { displayOrder: "asc" },
  });

  const formatted = bundles.map((b) => ({
    id: b.id,
    title: b.title,
    slug: b.slug,
    description: b.description,
    banner: b.banner ? getFileUrl(b.banner) : null,
    bundleType: b.bundleType,
    discountType: b.discountType,
    bundlePrice: b.bundlePrice,
    pricingSlabs: b.pricingSlabs,
  }));

  res.status(200).json(
    new ApiResponsive(200, formatted, "Active bundles fetched successfully")
  );
});

// Get bundle by slug
export const getBundleBySlug = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;

  const bundle = await prisma.bundleCampaign.findUnique({
    where: { slug },
    include: {
      rule: true,
      pricingSlabs: {
        orderBy: { itemCount: "asc" },
      },
    },
  });

  if (!bundle) {
    throw new ApiError(404, "Bundle not found");
  }

  if (!bundle.isActive || !bundle.showOnWebsite || bundle.isDeleted) {
    throw new ApiError(404, "Bundle not found");
  }

  // Check date range
  const now = new Date();
  if (bundle.startDate && bundle.startDate > now) {
    throw new ApiError(404, "Bundle not yet available");
  }
  if (bundle.endDate && bundle.endDate < now) {
    throw new ApiError(404, "Bundle has expired");
  }

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        id: bundle.id,
        title: bundle.title,
        slug: bundle.slug,
        description: bundle.description,
        banner: bundle.banner ? getFileUrl(bundle.banner) : null,
        bundleType: bundle.bundleType,
        discountType: bundle.discountType,
        bundlePrice: bundle.bundlePrice,
        metaTitle: bundle.metaTitle,
        metaDescription: bundle.metaDescription,
        pricingSlabs: bundle.pricingSlabs,
        rule: bundle.rule
          ? {
              minItems: bundle.rule.minItems,
              maxItems: bundle.rule.maxItems,
            }
          : null,
      },
      "Bundle fetched successfully"
    )
  );
});

// Get products matching bundle rules
export const getBundleProducts = asyncHandler(async (req, res, next) => {
  const { slug } = req.params;
  const { page = 1, limit = 50, sort = "createdAt", order = "desc" } = req.query;

  const bundle = await prisma.bundleCampaign.findUnique({
    where: { slug },
    include: { rule: true },
  });

  if (!bundle || !bundle.rule) {
    throw new ApiError(404, "Bundle not found");
  }

  if (!bundle.isActive || !bundle.showOnWebsite) {
    throw new ApiError(404, "Bundle not found");
  }

  const rule = bundle.rule;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause from rules
  const where = {
    isActive: true,
    isDeleted: false,
  };

  const filterConditions = [];

  if (rule.categoryIds && rule.categoryIds.length > 0) {
    filterConditions.push({
      categories: {
        some: { categoryId: { in: rule.categoryIds } },
      },
    });
  }

  if (rule.subcategoryIds && rule.subcategoryIds.length > 0) {
    filterConditions.push({
      subCategories: {
        some: { subcategoryId: { in: rule.subcategoryIds } },
      },
    });
  }

  if (rule.brandIds && rule.brandIds.length > 0) {
    filterConditions.push({ brandId: { in: rule.brandIds } });
  }

  if (rule.attributeValueIds && rule.attributeValueIds.length > 0) {
    filterConditions.push({
      variants: {
        some: {
          attributeValues: {
            some: { attributeValueId: { in: rule.attributeValueIds } },
          },
        },
      },
    });
  }

  const conditions = [];
  const hasFilters = filterConditions.length > 0;

  if (rule.productIds && rule.productIds.length > 0) {
    conditions.push({ id: { in: rule.productIds } });
  } else if (hasFilters) {
    conditions.push(...filterConditions);
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  const total = await prisma.product.count({ where });

  const products = await prisma.product.findMany({
    where,
    include: {
      images: {
        where: { isPrimary: true },
        take: 1,
      },
      variants: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
          attributes: {
            include: {
              attributeValue: {
                include: { attribute: true },
              },
            },
          },
        },
      },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true } } },
      },
      brand: {
        select: { id: true, name: true, slug: true },
      },
    },
    skip,
    take: parseInt(limit),
    orderBy: { [sort]: order },
  });

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    images: p.images.map((img) => ({
      id: img.id,
      url: getFileUrl(img.url),
      alt: img.alt,
      isPrimary: img.isPrimary,
    })),
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      price: v.price,
      salePrice: v.salePrice,
      quantity: v.quantity,
      image: v.images[0] ? getFileUrl(v.images[0].url) : null,
      attributes: v.attributes.map((av) => ({
        attribute: av.attributeValue.attribute.name,
        value: av.attributeValue.value,
        hexCode: av.attributeValue.hexCode,
      })),
    })),
    categories: p.categories.map((c) => c.category),
    brand: p.brand,
    hasVariants: p.hasVariants,
  }));

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        products: formattedProducts,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Bundle products fetched successfully"
    )
  );
});
