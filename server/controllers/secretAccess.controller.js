import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import crypto from "crypto";
import { getSecretAccessEmailTemplate } from "../email/temp/EmailTemplate.js";
import sendEmail from "../utils/sendEmail.js";

/* ─── Helpers ───────────────────────────────────────────────────────── */

function generateDisplayCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [];
  segments.push("RH");
  for (let s = 0; s < 3; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  return segments.join("-");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRawToken() {
  return crypto.randomBytes(32).toString("hex");
}

/* ─── Admin: Get pending eligible orders ────────────────────────────── */
export const getPendingOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    status: { in: ["PAID", "DELIVERED"] },
    secretAccess: { none: {} },
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: {
              select: { id: true, name: true, slug: true, visibility: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit),
    }),
    prisma.order.count({ where }),
  ]);

  const eligible = orders.filter((o) =>
    o.items.some((i) => i.product.visibility === "SECRET")
  );

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        orders: eligible,
        total: eligible.length,
        page: parseInt(page),
        limit: parseInt(limit),
      },
      "Pending orders fetched"
    )
  );
});

/* ─── Admin: Grant Secret Collection Access ─────────────────────────── */
export const grantAccess = asyncHandler(async (req, res) => {
  const { orderId, email, usageLimit = 1, expiryDays = 7 } = req.body;

  if (!orderId || !email) {
    throw new ApiError(400, "Order ID and email are required");
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: { select: { id: true, name: true, visibility: true } },
        },
      },
    },
  });

  if (!order) throw new ApiError(404, "Order not found");

  const hasSecret = order.items.some(
    (i) => i.product.visibility === "SECRET"
  );
  if (!hasSecret) {
    throw new ApiError(400, "This order does not contain Secret Collection products");
  }

  const existing = await prisma.secretAccess.findFirst({
    where: { orderId },
  });
  if (existing) {
    throw new ApiError(400, "Secret Collection access already granted for this order");
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const displayCode = generateDisplayCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(expiryDays));

  const secretAccess = await prisma.secretAccess.create({
    data: {
      userId: order.userId,
      orderId,
      email,
      displayCode,
      tokenHash,
      status: "PENDING",
      usageLimit: parseInt(usageLimit),
      expiresAt,
      createdByAdmin: req.admin?.id || null,
    },
  });

  // Send premium email
  try {
    const activationUrl = `${process.env.CLIENT_URL || "https://www.mwpsupplements.com"}/secret-access?token=${rawToken}`;
    const html = getSecretAccessEmailTemplate({
      customerName: order.user?.name || "Valued Client",
      displayCode,
      activationUrl,
      orderNumber: order.orderNumber,
      expiryDate: expiresAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    });

    await sendEmail({
      email,
      subject: "Your MWP SUPPLEMENTS Secret Collection Access",
      html,
    });

    await prisma.secretAccess.update({
      where: { id: secretAccess.id },
      data: { lastUsedAt: new Date() },
    });
  } catch (emailErr) {
    console.error("Failed to send secret access email:", emailErr);
  }

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        id: secretAccess.id,
        displayCode,
        activationUrl: `${process.env.CLIENT_URL || "https://www.mwpsupplements.com"}/secret-access?token=${rawToken}`,
        expiresAt,
      },
      "Secret Collection access granted"
    )
  );
});

/* ─── Admin: List all Secret Access records ─────────────────────────── */
export const listAccess = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    search = "",
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where = {
    ...(status && { status }),
    ...(search && {
      OR: [
        { email: { contains: search, mode: "insensitive" } },
        { displayCode: { contains: search, mode: "insensitive" } },
      ],
    }),
  };

  const [records, total] = await Promise.all([
    prisma.secretAccess.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true, total: true } },
      },
      orderBy: { [sort]: order },
      skip,
      take: parseInt(limit),
    }),
    prisma.secretAccess.count({ where }),
  ]);

  return res.status(200).json(
    new ApiResponsive(
      200,
      { records, total, page: parseInt(page), limit: parseInt(limit) },
      "Secret Access records fetched"
    )
  );
});

