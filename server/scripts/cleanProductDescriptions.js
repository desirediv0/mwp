import { prisma } from "../config/db.js";

// Removes the auto-generated "Ingredients" list and sourcing note from product
// descriptions (seeded earlier). The ingredient list now lives in the
// "Inside the formula" section, so it was showing twice.
const SEEDED = /<h3>\s*Ingredients\s*<\/h3>\s*<p>[\s\S]*?<\/p>\s*<p><em>[\s\S]*?<\/em><\/p>/i;

async function main() {
  const products = await prisma.product.findMany({ select: { id: true, slug: true, description: true } });
  for (const p of products) {
    if (!p.description || !SEEDED.test(p.description)) continue;
    await prisma.product.update({ where: { id: p.id }, data: { description: p.description.replace(SEEDED, "").trim() } });
    console.log(`+ cleaned ${p.slug}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
