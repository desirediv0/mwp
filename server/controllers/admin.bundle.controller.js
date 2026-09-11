import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { getFileUrl, deleteFromS3 } from "../utils/deleteFromS3.js";
import { createSlug } from "../helper/Slug.js";

// Get all bundle campaigns (admin)
export const getBundleCampaigns = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    search = "",
    isActive,
    sort = "displayOrder",
    order = "asc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filterConditions = {
    isDeleted: false,
    ...(search && {
      title: { contains: search, mode: "insensitive" },
    }),
    ...(isActive !== undefined && {
      isActive: isActive === "true",
    }),
  };

  const total = await prisma.bundleCampaign.count({
    where: filterConditions,
  });

  const campaigns = await prisma.bundleCampaign.findMany({
    where: filterConditions,
    include: {
      rule: true,
      pricingSlabs: {
        orderBy: { itemCount: "asc" },
      },
      _count: {
        select: {
          cartItems: true,
          orderBundles: true,
        },
      },
    },
    orderBy: [{ [sort]: order }],
    skip,
    take: parseInt(limit),
  });

  const formatted = campaigns.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    description: c.description,
    banner: c.banner ? getFileUrl(c.banner) : null,
    bundleType: c.bundleType,
    isActive: c.isActive,
    startDate: c.startDate,
    endDate: c.endDate,
    displayOrder: c.displayOrder,
    showOnWebsite: c.showOnWebsite,
    discountType: c.discountType,
    bundlePrice: c.bundlePrice,
    metaTitle: c.metaTitle,
    metaDescription: c.metaDescription,
    rule: c.rule,
    pricingSlabs: c.pricingSlabs,
    cartItemCount: c._count.cartItems,
    orderBundleCount: c._count.orderBundles,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        campaigns: formatted,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Bundle campaigns fetched successfully"
    )
  );
});

// Get bundle campaign by ID (admin)
export const getBundleCampaignById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const campaign = await prisma.bundleCampaign.findUnique({
    where: { id },
    include: {
      rule: true,
      pricingSlabs: {
        orderBy: { itemCount: "asc" },
      },
    },
  });

  if (!campaign) {
    throw new ApiError(404, "Bundle campaign not found");
  }

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        id: campaign.id,
        title: campaign.title,
        slug: campaign.slug,
        description: campaign.description,
        banner: campaign.banner ? getFileUrl(campaign.banner) : null,
        bundleType: campaign.bundleType,
        isActive: campaign.isActive,
        startDate: campaign.startDate,
        endDate: campaign.endDate,
        displayOrder: campaign.displayOrder,
        showOnWebsite: campaign.showOnWebsite,
        discountType: campaign.discountType,
        bundlePrice: campaign.bundlePrice,
        metaTitle: campaign.metaTitle,
        metaDescription: campaign.metaDescription,
        rule: campaign.rule,
        pricingSlabs: campaign.pricingSlabs,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
      },
      "Bundle campaign fetched successfully"
    )
  );
});