/* ─── Admin: Get single access record ───────────────────────────────── */
export const getAccessById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await prisma.secretAccess.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!record) throw new ApiError(404, "Secret Access record not found");

  return res.status(200).json(
    new ApiResponsive(200, record, "Secret Access record fetched")
  );
});

/* ─── Admin: Revoke access ──────────────────────────────────────────── */
export const revokeAccess = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const record = await prisma.secretAccess.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Secret Access record not found");

  if (record.status === "REVOKED") {
    throw new ApiError(400, "Access is already revoked");
  }

  await prisma.secretAccess.update({
    where: { id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedByAdmin: req.admin?.id || null,
      revokedReason: reason || null,
    },
  });

  return res.status(200).json(
    new ApiResponsive(200, {}, "Secret Collection access revoked")
  );
});

/* ─── Admin: Reactivate access ──────────────────────────────────────── */
export const reactivateAccess = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await prisma.secretAccess.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Secret Access record not found");

  if (record.status !== "REVOKED") {
    throw new ApiError(400, "Only revoked access can be reactivated");
  }

  if (new Date(record.expiresAt) < new Date()) {
    throw new ApiError(400, "Access has expired. Extend expiry first.");
  }

  await prisma.secretAccess.update({
    where: { id },
    data: {
      status: record.usageCount > 0 ? "USED" : "PENDING",
      revokedAt: null,
      revokedByAdmin: null,
      revokedReason: null,
    },
  });

  return res.status(200).json(
    new ApiResponsive(200, {}, "Secret Collection access reactivated")
  );
});

/* ─── Admin: Extend expiry ──────────────────────────────────────────── */
export const extendExpiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { expiryDays } = req.body;

  if (!expiryDays || expiryDays < 1) {
    throw new ApiError(400, "expiryDays is required and must be >= 1");
  }

  const record = await prisma.secretAccess.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Secret Access record not found");

  const newExpiry = new Date();
  newExpiry.setDate(newExpiry.getDate() + parseInt(expiryDays));

  await prisma.secretAccess.update({
    where: { id },
    data: { expiresAt: newExpiry },
  });

  return res.status(200).json(
    new ApiResponsive(200, { expiresAt: newExpiry }, "Expiry extended")
  );
});

/* ─── Admin: Increase usage limit ───────────────────────────────────── */
export const increaseUsageLimit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { usageLimit } = req.body;

  if (!usageLimit || usageLimit < 1) {
    throw new ApiError(400, "usageLimit is required and must be >= 1");
  }

  const record = await prisma.secretAccess.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Secret Access record not found");

  await prisma.secretAccess.update({
    where: { id },
    data: { usageLimit: parseInt(usageLimit) },
  });

  return res.status(200).json(
    new ApiResponsive(200, {}, "Usage limit updated")
  );
});

/* ─── Admin: Resend email ───────────────────────────────────────────── */
export const resendEmail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await prisma.secretAccess.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
      order: { select: { orderNumber: true } },
    },
  });
  if (!record) throw new ApiError(404, "Secret Access record not found");

  if (record.status === "REVOKED") {
    throw new ApiError(400, "Cannot resend email for revoked access");
  }

  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);

  await prisma.secretAccess.update({
    where: { id },
    data: { tokenHash },
  });

  const activationUrl = `${process.env.CLIENT_URL || "https://www.mwpsupplements.com"}/secret-access?token=${rawToken}`;
  const html = getSecretAccessEmailTemplate({
    customerName: record.user?.name || "Valued Client",
    displayCode: record.displayCode,
    activationUrl,
    orderNumber: record.order?.orderNumber || "N/A",
    expiryDate: new Date(record.expiresAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  });

  await sendEmail({
    email: record.email,
    subject: "Your MWP SUPPLEMENTS Secret Collection Access",
    html,
  });

  return res.status(200).json(
    new ApiResponsive(200, {}, "Email resent successfully")
  );
});

