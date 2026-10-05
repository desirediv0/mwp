import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/db.js';
import s3client from '../utils/s3client.js';
import { getFileUrl } from '../utils/deleteFromS3.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const items = [
  { slug: 'alpha-prime', name: 'ALPHA PRIME™', category: "Men's Performance", formula: 'Testosterone & Performance Formula', sku: 'MWP-ALPHA-PRIME-60' },
  { slug: 'titan-force', name: 'TITAN FORCE™', category: 'Workout & Gym Performance', formula: 'Maximum Performance Formula', sku: 'MWP-TITAN-FORCE-60' },
];
// Pricing file, if supplied: { "alpha-prime": { "price": MRP, "salePrice": sellingPrice, "quantity": stock }, ... }
const pricingArgument = process.argv.find(arg => arg.startsWith('--pricing='));
const pricing = pricingArgument ? JSON.parse(await fs.readFile(pricingArgument.slice('--pricing='.length), 'utf8')) : {};
const publish = process.argv.includes('--publish');
if (process.argv.includes('--match-existing')) {
  for (const [slug, referenceSlug] of [['alpha-prime', 'ultra-pro'], ['titan-force', 'power-max']]) {
    const reference = await prisma.product.findUnique({
      where: { slug: referenceSlug },
      include: { variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
    });
    const variant = reference?.variants[0];
    if (!variant) throw new Error(`Missing pricing reference ${referenceSlug}`);
    pricing[slug] = { price: Number(variant.price), salePrice: Number(variant.salePrice ?? variant.price), quantity: variant.quantity };
    console.log(`${slug}: matching ${referenceSlug}; MRP ${pricing[slug].price}, selling ${pricing[slug].salePrice}, stock ${pricing[slug].quantity}`);
  }
}
if (publish) {
  for (const item of items) {
    const values = pricing[item.slug];
    if (!values || !Number.isFinite(values.price) || values.price <= 0
      || !Number.isFinite(values.salePrice) || values.salePrice <= 0 || values.salePrice > values.price
      || !Number.isInteger(values.quantity) || values.quantity < 0) {
      throw new Error(`Valid MRP, selling price and stock required for ${item.slug}.`);
    }
  }
}

try {
  for (const item of items) {
    const existing = await prisma.product.findUnique({ where: { slug: item.slug }, include: { images: true, variants: true } });
    if (existing?.isDeleted) throw new Error(`${item.slug} is deleted; restore it from admin instead.`);
    const category = await prisma.category.findFirst({ where: { name: { equals: item.category, mode: 'insensitive' } } });
    if (!category) throw new Error(`Missing existing category: ${item.category}`);
    let key = existing?.images.find(image => image.isPrimary)?.url;
    if (!key) {
      const body = await fs.readFile(path.join(root, 'client/public/products/cutouts', `${item.slug}.webp`));
      key = `${process.env.UPLOAD_FOLDER || 'mwp'}/products/${Date.now()}-${item.slug}.webp`;
      await s3client.send(new PutObjectCommand({ Bucket: process.env.SPACES_BUCKET, Key: key, Body: body, ContentType: 'image/webp', ACL: 'public-read' }));
      const response = await fetch(getFileUrl(key), { method: 'HEAD', signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error(`Image upload verification failed: ${item.slug}`);
    }
    const product = await prisma.$transaction(async tx => {
      let product = existing;
      if (!product) {
        product = await tx.product.create({ data: {
          name: item.name, slug: item.slug, isActive: false, ourProduct: true, featured: true,
          description: `<h2>${item.formula}</h2><p>MWP ${item.name}. 60 capsules per bottle.</p>`,
          dosageForm: 'Capsule', primaryCategoryId: category.id,
          metaTitle: `${item.name} | MWP Supplements`, metaDescription: `${item.formula}. 60 capsules.`,
          tags: [item.category], categories: { create: [{ categoryId: category.id, isPrimary: true }] },
        } });
      }
      if (!existing?.images.some(image => image.isPrimary)) {
        await tx.productImage.create({ data: { productId: product.id, url: key, isPrimary: true, order: 0, alt: `${item.name} bottle` } });
      }
      if (publish) {
        const values = pricing[item.slug];
        if (existing?.variants.length > 1) throw new Error(`${item.slug} has multiple variants; edit pricing in admin.`);
        const variant = existing?.variants[0];
        const data = { price: values.price, salePrice: values.salePrice, quantity: values.quantity, isActive: true };
        if (variant) await tx.productVariant.update({ where: { id: variant.id }, data });
        else await tx.productVariant.create({ data: { ...data, productId: product.id, sku: item.sku } });
        product = await tx.product.update({ where: { id: product.id }, data: { hasVariants: true, isActive: true } });
      }
      return product;
    });
    console.log(`${product.slug}: ${product.isActive ? 'published' : 'draft saved; price and stock pending'}; image ${getFileUrl(key)}`);
  }
} finally { await prisma.$disconnect(); }
