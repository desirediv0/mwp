import { prisma } from "../config/db.js";

// Fills the blanks that can be taken from facts already on the site, and never overwrites anything:
//  - description: the product's own description text
//  - origin / badge type: the brand-wide statements already used on the site
// Ingredients, batch, lot, dates and COA are NOT guessed: add them in Admin > Verifications.
// Run:  node -r dotenv/config scripts/fillVerificationBasics.js

const ORIGIN = "Formulated in the USA — Globally Sourced Ingredients";
const BADGE = "Third-Party Lab Tested";

const plain = (html) =>
  String(html || "")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .split("\n")
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n\n");

const rows = await prisma.verification.findMany({ include: { product: { select: { description: true } } } });
for (const v of rows) {
  const data = {};
  if (!v.description && v.product?.description) data.description = plain(v.product.description);
  if (!v.origin) data.origin = ORIGIN;
  if (!v.badgeType) data.badgeType = BADGE;
  if (!Object.keys(data).length) {
    console.log(`${v.productName}: nothing to fill`);
    continue;
  }
  await prisma.verification.update({ where: { id: v.id }, data });
  await prisma.verificationAuditLog.create({ data: { verificationId: v.id, action: "UPDATED", detail: `Filled blanks: ${Object.keys(data).join(", ")}` } }).catch(() => {});
  console.log(`${v.productName}: filled ${Object.keys(data).join(", ")}`);
}
await prisma.$disconnect();
