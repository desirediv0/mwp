import { prisma } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import s3client from "../utils/s3client.js";
import { deleteFromS3, getFileUrl } from "../utils/deleteFromS3.js";
import { v4 as uuidv4 } from "uuid";

// Helper to get products for a section slug
const getProductsForSection = async (slug, maxProducts = 15) => {
  let products = [];
  try {
    const section = await prisma.productSection.findFirst({
      where: {
        slug: {
          equals: slug,
          mode: "insensitive",
        },
      },
    });

    if (section) {
      // 1. Fetch matching products from the Product table
      let dbProducts = [];
      if (slug === "latest") {
        dbProducts = await prisma.product.findMany({
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          take: maxProducts,
        });
      } else {
        dbProducts = await prisma.product.findMany({
          where: {
            isActive: true,
            productType: {
              array_contains: [slug],
            },
          },
          orderBy: { createdAt: "desc" },
          take: maxProducts,
        });
      }

      // 2. Fetch existing section items
      const existingItems = await prisma.productSectionItem.findMany({
        where: { productSectionId: section.id },
      });

      const existingProductIds = new Set(existingItems.map(item => item.productId));

      // 3. For any checked products that aren't in the join table, insert them with order
      let maxOrder = existingItems.reduce((max, item) => Math.max(max, item.displayOrder), -1);
      const newItemsToCreate = dbProducts.filter(p => !existingProductIds.has(p.id));

      if (newItemsToCreate.length > 0) {
        const createPromises = newItemsToCreate.map((p, idx) =>
          prisma.productSectionItem.create({
            data: {
              productSectionId: section.id,
              productId: p.id,
              displayOrder: maxOrder + 1 + idx,
            },
          })
        );
        await Promise.all(createPromises);
      }

      // 4. Finally, fetch all items sorted by displayOrder
      const sectionItems = await prisma.productSectionItem.findMany({
        where: {
          productSectionId: section.id,
          product: { isActive: true },
        },
        orderBy: { displayOrder: "asc" },
        include: {
          product: {
            include: {
              images: true,
              variants: { where: { isActive: true } },
            },
          },
        },
      });

      products = sectionItems.map(item => item.product);
    }
  } catch (err) {
    console.error(`Error querying products for section slug ${slug}:`, err);
  }
  return products;
};

// Get all product sections
export const getAllProductSections = asyncHandler(async (req, res, next) => {
  // Auto-seed default sections if missing
  try {
    const defaults = [
      { name: "Featured Collections", slug: "featured", description: "Handpicked handcrafted jewellery pieces selected for your style", color: "bg-blue-500", displayOrder: 1 },
      { name: "Latest Additions", slug: "latest", description: "Newly added premium jewellery collections", color: "bg-green-500", displayOrder: 2 },
      { name: "Best Sellers", slug: "bestseller", description: "Our most popular jewellery designs loved by clients across India", color: "bg-yellow-500", displayOrder: 3 },
      { name: "Trending Now", slug: "trending", description: "Most loved and trending handmade designs and accessories this week", color: "bg-purple-500", displayOrder: 4 },
      { name: "New Arrivals", slug: "new", description: "Fresh handcrafted creations added to our gallery", color: "bg-pink-500", displayOrder: 5 },
    ];

    for (const s of defaults) {
      const existing = await prisma.productSection.findUnique({
        where: { slug: s.slug }
      });
      if (!existing) {
        await prisma.productSection.create({
          data: {
            name: s.name,
            slug: s.slug,
            description: s.description,
            color: s.color,
            displayOrder: s.displayOrder,
            isActive: true
          }
        });
      }
    }
  } catch (seedErr) {
    console.error("Error dynamically seeding default sections:", seedErr);
  }

  const sections = await prisma.productSection.findMany({
    orderBy: { displayOrder: "asc" },
  });

  const formattedSections = await Promise.all(
    sections.map(async (section) => {
      const sectionProducts = await getProductsForSection(section.slug, section.maxProducts);
      const items = sectionProducts.map((product, index) => {
        const firstVariant = product.variants[0];
        const formattedImages = product.images.map((img) => ({
          ...img,
          url: getFileUrl(img.url),
        }));
        return {
          id: `${section.id}-${product.id}`,
          productId: product.id,
          displayOrder: index,
          product: {
            ...product,
            price: firstVariant ? parseFloat(firstVariant.price) : 0,
            salePrice: firstVariant?.salePrice ? parseFloat(firstVariant.salePrice) : null,
            images: formattedImages.filter((img) => img.isPrimary).slice(0, 1),
            variants: product.variants.slice(0, 1),
          },
        };
      });
      return {
        ...section,
        image: section.image ? getFileUrl(section.image) : null,
        items,
      };
    })
  );

  res
    .status(200)
    .json(
      new ApiResponsive(200, { sections: formattedSections }, "Product sections fetched successfully")
    );
});

