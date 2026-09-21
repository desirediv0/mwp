import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponsive } from "../utils/ApiResponsive.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { prisma } from "../config/db.js";
import {
  processAndUploadImage,
  uploadPDF,
  getFileUrl,
} from "../middlewares/multer.middlerware.js";
import { deleteFromS3 } from "../utils/deleteFromS3.js";

// Permanent, unpredictable, human-shareable code — e.g. MWP-8F72K9X4.
// Generated once at creation and NEVER regenerated or edited afterwards.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // no 0/O/1/I ambiguity
const generateCode = () => {
  let s = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `MWP-${s}`;
};

const generateUniqueCode = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateCode();
    const existing = await prisma.verification.findUnique({ where: { verificationCode: code } });
    if (!existing) return code;
  }
  throw new ApiError(500, "Failed to generate a unique verification code, please retry");
};

const resolveFile = (url) => (url ? getFileUrl(url) : null);

const formatAdmin = (v) => ({
  ...v,
  productImage: resolveFile(v.productImage),
  coaUrl: resolveFile(v.coaUrl),
  certificateUrl: resolveFile(v.certificateUrl),
  badgeImage: resolveFile(v.badgeImage),
});

// Only safe, public-facing fields — never internal ids, audit info, or admin metadata.
const formatPublic = (v) => ({
  verificationCode: v.verificationCode,
  productName: v.productName,
  productSlug: v.productSlug,
  productImage: resolveFile(v.productImage),
  batchNumber: v.batchNumber,
  lotNumber: v.lotNumber,
  manufacturingDate: v.manufacturingDate,
  expiryDate: v.expiryDate,
  status: v.status,
  authenticityStatus: v.authenticityStatus,
  coaUrl: resolveFile(v.coaUrl),
  certificateUrl: resolveFile(v.certificateUrl),
  description: v.description,
  ingredients: v.ingredients,
  origin: v.origin,
  badgeType: v.badgeType,
  badgeImage: resolveFile(v.badgeImage),
});

const logAudit = (verificationId, action, detail, performedBy) =>
  prisma.verificationAuditLog
    .create({ data: { verificationId, action, detail: detail || null, performedBy: performedBy || null } })
    .catch(() => {});

/* -------------------- PUBLIC -------------------- */

export const publicVerify = asyncHandler(async (req, res) => {
  const { verificationCode } = req.params;

  const record = await prisma.verification.findUnique({
    where: { verificationCode: String(verificationCode).toUpperCase() },
  });

  if (!record || !record.isActive) {
    return res
      .status(200)
      .json(new ApiResponsive(200, { verified: false }, "Verification record not found"));
  }

  res.status(200).json(
    new ApiResponsive(
      200,
      { verified: record.status === "ACTIVE", verification: formatPublic(record) },
      "Verification fetched"
    )
  );
});

/* -------------------- ADMIN -------------------- */

