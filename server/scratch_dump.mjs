import { prisma } from "./config/db.js";
for (const slug of ["power-max","rapid-boost","daily-vitality","her-power"]) {
  const p = await prisma.product.findUnique({ where: { slug }, include: { ingredientItems: { orderBy: { displayOrder: "asc" } }, variants: { include: { attributes: { include: { attributeValue: { include: { attribute: true } } } } } } } });
  console.log("\n=====", slug, p.name);
  for (const k of ["metaTitle","metaDescription","keywords","description","mainBenefits","bestFor","dosageForm","servingSize","whenToTake","shippingReturn","legalInfo"]) console.log(" ", k, "=", JSON.stringify(p[k])?.slice(0, 400));
  console.log("  highlights =", JSON.stringify(p.highlights)?.slice(0, 700));
  console.log("  pageContent =", JSON.stringify(p.pageContent)?.slice(0, 500));
  console.log("  variants:", p.variants.map(v => `${v.sku} ${v.attributes.map(a => a.attributeValue.attribute.name + ":" + a.attributeValue.value + "(" + a.attributeValue.id.slice(0,6) + ")").join(",")}`));
  console.log("  ingredientItems:", p.ingredientItems.map(i => `${i.name} | ${i.amount} | ${i.type} | ${i.source}`));
}
await prisma.$disconnect();