// Create bundle campaign (admin)
export const createBundleCampaign = asyncHandler(async (req, res, next) => {
  const {
    title,
    description,
    bundleType = "CUSTOM",
    startDate,
    endDate,
    displayOrder = 0,
    showOnWebsite = true,
    discountType = "FIXED_PRICE",
    bundlePrice,
    metaTitle,
    metaDescription,
    rule,
    pricingSlabs = [],
    productIds,
    categoryIds,
    subcategoryIds,
    brandIds,
    attributeValueIds,
    minItems,
    maxItems,
  } = req.body;

  if (!title) {
    throw new ApiError(400, "Bundle title is required");
  }

  let parsedPricingSlabs = [];
  if (pricingSlabs) {
    if (typeof pricingSlabs === "string") {
      try {
        parsedPricingSlabs = JSON.parse(pricingSlabs);
      } catch (e) {
        parsedPricingSlabs = [];
      }
    } else if (Array.isArray(pricingSlabs)) {
      parsedPricingSlabs = pricingSlabs;
    }
  }

  let parsedRule = rule;
  if (rule) {
    if (typeof rule === "string") {
      try {
        parsedRule = JSON.parse(rule);
      } catch (e) {
        parsedRule = null;
      }
    }
  }

  const parseJsonArray = (val) => {
    if (!val) return null;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : null;
      } catch (e) {
        return null;
      }
    }
    return Array.isArray(val) ? val : null;
  };

  const finalProductIds = parseJsonArray(productIds) || (parsedRule && parseJsonArray(parsedRule.productIds)) || null;
  const finalCategoryIds = parseJsonArray(categoryIds) || (parsedRule && parseJsonArray(parsedRule.categoryIds)) || null;
  const finalSubcategoryIds = parseJsonArray(subcategoryIds) || (parsedRule && parseJsonArray(parsedRule.subcategoryIds)) || null;
  const finalBrandIds = parseJsonArray(brandIds) || (parsedRule && parseJsonArray(parsedRule.brandIds)) || null;
  const finalAttributeValueIds = parseJsonArray(attributeValueIds) || (parsedRule && parseJsonArray(parsedRule.attributeValueIds)) || null;

  const finalMinItems = parseInt(minItems || (parsedRule && parsedRule.minItems) || 2);
  const finalMaxItems = (maxItems || (parsedRule && parsedRule.maxItems)) ? parseInt(maxItems || (parsedRule && parsedRule.maxItems)) : null;

  const slug = createSlug(title);

  // Check slug uniqueness
  const existingSlug = await prisma.bundleCampaign.findUnique({
    where: { slug },
  });
  if (existingSlug) {
    throw new ApiError(400, "A bundle with similar title already exists");
  }

  // Handle banner upload
  let bannerPath = null;
  if (req.files && req.files.banner && req.files.banner[0]) {
    bannerPath = req.files.banner[0].key || req.files.banner[0].location;
  }

  const campaign = await prisma.$transaction(async (tx) => {
    const newCampaign = await tx.bundleCampaign.create({
      data: {
        title,
        slug,
        description,
        banner: bannerPath,
        bundleType,
        isActive: true,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        displayOrder: parseInt(displayOrder),
        showOnWebsite: showOnWebsite === "true" || showOnWebsite === true,
        discountType,
        bundlePrice: bundlePrice ? parseFloat(bundlePrice) : null,
        metaTitle,
        metaDescription,
      },
    });

    // Create rule
    if (finalProductIds || finalCategoryIds || finalSubcategoryIds || finalBrandIds || finalAttributeValueIds || parsedRule) {
      await tx.bundleRule.create({
        data: {
          bundleCampaignId: newCampaign.id,
          categoryIds: finalCategoryIds,
          subcategoryIds: finalSubcategoryIds,
          brandIds: finalBrandIds,
          attributeValueIds: finalAttributeValueIds,
          productIds: finalProductIds,
          minItems: finalMinItems,
          maxItems: finalMaxItems,
        },
      });
    }

    // Create pricing slabs
    if (parsedPricingSlabs && parsedPricingSlabs.length > 0) {
      await tx.bundlePricingSlab.createMany({
        data: parsedPricingSlabs.map((slab) => ({
          bundleCampaignId: newCampaign.id,
          itemCount: parseInt(slab.itemCount),
          price: parseFloat(slab.price),
          label: slab.label || null,
        })),
      });
    }

    return newCampaign;
  });

  // Fetch complete campaign with relations
  const completeCampaign = await prisma.bundleCampaign.findUnique({
    where: { id: campaign.id },
    include: {
      rule: true,
      pricingSlabs: { orderBy: { itemCount: "asc" } },
    },
  });

  res.status(201).json(
    new ApiResponsive(201, completeCampaign, "Bundle campaign created successfully")
  );
});

