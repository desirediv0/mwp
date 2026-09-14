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

const format = (c) => ({
  ...c,
  fileUrl: c.fileUrl ? getFileUrl(c.fileUrl) : null,
});

/* -------------------- PUBLIC -------------------- */
// One permanent page (/certificates) lists every active certificate.
export const getPublicCertificates = asyncHandler(async (req, res) => {
  const certificates = await prisma.certificate.findMany({
    where: { isActive: true },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  res
    .status(200)
    .json(new ApiResponsive(200, { certificates: certificates.map(format) }, "Certificates fetched"));
});

/* -------------------- ADMIN -------------------- */

export const adminListCertificates = asyncHandler(async (req, res) => {
  const certificates = await prisma.certificate.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });
  res
    .status(200)
    .json(new ApiResponsive(200, { certificates: certificates.map(format) }, "Certificates fetched"));
});

export const adminCreateCertificate = asyncHandler(async (req, res) => {
  const { title, displayOrder, isActive } = req.body;
  if (!title) throw new ApiError(400, "Title is required");
  if (!req.file) throw new ApiError(400, "A certificate image or PDF is required");

  const isPdf = req.file.mimetype === "application/pdf";
  const fileUrl = isPdf
    ? await uploadPDF(req.file)
    : await processAndUploadImage(req.file, "certificates");

  const certificate = await prisma.certificate.create({
    data: {
      title,
      fileUrl,
      fileType: isPdf ? "pdf" : "image",
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) || 0 : 0,
      isActive: isActive === undefined ? true : isActive === "true" || isActive === true,
    },
  });
  res.status(201).json(new ApiResponsive(201, { certificate: format(certificate) }, "Certificate created"));
});

export const adminUpdateCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.certificate.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Certificate not found");

  const { title, displayOrder, isActive } = req.body;
  const data = {};
  if (title !== undefined) data.title = title;
  if (displayOrder !== undefined) data.displayOrder = parseInt(displayOrder) || 0;
  if (isActive !== undefined) data.isActive = isActive === "true" || isActive === true;

  if (req.file) {
    if (existing.fileUrl) await deleteFromS3(existing.fileUrl).catch(() => {});
    const isPdf = req.file.mimetype === "application/pdf";
    data.fileUrl = isPdf
      ? await uploadPDF(req.file)
      : await processAndUploadImage(req.file, "certificates");
    data.fileType = isPdf ? "pdf" : "image";
  }

  const certificate = await prisma.certificate.update({ where: { id }, data });
  res.status(200).json(new ApiResponsive(200, { certificate: format(certificate) }, "Certificate updated"));
});

export const adminDeleteCertificate = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.certificate.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Certificate not found");
  if (existing.fileUrl) await deleteFromS3(existing.fileUrl).catch(() => {});
  await prisma.certificate.delete({ where: { id } });
  res.status(200).json(new ApiResponsive(200, {}, "Certificate deleted"));
});

export const adminReorderCertificates = asyncHandler(async (req, res) => {
  const { order } = req.body; // [{ id, displayOrder }]
  if (!Array.isArray(order)) throw new ApiError(400, "order must be an array");
  await prisma.$transaction(
    order.map((o) =>
      prisma.certificate.update({ where: { id: o.id }, data: { displayOrder: parseInt(o.displayOrder) || 0 } })
    )
  );
  res.status(200).json(new ApiResponsive(200, {}, "Order updated"));
});
