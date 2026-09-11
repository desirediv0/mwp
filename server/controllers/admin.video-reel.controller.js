import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import { deleteFromS3, getFileUrl } from "../utils/deleteFromS3.js";
import { uploadVideo } from "../middlewares/multer.middlerware.js";

// Helper: format reel response
const formatReel = (reel) => ({
  ...reel,
  videoUrl: reel.videoUrl ? getFileUrl(reel.videoUrl) : null,
  products: reel.products?.map((rp) => ({
    ...rp,
    product: {
      ...rp.product,
      primaryImage: rp.product.images?.[0]?.url
        ? getFileUrl(rp.product.images[0].url)
        : null,
      price: rp.product.variants?.[0]?.price || null,
      salePrice: rp.product.variants?.[0]?.salePrice || null,
      hasVariants: rp.product.hasVariants || false,
      variantId: rp.product.variants?.[0]?.id || null,
    },
  })) || [],
});

// Get all video reels (admin)
export const getVideoReels = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 50,
    search = "",
    isActive,
    sort = "position",
    order = "asc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filterConditions = {
    ...(search && {
      title: { contains: search, mode: "insensitive" },
    }),
    ...(isActive !== undefined && {
      isActive: isActive === "true",
    }),
  };

  const total = await prisma.videoReel.count({ where: filterConditions });

  const reels = await prisma.videoReel.findMany({
    where: filterConditions,
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              variants: { take: 1 },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: [{ [sort]: order }, { createdAt: "desc" }],
    skip,
    take: parseInt(limit),
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        reels: reels.map(formatReel),
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
      "Video reels fetched successfully"
    )
  );
});

// Get video reel by ID (admin)
export const getVideoReelById = asyncHandler(async (req, res, next) => {
  const { reelId } = req.params;

  const reel = await prisma.videoReel.findUnique({
    where: { id: reelId },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              variants: { take: 1 },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!reel) {
    throw new ApiError(404, "Video reel not found");
  }

  res.status(200).json(
    new ApiResponsive(200, { reel: formatReel(reel) }, "Video reel fetched successfully")
  );
});

// Create video reel (admin) - position is ALWAYS auto-assigned
export const createVideoReel = asyncHandler(async (req, res, next) => {
  const { title, isActive, productIds } = req.body;

  if (!title) {
    throw new ApiError(400, "Title is required");
  }

  if (!req.files || !req.files.video || !req.files.video[0]) {
    throw new ApiError(400, "Video file is required");
  }

  // Upload video
  let videoKey;
  try {
    videoKey = await uploadVideo(req.files.video[0]);
  } catch (error) {
    throw new ApiError(400, "Failed to upload video: " + error.message);
  }

  // Auto-assign position (always next available)
  const maxPosition = await prisma.videoReel.findFirst({
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const reelPosition = maxPosition ? maxPosition.position + 1 : 0;

  // Parse product IDs
  const parsedProductIds = productIds
    ? typeof productIds === "string"
      ? JSON.parse(productIds)
      : productIds
    : [];

  const reel = await prisma.videoReel.create({
    data: {
      title,
      videoUrl: videoKey,
      position: reelPosition,
      isActive: isActive !== "false" && isActive !== false,
      products: {
        create: parsedProductIds.map((pid, index) => ({
          productId: pid,
          position: index,
        })),
      },
    },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              variants: { take: 1 },
            },
          },
        },
      },
    },
  });

  res.status(201).json(
    new ApiResponsive(201, { reel: formatReel(reel) }, "Video reel created successfully")
  );
});

// Update video reel (admin) - position reorder: if manual position set, shift others
export const updateVideoReel = asyncHandler(async (req, res, next) => {
  const { reelId } = req.params;
  const { title, position, isActive, productIds } = req.body;

  const existingReel = await prisma.videoReel.findUnique({
    where: { id: reelId },
  });

  if (!existingReel) {
    throw new ApiError(404, "Video reel not found");
  }

  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (isActive !== undefined)
    updateData.isActive = isActive === "true" || isActive === true;

  // Handle position update with reorder
  if (position !== undefined && position !== null && position !== "") {
    const newPosition = parseInt(position) || 0;
    const oldPosition = existingReel.position;

    if (newPosition !== oldPosition) {
      if (newPosition < oldPosition) {
        // Moving to earlier position: shift all between newPosition..oldPosition-1 UP by 1
        const reelsToShift = await prisma.videoReel.findMany({
          where: {
            position: { gte: newPosition, lt: oldPosition },
            id: { not: reelId },
          },
        });
        for (const r of reelsToShift) {
          await prisma.videoReel.update({
            where: { id: r.id },
            data: { position: r.position + 1 },
          });
        }
      } else {
        // Moving to later position: shift all between oldPosition+1..newPosition DOWN by 1
        const reelsToShift = await prisma.videoReel.findMany({
          where: {
            position: { gt: oldPosition, lte: newPosition },
            id: { not: reelId },
          },
        });
        for (const r of reelsToShift) {
          await prisma.videoReel.update({
            where: { id: r.id },
            data: { position: r.position - 1 },
          });
        }
      }
    }
    updateData.position = newPosition;
  }

  // Handle video reupload - delete old from S3
  if (req.files && req.files.video && req.files.video[0]) {
    if (existingReel.videoUrl) {
      await deleteFromS3(existingReel.videoUrl);
    }
    try {
      updateData.videoUrl = await uploadVideo(req.files.video[0]);
    } catch (error) {
      throw new ApiError(400, "Failed to upload video: " + error.message);
    }
  }

  // Update products if provided
  if (productIds !== undefined) {
    const parsedProductIds =
      typeof productIds === "string" ? JSON.parse(productIds) : productIds;

    await prisma.videoReelProduct.deleteMany({
      where: { videoReelId: reelId },
    });

    if (parsedProductIds.length > 0) {
      await prisma.videoReelProduct.createMany({
        data: parsedProductIds.map((pid, index) => ({
          videoReelId: reelId,
          productId: pid,
          position: index,
        })),
      });
    }
  }

  const reel = await prisma.videoReel.update({
    where: { id: reelId },
    data: updateData,
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              variants: { take: 1 },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  });

  res.status(200).json(
    new ApiResponsive(200, { reel: formatReel(reel) }, "Video reel updated successfully")
  );
});