// Update bundle campaign (admin)
export const updateBundleCampaign = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const {
    title,
    description,
    bundleType,
    startDate,
    endDate,
    displayOrder,
    showOnWebsite,
    discountType,
    bundlePrice,
    metaTitle,
    metaDescription,
    rule,
    pricingSlabs,
    productIds,
    categoryIds,
    subcategoryIds,
    brandIds,
    attributeValueIds,
    minItems,
    maxItems,
  } = req.body;

  let parsedPricingSlabs = pricingSlabs;
  if (pricingSlabs !== undefined) {
    if (typeof pricingSlabs === "string") {
      try {
        parsedPricingSlabs = JSON.parse(pricingSlabs);
      } catch (e) {
        parsedPricingSlabs = [];
      }
    }
  }

  let parsedRule = rule;
  if (rule !== undefined) {
    if (typeof rule === "string") {
      try {
        parsedRule = JSON.parse(rule);
      } catch (e) {
        parsedRule = undefined;
      }
    }
  }

  const parseJsonArray = (val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch (e) {
        return undefined;
      }
    }
    return Array.isArray(val) ? val : undefined;
  };

  const finalProductIds = parseJsonArray(productIds) !== undefined ? parseJsonArray(productIds) : (parsedRule && parseJsonArray(parsedRule.productIds));
  const finalCategoryIds = parseJsonArray(categoryIds) !== undefined ? parseJsonArray(categoryIds) : (parsedRule && parseJsonArray(parsedRule.categoryIds));
  const finalSubcategoryIds = parseJsonArray(subcategoryIds) !== undefined ? parseJsonArray(subcategoryIds) : (parsedRule && parseJsonArray(parsedRule.subcategoryIds));
  const finalBrandIds = parseJsonArray(brandIds) !== undefined ? parseJsonArray(brandIds) : (parsedRule && parseJsonArray(parsedRule.brandIds));
  const finalAttributeValueIds = parseJsonArray(attributeValueIds) !== undefined ? parseJsonArray(attributeValueIds) : (parsedRule && parseJsonArray(parsedRule.attributeValueIds));

  const finalMinItems = minItems !== undefined ? parseInt(minItems) : (parsedRule && parsedRule.minItems !== undefined ? parseInt(parsedRule.minItems) : undefined);
  const finalMaxItems = maxItems !== undefined ? (maxItems ? parseInt(maxItems) : null) : (parsedRule && parsedRule.maxItems !== undefined ? (parsedRule.maxItems ? parseInt(parsedRule.maxItems) : null) : undefined);

  const existingCampaign = await prisma.bundleCampaign.findUnique({
    where: { id },
  });

  if (!existingCampaign) {
    throw new ApiError(404, "Bundle campaign not found");
  }

  // Handle banner upload
  let bannerPath = existingCampaign.banner;
  if (req.files && req.files.banner && req.files.banner[0]) {
    // Delete old banner
    if (existingCampaign.banner) {
      await deleteFromS3(existingCampaign.banner).catch(() => {});
    }
    bannerPath = req.files.banner[0].key || req.files.banner[0].location;
  }

  // Check slug uniqueness if title changed
  let slug = existingCampaign.slug;
  if (title && title !== existingCampaign.title) {
    slug = createSlug(title);
    const existingSlug = await prisma.bundleCampaign.findFirst({
      where: { slug, id: { not: id } },
    });
    if (existingSlug) {
      throw new ApiError(400, "A bundle with similar title already exists");
    }
  }

  const updatedCampaign = await prisma.$transaction(async (tx) => {
    const updated = await tx.bundleCampaign.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(title && { slug }),
        ...(description !== undefined && { description }),
        ...(bundleType && { bundleType }),
        ...(bannerPath !== undefined && { banner: bannerPath }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(displayOrder !== undefined && {
          displayOrder: parseInt(displayOrder),
        }),
        ...(showOnWebsite !== undefined && { showOnWebsite: showOnWebsite === "true" || showOnWebsite === true }),
        ...(discountType && { discountType }),
        ...(bundlePrice !== undefined && {
          bundlePrice: bundlePrice ? parseFloat(bundlePrice) : null,
        }),
        ...(metaTitle !== undefined && { metaTitle }),
        ...(metaDescription !== undefined && { metaDescription }),
      },
    });

    // Update or create rule
    if (finalProductIds !== undefined || finalCategoryIds !== undefined || finalSubcategoryIds !== undefined || finalBrandIds !== undefined || finalAttributeValueIds !== undefined || finalMinItems !== undefined || finalMaxItems !== undefined || parsedRule) {
      await tx.bundleRule.upsert({
        where: { bundleCampaignId: id },
        create: {
          bundleCampaignId: id,
          categoryIds: finalCategoryIds !== undefined ? finalCategoryIds : null,
          subcategoryIds: finalSubcategoryIds !== undefined ? finalSubcategoryIds : null,
          brandIds: finalBrandIds !== undefined ? finalBrandIds : null,
          attributeValueIds: finalAttributeValueIds !== undefined ? finalAttributeValueIds : null,
          productIds: finalProductIds !== undefined ? finalProductIds : null,
          minItems: finalMinItems !== undefined ? finalMinItems : 2,
          maxItems: finalMaxItems !== undefined ? finalMaxItems : null,
        },
        update: {
          ...(finalCategoryIds !== undefined && { categoryIds: finalCategoryIds }),
          ...(finalSubcategoryIds !== undefined && { subcategoryIds: finalSubcategoryIds }),
          ...(finalBrandIds !== undefined && { brandIds: finalBrandIds }),
          ...(finalAttributeValueIds !== undefined && { attributeValueIds: finalAttributeValueIds }),
          ...(finalProductIds !== undefined && { productIds: finalProductIds }),
          ...(finalMinItems !== undefined && { minItems: finalMinItems }),
          ...(finalMaxItems !== undefined && { maxItems: finalMaxItems }),
        },
      });
    }

    // Update pricing slabs - delete existing and recreate
    if (parsedPricingSlabs !== undefined) {
      await tx.bundlePricingSlab.deleteMany({
        where: { bundleCampaignId: id },
      });
      if (parsedPricingSlabs && parsedPricingSlabs.length > 0) {
        await tx.bundlePricingSlab.createMany({
          data: parsedPricingSlabs.map((slab) => ({
            bundleCampaignId: id,
            itemCount: parseInt(slab.itemCount),
            price: parseFloat(slab.price),
            label: slab.label || null,
          })),
        });
      }
    }

    return updated;
  });

  // Fetch complete updated campaign
  const completeCampaign = await prisma.bundleCampaign.findUnique({
    where: { id },
    include: {
      rule: true,
      pricingSlabs: { orderBy: { itemCount: "asc" } },
    },
  });

  res.status(200).json(
    new ApiResponsive(200, completeCampaign, "Bundle campaign updated successfully")
  );
});

