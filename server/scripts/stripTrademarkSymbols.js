import { prisma } from "../config/db.js";

// Removes ™ / ® from product names, SEO text and descriptions, and from the
// product name copied onto verification records.
const strip = (s) => (typeof s === "string" ? s.replace(/[™®]/g, "").replace(/\s{2,}/g, " ").trim() : s);

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, metaTitle: true, metaDescription: true, description: true },
  });
  for (const p of products) {
    const data = {};
    for (const k of ["name", "metaTitle", "metaDescription", "description"]) {
      const v = strip(p[k]);
      if (v !== p[k]) data[k] = v;
    }
    if (Object.keys(data).length) {
      await prisma.product.update({ where: { id: p.id }, data });
      console.log(`+ product ${p.slug}: ${Object.keys(data).join(", ")}`);
    }
  }
  const verifs = await prisma.verification.findMany({ select: { id: true, productName: true } });
  for (const v of verifs) {
    const name = strip(v.productName);
    if (name !== v.productName) {
      await prisma.verification.update({ where: { id: v.id }, data: { productName: name } });
      console.log(`+ verification ${name}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