// Get product section by ID
export const getProductSectionById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const section = await prisma.productSection.findUnique({
    where: { id },
  });

  if (!section) {
    throw new ApiError(404, "Product section not found");
  }

  const sectionProducts = await getProductsForSection(section.slug, section.maxProducts);
  const items = sectionProducts.map((product, index) => {
    const firstVariant = product.variants[0];
    const formattedImages = product.images.map((img) => ({
      ...img,
      url: getFileUrl(img.url),
    }));
    return {
      id: `${section.id}-${product.id}`,
      productId: product.id,
      displayOrder: index,
      product: {
        ...product,
        price: firstVariant ? parseFloat(firstVariant.price) : 0,
        salePrice: firstVariant?.salePrice ? parseFloat(firstVariant.salePrice) : null,
        images: formattedImages,
        variants: product.variants,
      },
    };
  });

  const formattedSection = {
    ...section,
    image: section.image ? getFileUrl(section.image) : null,
    items,
  };

  res
    .status(200)
    .json(
      new ApiResponsive(200, { section: formattedSection }, "Product section fetched successfully")
    );
});

// Create product section
export const createProductSection = asyncHandler(async (req, res, next) => {
  const { name, slug, description, icon, color, displayOrder, maxProducts } =
    req.body;

  if (!name || !slug) {
    throw new ApiError(400, "Name and slug are required");
  }

  // Check if slug already exists
  const existingSection = await prisma.productSection.findUnique({
    where: { slug },
  });

  if (existingSection) {
    throw new ApiError(400, "Section with this slug already exists");
  }

  let imageKey = null;

  // Upload image to S3 if provided
  if (req.file) {
    imageKey = `${process.env.UPLOAD_FOLDER}/sections/${uuidv4()}-${req.file.originalname.replace(/\s+/g, "-")}`;

    await s3client.send(
      new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: "public-read",
      })
    );
  }

  const section = await prisma.productSection.create({
    data: {
      name,
      slug,
      description,
      icon,
      color,
      image: imageKey,
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      maxProducts: maxProducts ? parseInt(maxProducts) : 15,
    },
  });

  res
    .status(201)
    .json(
      new ApiResponsive(201, { section: { ...section, image: imageKey ? getFileUrl(imageKey) : null } }, "Product section created successfully")
    );
});

// Update product section
export const updateProductSection = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { name, slug, description, icon, color, displayOrder, maxProducts, isActive } =
    req.body;

  const existingSection = await prisma.productSection.findUnique({
    where: { id },
  });

  if (!existingSection) {
    throw new ApiError(404, "Product section not found");
  }

  // Check if slug is being changed and if it already exists
  if (slug && slug !== existingSection.slug) {
    const slugExists = await prisma.productSection.findUnique({
      where: { slug },
    });
    if (slugExists) {
      throw new ApiError(400, "Section with this slug already exists");
    }
  }

  // Handle image update
  let imageKey = existingSection.image;

  if (req.file) {
    // Delete old image if it exists
    if (existingSection.image) {
      await deleteFromS3(existingSection.image).catch((err) =>
        console.error("Error deleting old section image:", err)
      );
    }

    // Upload new image
    imageKey = `${process.env.UPLOAD_FOLDER}/sections/${uuidv4()}-${req.file.originalname.replace(/\s+/g, "-")}`;

    await s3client.send(
      new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: imageKey,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        ACL: "public-read",
      })
    );
  }

  const section = await prisma.productSection.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(slug && { slug }),
      ...(description !== undefined && { description }),
      ...(icon !== undefined && { icon }),
      ...(color !== undefined && { color }),
      image: imageKey,
      ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
      ...(maxProducts !== undefined && { maxProducts: parseInt(maxProducts) }),
      ...(isActive !== undefined && { isActive: isActive === "true" || isActive === true }),
    },
  });

  res
    .status(200)
    .json(
      new ApiResponsive(200, { section: { ...section, image: imageKey ? getFileUrl(imageKey) : null } }, "Product section updated successfully")
    );
});