// Delete video reel (admin) - delete from S3 storage + reorder
export const deleteVideoReel = asyncHandler(async (req, res, next) => {
  const { reelId } = req.params;

  const reel = await prisma.videoReel.findUnique({
    where: { id: reelId },
  });

  if (!reel) {
    throw new ApiError(404, "Video reel not found");
  }

  const deletedPosition = reel.position;

  // Delete video from S3 storage
  if (reel.videoUrl) {
    try {
      await deleteFromS3(reel.videoUrl);
    } catch (err) {
      console.error("Failed to delete video from S3:", err);
    }
  }

  // Delete reel (cascades to VideoReelProduct)
  await prisma.videoReel.delete({ where: { id: reelId } });

  // Reorder remaining reels - shift positions down
  const reelsToShift = await prisma.videoReel.findMany({
    where: { position: { gt: deletedPosition } },
  });

  for (const r of reelsToShift) {
    await prisma.videoReel.update({
      where: { id: r.id },
      data: { position: r.position - 1 },
    });
  }

  res.status(200).json(
    new ApiResponsive(200, null, "Video reel deleted successfully")
  );
});

// Toggle active status (admin)
export const toggleActiveVideoReel = asyncHandler(async (req, res, next) => {
  const { reelId } = req.params;

  const reel = await prisma.videoReel.findUnique({ where: { id: reelId } });

  if (!reel) {
    throw new ApiError(404, "Video reel not found");
  }

  const updatedReel = await prisma.videoReel.update({
    where: { id: reelId },
    data: { isActive: !reel.isActive },
  });

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        reel: {
          ...updatedReel,
          videoUrl: updatedReel.videoUrl ? getFileUrl(updatedReel.videoUrl) : null,
        },
      },
      `Video reel ${updatedReel.isActive ? "activated" : "deactivated"} successfully`
    )
  );
});

// Get active video reels (public)
export const getActiveVideoReels = asyncHandler(async (req, res, next) => {
  const reels = await prisma.videoReel.findMany({
    where: { isActive: true },
    include: {
      products: {
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              variants: { take: 1 },
            },
          },
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });

  const formattedReels = reels.map((reel) => ({
    id: reel.id,
    title: reel.title,
    videoUrl: reel.videoUrl ? getFileUrl(reel.videoUrl) : null,
    products: reel.products.map((rp) => {
      const primaryVariant = rp.product.variants?.[0];
      return {
        id: rp.product.id,
        name: rp.product.name,
        slug: rp.product.slug,
        hasVariants: rp.product.hasVariants || false,
        variantId: primaryVariant?.id || null,
        price: primaryVariant?.price || null,
        salePrice: primaryVariant?.salePrice || null,
        image: rp.product.images?.[0]?.url
          ? getFileUrl(rp.product.images[0].url)
          : null,
      };
    }),
  }));

  res.status(200).json(
    new ApiResponsive(
      200,
      { reels: formattedReels },
      "Active video reels fetched successfully"
    )
  );
});

// Get video reels for a specific product (for product form edit mode)
export const getVideoReelsByProductId = asyncHandler(async (req, res, next) => {
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product ID is required");
  }

  const videoReelProducts = await prisma.videoReelProduct.findMany({
    where: { productId },
    include: {
      videoReel: true,
    },
    orderBy: { position: "asc" },
  });

  const reels = videoReelProducts.map((vrp) => ({
    id: vrp.videoReel.id,
    title: vrp.videoReel.title,
    videoUrl: vrp.videoReel.videoUrl ? getFileUrl(vrp.videoReel.videoUrl) : null,
    rawVideoUrl: vrp.videoReel.videoUrl,
    position: vrp.position,
    isActive: vrp.videoReel.isActive,
    createdAt: vrp.videoReel.createdAt,
  }));

  res.status(200).json(
    new ApiResponsive(200, { reels }, "Video reels fetched successfully")
  );
});
