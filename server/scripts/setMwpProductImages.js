import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { prisma } from '../config/db.js';
import s3client from '../utils/s3client.js';
import { getFileUrl } from '../utils/deleteFromS3.js';

const slugs = ['ultra-pro', 'power-max', 'rapid-boost', 'her-power', 'her-energy', 'daily-vitality', 'alpha-prime', 'titan-force'];
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const apply = process.argv.includes('--apply');

try {
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs }, isDeleted: false },
    select: { id: true, slug: true, name: true, images: true },
  });
  console.log('Matched:', products.map(p => p.slug).join(', '));
  console.log('No catalog record:', slugs.filter(slug => !products.some(p => p.slug === slug)).join(', ') || 'none');
  if (products.length === 0) throw new Error('No matching products; nothing changed.');
  const assets = await Promise.all(products.map(async product => ({
    product,
    body: await fs.readFile(path.join(root, 'client/public/products/cutouts', `${product.slug}.webp`)),
  })));
  if (apply) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFolder = path.join(root, 'server/backups');
    await fs.mkdir(backupFolder, { recursive: true });
    const backupPath = path.join(backupFolder, `product-images-${timestamp}.json`);
    await fs.writeFile(backupPath, JSON.stringify(products, null, 2));
    console.log('Image-record backup:', backupPath);
    const updates = [];
    for (const { product, body } of assets) {
      const key = `${process.env.UPLOAD_FOLDER || 'mwp'}/products/${timestamp}-${product.slug}.webp`;
      await s3client.send(new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET, Key: key, Body: body,
        ContentType: 'image/webp', ACL: 'public-read',
      }));
      const response = await fetch(getFileUrl(key), { method: 'HEAD' });
      if (!response.ok) throw new Error(`Uploaded image is not readable: ${product.slug} (${response.status})`);
      updates.push({ product, key });
    }
    await prisma.$transaction(async tx => {
      for (const { product, key } of updates) {
        await tx.productImage.updateMany({ where: { productId: product.id }, data: { isPrimary: false } });
        await tx.productImage.create({ data: {
          productId: product.id, url: key, alt: `${product.name} bottle`, isPrimary: true, order: 0,
        } });
      }
    });
    for (const { product, key } of updates) console.log('Saved:', product.slug, getFileUrl(key));
  } else console.log('Dry run complete; pass --apply to upload and save primary images.');
} finally { await prisma.$disconnect(); }
