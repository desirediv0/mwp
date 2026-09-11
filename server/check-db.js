import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const sections = await prisma.productSection.findMany();
  console.log("Product Sections in DB:", JSON.stringify(sections, null, 2));

  const items = await prisma.productSectionItem.findMany();
  console.log("Product Section Items count:", items.length);

  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      productType: true,
      isActive: true
    }
  });
  console.log("Products in DB:", JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