export const adminListVerifications = asyncHandler(async (req, res) => {
  const { search, status, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { productName: { contains: search, mode: "insensitive" } },
      { verificationCode: { contains: search, mode: "insensitive" } },
      { batchNumber: { contains: search, mode: "insensitive" } },
      { lotNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  const take = Math.min(parseInt(limit) || 20, 100);
  const skip = (Math.max(parseInt(page) || 1, 1) - 1) * take;

  const [items, total, counts] = await Promise.all([
    prisma.verification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.verification.count({ where }),
    prisma.verification.groupBy({ by: ["status"], _count: true }),
  ]);

  const statusCounts = counts.reduce((acc, c) => ({ ...acc, [c.status]: c._count }), {});

  res.status(200).json(
    new ApiResponsive(
      200,
      {
        verifications: items.map(formatAdmin),
        total,
        page: parseInt(page) || 1,
        limit: take,
        statusCounts,
      },
      "Verifications fetched"
    )
  );
});

export const adminGetVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const record = await prisma.verification.findUnique({
    where: { id },
    include: { auditLogs: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  if (!record) throw new ApiError(404, "Verification not found");
  res.status(200).json(new ApiResponsive(200, { verification: formatAdmin(record) }, "Verification fetched"));
});

export const adminGetVerificationByCode = asyncHandler(async (req, res) => {
  const { verificationCode } = req.params;
  const record = await prisma.verification.findUnique({
    where: { verificationCode: String(verificationCode).toUpperCase() },
  });
  if (!record) throw new ApiError(404, "Verification not found");
  res.status(200).json(new ApiResponsive(200, { verification: formatAdmin(record) }, "Verification fetched"));
});

const parseDate = (v) => (v ? new Date(v) : null);
const parseIngredients = (v) => {
  if (v === undefined) return undefined;
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(v)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
};

export const adminCreateVerification = asyncHandler(async (req, res) => {
  const {
    productId,
    productName,
    productSlug,
    batchNumber,
    lotNumber,
    manufacturingDate,
    expiryDate,
    authenticityStatus,
    status,
    description,
    ingredients,
    origin,
    badgeType,
  } = req.body;

  if (!productName) throw new ApiError(400, "Product name is required");

  let productImage = null;
  let coaUrl = null;
  let certificateUrl = null;
  let badgeImage = null;

  if (req.files?.productImage?.[0]) {
    productImage = await processAndUploadImage(req.files.productImage[0], "verification");
  }
  if (req.files?.badgeImage?.[0]) {
    badgeImage = await processAndUploadImage(req.files.badgeImage[0], "verification/badges");
  }
  if (req.files?.coa?.[0]) {
    const f = req.files.coa[0];
    coaUrl = f.mimetype === "application/pdf" ? await uploadPDF(f) : await processAndUploadImage(f, "verification/coa");
  }
  if (req.files?.certificate?.[0]) {
    const f = req.files.certificate[0];
    certificateUrl =
      f.mimetype === "application/pdf" ? await uploadPDF(f) : await processAndUploadImage(f, "verification/certificates");
  }

  const verificationCode = await generateUniqueCode();

  const record = await prisma.verification.create({
    data: {
      verificationCode,
      productId: productId || null,
      productName,
      productSlug: productSlug || null,
      productImage,
      batchNumber: batchNumber || null,
      lotNumber: lotNumber || null,
      manufacturingDate: parseDate(manufacturingDate),
      expiryDate: parseDate(expiryDate),
      authenticityStatus: authenticityStatus || "VERIFIED",
      status: status || "ACTIVE",
      description: description || null,
      coaUrl,
      certificateUrl,
      ingredients: parseIngredients(ingredients) || [],
      origin: origin || null,
      badgeType: badgeType || null,
      badgeImage,
      createdBy: req.admin?.id || null,
      updatedBy: req.admin?.id || null,
    },
  });

  await logAudit(record.id, "CREATED", `Verification created for "${productName}"`, req.admin?.id);

  res.status(201).json(new ApiResponsive(201, { verification: formatAdmin(record) }, "Verification created"));
});

export const adminUpdateVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.verification.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Verification not found");

  // verificationCode is immutable — silently ignore any client-supplied value.
  const {
    productId,
    productName,
    productSlug,
    batchNumber,
    lotNumber,
    manufacturingDate,
    expiryDate,
    authenticityStatus,
    status,
    description,
    ingredients,
    origin,
    badgeType,
  } = req.body;

  const data = {};
  const auditNotes = [];

  if (productId !== undefined) data.productId = productId || null;
  if (productName !== undefined) data.productName = productName;
  if (productSlug !== undefined) data.productSlug = productSlug || null;
  if (batchNumber !== undefined) {
    data.batchNumber = batchNumber || null;
    if (batchNumber !== existing.batchNumber) auditNotes.push("BATCH_UPDATED");
  }
  if (lotNumber !== undefined) data.lotNumber = lotNumber || null;
  if (manufacturingDate !== undefined) data.manufacturingDate = parseDate(manufacturingDate);
  if (expiryDate !== undefined) data.expiryDate = parseDate(expiryDate);
  if (authenticityStatus !== undefined) data.authenticityStatus = authenticityStatus;
  if (status !== undefined && status !== existing.status) {
    data.status = status;
    auditNotes.push(`STATUS_CHANGED:${existing.status}->${status}`);
  }
  if (description !== undefined) data.description = description || null;
  if (ingredients !== undefined) data.ingredients = parseIngredients(ingredients) || [];
  if (origin !== undefined) data.origin = origin || null;
  if (badgeType !== undefined) data.badgeType = badgeType || null;

  if (req.files?.productImage?.[0]) {
    if (existing.productImage) await deleteFromS3(existing.productImage).catch(() => {});
    data.productImage = await processAndUploadImage(req.files.productImage[0], "verification");
  }
  if (req.files?.badgeImage?.[0]) {
    if (existing.badgeImage) await deleteFromS3(existing.badgeImage).catch(() => {});
    data.badgeImage = await processAndUploadImage(req.files.badgeImage[0], "verification/badges");
    auditNotes.push("BADGE_UPDATED");
  }
  if (req.files?.coa?.[0]) {
    if (existing.coaUrl) await deleteFromS3(existing.coaUrl).catch(() => {});
    const f = req.files.coa[0];
    data.coaUrl = f.mimetype === "application/pdf" ? await uploadPDF(f) : await processAndUploadImage(f, "verification/coa");
    auditNotes.push("COA_UPDATED");
  }
  if (req.files?.certificate?.[0]) {
    if (existing.certificateUrl) await deleteFromS3(existing.certificateUrl).catch(() => {});
    const f = req.files.certificate[0];
    data.certificateUrl =
      f.mimetype === "application/pdf" ? await uploadPDF(f) : await processAndUploadImage(f, "verification/certificates");
    auditNotes.push("CERTIFICATE_UPDATED");
  }

  data.updatedBy = req.admin?.id || null;

  const record = await prisma.verification.update({ where: { id }, data });

  if (auditNotes.length === 0) auditNotes.push("PRODUCT_INFO_UPDATED");
  await logAudit(record.id, auditNotes.join(","), null, req.admin?.id);

  res.status(200).json(new ApiResponsive(200, { verification: formatAdmin(record) }, "Verification updated"));
});

export const adminUpdateVerificationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ["ACTIVE", "INACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"];
  if (!validStatuses.includes(status)) throw new ApiError(400, "Invalid status");

  const existing = await prisma.verification.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Verification not found");

  const record = await prisma.verification.update({
    where: { id },
    data: { status, updatedBy: req.admin?.id || null },
  });

  await logAudit(record.id, `STATUS_CHANGED:${existing.status}->${status}`, null, req.admin?.id);

  res.status(200).json(new ApiResponsive(200, { verification: formatAdmin(record) }, "Status updated"));
});