/* ─── Admin: Dashboard stats ────────────────────────────────────────── */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();

  const [total, pending, active, used, revoked, expired] = await Promise.all([
    prisma.secretAccess.count(),
    prisma.secretAccess.count({ where: { status: "PENDING" } }),
    prisma.secretAccess.count({ where: { status: "ACTIVE" } }),
    prisma.secretAccess.count({ where: { status: "USED" } }),
    prisma.secretAccess.count({ where: { status: "REVOKED" } }),
    prisma.secretAccess.count({
      where: { expiresAt: { lt: now }, status: { notIn: ["REVOKED", "EXPIRED"] } },
    }),
  ]);

  const totalActivations = await prisma.secretAccess.aggregate({
    _sum: { usageCount: true },
  });

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        total,
        pending,
        active,
        used,
        revoked,
        expired,
        totalActivations: totalActivations._sum.usageCount || 0,
      },
      "Dashboard stats fetched"
    )
  );
});

/* ─── User: Activate Secret Collection ──────────────────────────────── */
export const activateAccess = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user.id;

  if (!token) throw new ApiError(400, "Activation token is required");

  const tokenHash = hashToken(token);

  const record = await prisma.secretAccess.findUnique({
    where: { tokenHash },
  });

  if (!record) {
    throw new ApiError(404, "Invalid activation token");
  }

  if (record.status === "REVOKED") {
    throw new ApiError(403, "This invitation has been revoked");
  }

  if (record.status === "EXPIRED" || new Date(record.expiresAt) < new Date()) {
    throw new ApiError(403, "This invitation has expired");
  }

  if (record.userId && record.userId !== userId) {
    throw new ApiError(403, "This invitation belongs to another account");
  }

  if (record.usageCount >= record.usageLimit) {
    throw new ApiError(403, "This invitation has already been used");
  }

  const order = await prisma.order.findUnique({
    where: { id: record.orderId },
  });
  if (!order || order.userId !== userId) {
    throw new ApiError(403, "This invitation does not belong to your account");
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress;
  const device = req.headers["user-agent"] || "Unknown";

  await prisma.secretAccess.update({
    where: { id: record.id },
    data: {
      userId,
      status: "ACTIVE",
      activatedAt: new Date(),
      lastUsedAt: new Date(),
      lastUsedIP: ip,
      lastUsedDevice: device,
      usageCount: { increment: 1 },
    },
  });

  return res.status(200).json(
    new ApiResponsive(200, { status: "ACTIVE" }, "Secret Collection activated successfully")
  );
});

/* ─── User: Check if user has active Secret Access ──────────────────── */
export const checkAccess = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const now = new Date();
  const activeRecord = await prisma.secretAccess.findFirst({
    where: {
      userId,
      status: { in: ["ACTIVE", "USED"] },
      expiresAt: { gt: now },
    },
    orderBy: { activatedAt: "desc" },
  });

  const hasAccess =
    activeRecord &&
    activeRecord.usageCount < activeRecord.usageLimit;

  return res.status(200).json(
    new ApiResponsive(
      200,
      { hasAccess: !!hasAccess, access: hasAccess ? activeRecord : null },
      "Access check complete"
    )
  );
});

/* ─── User: Verify access token from URL (for activation page) ──────── */
export const verifyActivationToken = asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) throw new ApiError(400, "Token is required");

  const tokenHash = hashToken(token);
  const record = await prisma.secretAccess.findUnique({
    where: { tokenHash },
    include: {
      order: { select: { orderNumber: true } },
    },
  });

  if (!record) {
    return res.status(200).json(
      new ApiResponsive(200, { valid: false, reason: "Invalid token" }, "Token invalid")
    );
  }

  if (record.status === "REVOKED") {
    return res.status(200).json(
      new ApiResponsive(200, { valid: false, reason: "revoked" }, "Token revoked")
    );
  }

  if (record.status === "EXPIRED" || new Date(record.expiresAt) < new Date()) {
    return res.status(200).json(
      new ApiResponsive(200, { valid: false, reason: "expired" }, "Token expired")
    );
  }

  if (record.usageCount >= record.usageLimit) {
    return res.status(200).json(
      new ApiResponsive(200, { valid: false, reason: "already_used" }, "Token already used")
    );
  }

  return res.status(200).json(
    new ApiResponsive(
      200,
      {
        valid: true,
        displayCode: record.displayCode,
        expiresAt: record.expiresAt,
        orderNumber: record.order?.orderNumber,
      },
      "Token valid"
    )
  );
});