// Delete bundle campaign (admin)
export const deleteBundleCampaign = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const campaign = await prisma.bundleCampaign.findUnique({
    where: { id },
    include: {
      _count: { select: { orderBundles: true } },
    },
  });

  if (!campaign) {
    throw new ApiError(404, "Bundle campaign not found");
  }

  const orderCount = campaign._count.orderBundles;

  // Soft delete - never hard delete bundles referenced by orders
  await prisma.bundleCampaign.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: req.user?.id || null,
      isActive: false,
    },
  });

  const message = orderCount > 0
    ? `Bundle archived. It exists in ${orderCount} order(s) and cannot be permanently deleted.`
    : "Bundle campaign archived successfully.";

  res
    .status(200)
    .json(new ApiResponsive(200, { orderCount }, message));
});

// Toggle bundle campaign status (admin)
export const toggleBundleCampaignStatus = asyncHandler(
  async (req, res, next) => {
    const { id } = req.params;

    const campaign = await prisma.bundleCampaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      throw new ApiError(404, "Bundle campaign not found");
    }

    const updated = await prisma.bundleCampaign.update({
      where: { id },
      data: { isActive: !campaign.isActive },
    });

    res.status(200).json(
      new ApiResponsive(
        200,
        { isActive: updated.isActive },
        `Bundle campaign ${updated.isActive ? "activated" : "deactivated"} successfully`
      )
    );
  }
);

// Duplicate bundle campaign (admin)
export const duplicateBundleCampaign = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const source = await prisma.bundleCampaign.findUnique({
    where: { id },
    include: {
      rule: true,
      pricingSlabs: true,
    },
  });

  if (!source) {
    throw new ApiError(404, "Bundle campaign not found");
  }

  const newSlug = createSlug(`${source.title} - Copy`);
  const newTitle = `${source.title} - Copy`;

  const duplicated = await prisma.$transaction(async (tx) => {
    const newCampaign = await tx.bundleCampaign.create({
      data: {
        title: newTitle,
        slug: newSlug,
        description: source.description,
        banner: source.banner,
        bundleType: source.bundleType,
        isActive: false,
        startDate: source.startDate,
        endDate: source.endDate,
        displayOrder: source.displayOrder + 1,
        showOnWebsite: source.showOnWebsite,
        discountType: source.discountType,
        bundlePrice: source.bundlePrice,
        metaTitle: source.metaTitle,
        metaDescription: source.metaDescription,
      },
    });

    if (source.rule) {
      await tx.bundleRule.create({
        data: {
          bundleCampaignId: newCampaign.id,
          categoryIds: source.rule.categoryIds,
          subcategoryIds: source.rule.subcategoryIds,
          brandIds: source.rule.brandIds,
          attributeValueIds: source.rule.attributeValueIds,
          productIds: source.rule.productIds,
          minItems: source.rule.minItems,
          maxItems: source.rule.maxItems,
        },
      });
    }

    if (source.pricingSlabs.length > 0) {
      await tx.bundlePricingSlab.createMany({
        data: source.pricingSlabs.map((slab) => ({
          bundleCampaignId: newCampaign.id,
          itemCount: slab.itemCount,
          price: slab.price,
          label: slab.label,
        })),
      });
    }

    return newCampaign;
  });

  const completeCampaign = await prisma.bundleCampaign.findUnique({
    where: { id: duplicated.id },
    include: {
      rule: true,
      pricingSlabs: { orderBy: { itemCount: "asc" } },
    },
  });

  res.status(201).json(
    new ApiResponsive(201, completeCampaign, "Bundle campaign duplicated successfully")
  );
});