// Soft delete by default (isActive=false) — the permanent URL keeps resolving
// and shows a clear "revoked/unavailable" state rather than a dead link.
export const adminDeleteVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hard } = req.query;
  const existing = await prisma.verification.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Verification not found");

  if (hard === "true") {
    if (existing.productImage) await deleteFromS3(existing.productImage).catch(() => {});
    if (existing.coaUrl) await deleteFromS3(existing.coaUrl).catch(() => {});
    if (existing.certificateUrl) await deleteFromS3(existing.certificateUrl).catch(() => {});
    if (existing.badgeImage) await deleteFromS3(existing.badgeImage).catch(() => {});
    await prisma.verification.delete({ where: { id } });
    return res.status(200).json(new ApiResponsive(200, {}, "Verification permanently deleted"));
  }

  const record = await prisma.verification.update({
    where: { id },
    data: { isActive: false, status: "REVOKED", updatedBy: req.admin?.id || null },
  });
  await logAudit(record.id, "REVOKED", "Deactivated via admin delete action", req.admin?.id);

  res.status(200).json(new ApiResponsive(200, { verification: formatAdmin(record) }, "Verification revoked"));
});

export const adminReactivateVerification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.verification.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Verification not found");

  const record = await prisma.verification.update({
    where: { id },
    data: { isActive: true, status: "ACTIVE", updatedBy: req.admin?.id || null },
  });
  await logAudit(record.id, "REACTIVATED", null, req.admin?.id);

  res.status(200).json(new ApiResponsive(200, { verification: formatAdmin(record) }, "Verification reactivated"));
});