// Delete product section
export const deleteProductSection = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const section = await prisma.productSection.findUnique({
    where: { id },
  });

  if (!section) {
    throw new ApiError(404, "Product section not found");
  }

  // Delete image from S3 if it exists
  if (section.image) {
    await deleteFromS3(section.image).catch((err) =>
      console.error("Error deleting section image:", err)
    );
  }

  await prisma.productSection.delete({
    where: { id },
  });

  res
    .status(200)
    .json(new ApiResponsive(200, null, "Product section deleted successfully"));
});

// Add product to section
export const addProductToSection = asyncHandler(async (req, res, next) => {
  const { sectionId } = req.params;
  const { productId, displayOrder } = req.body;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  // Check if section exists and get maxProducts
  const section = await prisma.productSection.findUnique({
    where: { id: sectionId },
    include: {
      items: true,
    },
  });

  if (!section) {
    throw new ApiError(404, "Product section not found");
  }

  // Check if product is already in section
  const existingItem = await prisma.productSectionItem.findUnique({
    where: {
      productSectionId_productId: {
        productSectionId: sectionId,
        productId,
      },
    },
  });

  if (existingItem) {
    throw new ApiError(400, "Product is already in this section");
  }

  // Check if section has reached maxProducts limit
  if (section.items.length >= section.maxProducts) {
    throw new ApiError(
      400,
      `Section has reached maximum limit of ${section.maxProducts} products`
    );
  }

  // Check if product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    throw new ApiError(404, "Product not found");
  }

  const item = await prisma.productSectionItem.create({
    data: {
      productSectionId: sectionId,
      productId,
      displayOrder: displayOrder || section.items.length,
    },
    include: {
      product: {
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, take: 1 },
        },
      },
    },
  });

  res
    .status(201)
    .json(
      new ApiResponsive(201, { item }, "Product added to section successfully")
    );
});

// Remove product from section
export const removeProductFromSection = asyncHandler(async (req, res, next) => {
  const { sectionId, productId } = req.params;

  const item = await prisma.productSectionItem.findUnique({
    where: {
      productSectionId_productId: {
        productSectionId: sectionId,
        productId,
      },
    },
  });

  if (!item) {
    throw new ApiError(404, "Product not found in this section");
  }

  await prisma.productSectionItem.delete({
    where: {
      productSectionId_productId: {
        productSectionId: sectionId,
        productId,
      },
    },
  });

  res
    .status(200)
    .json(
      new ApiResponsive(200, null, "Product removed from section successfully")
    );
});

// Update product order in section
export const updateProductOrderInSection = asyncHandler(
  async (req, res, next) => {
    const { sectionId } = req.params;
    const { productOrders } = req.body; // Array of { productId, displayOrder }

    if (!Array.isArray(productOrders)) {
      throw new ApiError(400, "productOrders must be an array");
    }

    // Update all product orders via upsert to handle dynamic products
    const updatePromises = productOrders.map(({ productId, displayOrder }) =>
      prisma.productSectionItem.upsert({
        where: {
          productSectionId_productId: {
            productSectionId: sectionId,
            productId,
          },
        },
        create: {
          productSectionId: sectionId,
          productId,
          displayOrder,
        },
        update: {
          displayOrder,
        },
      })
    );

    await Promise.all(updatePromises);

    res
      .status(200)
      .json(
        new ApiResponsive(
          200,
          null,
          "Product order updated successfully"
        )
      );
  }
);