// Preview products matching bundle rules (admin)
export const previewBundleProducts = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const campaign = await prisma.bundleCampaign.findUnique({
    where: { id },
    include: { rule: true },
  });

  if (!campaign || !campaign.rule) {
    throw new ApiError(404, "Bundle campaign or rule not found");
  }

  const rule = campaign.rule;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build where clause from rules
  const where = {
    isActive: true,
  };

  const conditions = [];

  // Filter by specific product IDs
  if (rule.productIds && rule.productIds.length > 0) {
    conditions.push({ id: { in: rule.productIds } });
  }

  // Filter by categories
  if (rule.categoryIds && rule.categoryIds.length > 0) {
    conditions.push({
      categories: {
        some: { categoryId: { in: rule.categoryIds } },
      },
    });
  }

  // Filter by subcategories
  if (rule.subcategoryIds && rule.subcategoryIds.length > 0) {
    conditions.push({
      subCategories: {
        some: { subcategoryId: { in: rule.subcategoryIds } },
      },
    });
  }

  // Filter by brands
  if (rule.brandIds && rule.brandIds.length > 0) {
    conditions.push({ brandId: { in: rule.brandIds } });
  }

  // Filter by attribute values (through variants)
  if (rule.attributeValueIds && rule.attributeValueIds.length > 0) {
    conditions.push({
      variants: {
        some: {
          attributeValues: {
            some: { attributeValueId: { in: rule.attributeValueIds } },
          },
        },
      },
    });
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
        take: 1,
        select: {
          id: true,
          price: true,
          salePrice: true,
          sku: true,
        },
      },
      categories: {
        include: { category: { select: { id: true, name: true } } },
      },
      brand: {
        select: { id: true, name: true },
      },
    },
    skip,
    take: parseInt(limit),
    orderBy: { createdAt: "desc" },
  });

  const formattedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images[0] ? getFileUrl(p.images[0].url) : null,
    price: p.variants[0]?.salePrice || p.variants[0]?.price || null,
    brand: p.brand,
    categories: p.categories.map((c) => c.category),
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
      "Bundle products preview fetched successfully"
    )
  );
});

// Get bundle analytics (admin)
export const getBundleAnalytics = asyncHandler(async (req, res, next) => {
  const totalCampaigns = await prisma.bundleCampaign.count();
  const activeCampaigns = await prisma.bundleCampaign.count({
    where: { isActive: true },
  });

  const bundleOrders = await prisma.orderBundle.groupBy({
    by: ["bundleCampaignId"],
    _count: { id: true },
    _sum: { bundlePrice: true, actualPrice: true, savings: true },
    orderBy: { _count: { id: "desc" } },
  });

  // Get campaign details for each
  const campaignIds = bundleOrders
    .map((o) => o.bundleCampaignId)
    .filter(Boolean);
  const campaigns = await prisma.bundleCampaign.findMany({
    where: { id: { in: campaignIds } },
    select: { id: true, title: true, slug: true },
  });
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  const bundleAnalytics = bundleOrders.map((o) => ({
    campaign: campaignMap.get(o.bundleCampaignId) || null,
    orderCount: o._count.id,
    totalRevenue: o._sum.bundlePrice,
    totalActualPrice: o._sum.actualPrice,
    totalSavings: o._sum.savings,
  }));

  const totalBundleRevenue = await prisma.orderBundle.aggregate({
    _sum: { bundlePrice: true },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        totalCampaigns,
        activeCampaigns,
        totalBundleOrders: bundleOrders.reduce(
          (acc, o) => acc + o._count.id,
          0
        ),
        totalBundleRevenue: totalBundleRevenue._sum.bundlePrice || 0,
        topBundles: bundleAnalytics,
      },
      "Bundle analytics fetched successfully"
    )
  );
});
