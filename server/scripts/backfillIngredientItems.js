import { prisma } from "../config/db.js";

// One-time backfill: copies each product's Verification.ingredients JSON
// ({ name, amount, origin, description }) into editable ProductIngredientItem
// rows so the admin can manage them and the product page can render them.
// Skips any product that already has ingredient items.
async function main() {
  const verifications = await prisma.verification.findMany({
    where: { productId: { not: null } },
  });

  for (const v of verifications) {
    const existing = await prisma.productIngredientItem.count({ where: { productId: v.productId } });
    if (existing > 0) {
      console.log(`= ${v.productName}: already has ${existing} ingredient items, skipped`);
      continue;
    }

    const list = Array.isArray(v.ingredients) ? v.ingredients : [];
    if (list.length === 0) continue;

    await prisma.productIngredientItem.createMany({
      data: list.map((i, idx) => ({
        productId: v.productId,
        name: i.name,
        amount: i.amount || null,
        source: i.origin || i.country || null,
        keyBenefit: null,
        description: i.description || i.note || i.name,
        displayOrder: idx,
      })),
    });
    console.log(`+ ${v.productName}: ${list.length} ingredient items created`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
