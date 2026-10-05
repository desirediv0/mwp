import 'dotenv/config';
import { prisma } from '../config/db.js';
const slugs = ['ultra-pro', 'power-max', 'rapid-boost', 'her-power', 'her-energy', 'daily-vitality', 'alpha-prime', 'titan-force'];
try {
  await prisma.$transaction(async tx => {
    let attribute = await tx.attribute.findFirst({ where: { name: 'Pack size' } });
    if (!attribute) attribute = await tx.attribute.create({ data: { name: 'Pack size', inputType: 'select' } });
    const products = await tx.product.findMany({ where: { slug: { in: slugs }, isDeleted: false }, include: { variants: { include: { attributes: { include: { attributeValue: true } } } } } });
    if (products.length !== 8) throw new Error('Expected eight MWP products');
    for (const product of products) {
      const value = product.slug === 'power-max' ? '60 tablets' : '60 capsules';
      const pack = await tx.attributeValue.upsert({ where: { attributeId_value: { attributeId: attribute.id, value } }, create: { attributeId: attribute.id, value }, update: {} });
      for (const variant of product.variants) {
        // Preserve admin-edited pack options on subsequent runs.
        if (!variant.attributes.some(link => link.attributeValue.attributeId === attribute.id)) {
          await tx.variantAttributeValue.upsert({ where: { variantId_attributeValueId: { variantId: variant.id, attributeValueId: pack.id } }, create: { variantId: variant.id, attributeValueId: pack.id }, update: {} });
        }
      }
      await tx.product.update({ where: { id: product.id }, data: { hasVariants: true } });
      console.log(`${product.slug}: ${product.variants.length} existing variant(s), ${value}`);
    }
  });
} finally { await prisma.$disconnect(); }
